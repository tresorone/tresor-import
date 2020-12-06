import Big from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
  timeRegex,
} from '@/helper';

const findISIN = text => text[text.findIndex(t => t === 'ISIN') + 3];

const findCompany = text => text[text.findIndex(t => t === 'ISIN') + 1];

const findDividendCompany = content => {
  let lineNumber = content.findIndex(
    line =>
      line.includes('ERTRAGSGUTSCHRIFT') ||
      line.includes('DIVIDENDENGUTSCHRIFT')
  );

  if (lineNumber <= 0) {
    return undefined;
  }

  return content[lineNumber + 2];
};

const findBuySellWKN = content => {
  return content[content.findIndex(line => line === 'WKN') + 3];
};

const findDividendWKN = content => {
  let lineNumber = content.findIndex(
    line =>
      line.includes('ERTRAGSGUTSCHRIFT') ||
      line.includes('DIVIDENDENGUTSCHRIFT')
  );

  if (lineNumber <= 0) {
    return undefined;
  }

  return content[lineNumber + 1].split('WKN:').pop().trim();
};

const findDateBuySell = textArr => {
  const lineNumber = textArr.findIndex(
    line => line.toLowerCase() === 'wertpapierabrechnung'
  );

  return textArr[lineNumber + 2].substr(3, 10).trim();
};

const findOrderTime = content => {
  // Extract the time before the line with order time which contains "18:20:51"
  const lineNumber = content.findIndex(line => line === 'UM');

  if (lineNumber <= 0) {
    return undefined;
  }

  const lineContent = content[lineNumber + 1];
  if (lineContent === undefined || !timeRegex(true).test(lineContent)) {
    return undefined;
  }

  return lineContent.trim();
};

const findDateDividend = content => {
  const line = content[content.findIndex(line => line.startsWith('WERT'))];
  return line.split(/\s+/)[1];
};

const findShares = textArr => {
  const idx = textArr.findIndex(t => t.toLowerCase() === 'umsatz');
  const shares = textArr[idx + 2];

  return parseGermanNum(shares);
};

const findDividendShares = textArr => {
  const sharesLine = textArr.find(t => t.includes('ST'));
  const shares = sharesLine.split('ST')[1];
  return parseGermanNum(shares);
};

const findAmount = textArr => {
  const idx = textArr.findIndex(t => t.toLowerCase() === 'kurswert');
  const amount = textArr[idx + 2];

  return parseGermanNum(amount);
};

const findPayout = content => {
  const lineNumber = content.findIndex(line => line.includes('BRUTTO'));

  if (lineNumber <= 0) {
    return undefined;
  }

  return parseGermanNum(content[lineNumber].split(/\s+/)[2]);
};

const findFee = content => {
  let totalFee = Big(0);

  // Provision:
  {
    const lineNumber = content.findIndex(line => line.includes('Provision'));

    if (lineNumber > 0) {
      totalFee = totalFee.plus(parseGermanNum(content[lineNumber + 2]));
    }
  }

  // Eig. Spesen
  {
    const lineNumber = content.findIndex(line => line.includes('Eig. Spesen'));

    if (lineNumber > 0) {
      totalFee = totalFee.plus(parseGermanNum(content[lineNumber + 2]));
    }
  }

  // Grundgebühr
  {
    const lineNumber = content.findIndex(line => line.includes('Grundgebühr'));

    if (lineNumber > 0) {
      totalFee = totalFee.plus(parseGermanNum(content[lineNumber + 2]));
    }
  }

  return +totalFee;
};

const findTax = textArr => {
  const kapstIdx = textArr.findIndex(t => t.toLowerCase() === 'kapst');
  const solzIdx = textArr.findIndex(t => t.toLowerCase() === 'solz');
  const churchIdx = textArr.findIndex(t => t.toLowerCase() === 'kirch');

  const kapst = kapstIdx >= 0 ? textArr[kapstIdx + 3] : null;
  const solz = solzIdx >= 0 ? textArr[solzIdx + 3] : null;
  const church = churchIdx >= 0 ? textArr[churchIdx + 3] : null;

  return +Big(parseGermanNum(kapst))
    .plus(Big(parseGermanNum(solz)))
    .plus(Big(parseGermanNum(church)));
};

const findDividendTax = textArr => {
  const endTaxLine = textArr.findIndex(t => t.includes('WERT'));
  const sum = textArr.reduce((acc, t, i) => {
    const isTax = t.includes('KAPST') || t.includes('SOLZ');

    if (isTax && i < endTaxLine) {
      let taxLineSplitted = textArr[i].split('EUR');
      let taxAmountString = taxLineSplitted[taxLineSplitted.length - 1];
      return acc.plus(Big(parseGermanNum(taxAmountString)));
    }
    return acc;
  }, Big(0));

  return Math.abs(+sum);
};

const isBuy = content => {
  const lineNumber = content.findIndex(line =>
    line.includes('WERTPAPIERABRECHNUNG')
  );
  return lineNumber > 0 && content[lineNumber + 1] === 'KAUF';
};

const isSell = content => {
  const lineNumber = content.findIndex(line =>
    line.includes('WERTPAPIERABRECHNUNG')
  );
  return lineNumber > 0 && content[lineNumber + 1] === 'VERKAUF';
};

const isDividend = content =>
  content.some(
    line =>
      line.includes('DIVIDENDENGUTSCHRIFT') ||
      line.includes('ERTRAGSGUTSCHRIFT')
  );

export const canParsePage = (content, extension) =>
  extension === 'pdf' &&
  content.some(line => line.includes('Cortal Consors')) &&
  (isBuy(content) || isSell(content) || isDividend(content));

const parseData = content => {
  let type, date, time, isin, wkn, company, shares, price, amount, fee, tax;

  if (isBuy(content)) {
    type = 'Buy';
    wkn = findBuySellWKN(content);
    isin = findISIN(content);
    company = findCompany(content);
    date = findDateBuySell(content);
    time = findOrderTime(content);
    shares = findShares(content);
    amount = findAmount(content);
    price = +Big(amount).div(Big(shares));
    fee = findFee(content);
    tax = 0;
  } else if (isSell(content)) {
    type = 'Sell';
    wkn = findBuySellWKN(content);
    isin = findISIN(content);
    company = findCompany(content);
    date = findDateBuySell(content);
    time = findOrderTime(content);
    shares = findShares(content);
    amount = findAmount(content);
    price = +Big(amount).div(Big(shares));
    fee = findFee(content);
    tax = findTax(content);
  } else if (isDividend(content)) {
    type = 'Dividend';
    wkn = findDividendWKN(content);
    company = findDividendCompany(content);
    date = findDateDividend(content);
    shares = findDividendShares(content);
    amount = findPayout(content);
    price = +Big(amount).div(Big(shares));
    fee = 0;
    tax = findDividendTax(content);
  }

  const [parsedDate, parsedDateTime] = createActivityDateTime(
    date,
    time,
    'dd.MM.yyyy',
    'dd.MM.yyyy HH:mm:ss'
  );

  const activity = {
    broker: 'cortalconsors',
    type,
    date: parsedDate,
    datetime: parsedDateTime,
    wkn,
    company,
    shares,
    price,
    amount,
    fee,
    tax,
  };

  if (isin !== undefined) {
    activity.isin = isin;
  }

  return validateActivity(activity);
};

export const parsePages = contents => {
  return {
    activities: [parseData(contents[0])],
    status: 0,
  };
};
