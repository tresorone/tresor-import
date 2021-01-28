import Big from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
  timeRegex,
} from '@/helper';

const findISIN = text => {
  const isinIdx = text.findIndex(t => t === 'ISIN');
  if (isinIdx >= 0) {
    return text[isinIdx + 3];
  }
};

const findCompany = text => {
  // New format
  const isinIdx = text.findIndex(t => t === 'ISIN');
  if (isinIdx >= 0) {
    return text[isinIdx + 1];
  }
  // Old format (Testfile from 2015)
  const wknIdx = text.findIndex(t => t === 'WKN:');
  if (wknIdx >= 0) {
    return text[wknIdx + 2];
  }
};

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
  const wknIdx = content.findIndex(line => line === 'WKN');
  if (wknIdx >= 0) {
    return content[wknIdx + 3];
  }
  // Older type of File (Testfile from 2005)
  const oldWknIdx = content.findIndex(line => line === 'WKN:');
  if (oldWknIdx >= 0) {
    return content[oldWknIdx + 1];
  }
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
  let idx = textArr.findIndex(t => t.toLowerCase() === 'umsatz');
  if (idx >= 0) {
    return parseGermanNum(textArr[idx + 2]);
  }
  idx = textArr.indexOf('ST');
  if (idx >= 0) {
    return parseGermanNum(textArr[idx + 1]);
  }
};

const findDividendShares = textArr => {
  const sharesLine = textArr.find(t => t.includes('ST'));
  const shares = sharesLine.split('ST')[1];
  return parseGermanNum(shares);
};

const findAmount = textArr => {
  let lineNumber = textArr.findIndex(line => line.toLowerCase() === 'kurswert');
  if (lineNumber >= 0) {
    return parseGermanNum(textArr[lineNumber + 2]);
  }

  lineNumber = textArr.indexOf('Ges. Preis inkl. Ausgabegeb.');
  if (lineNumber >= 0) {
    return parseGermanNum(textArr[lineNumber + 3]);
  }

  // Sometimes the offset is two because the discount is on the same line.
  lineNumber = textArr.findIndex(line =>
    line.startsWith('Ges. Preis inkl. Ausgabegeb.')
  );
  if (lineNumber >= 0) {
    return parseGermanNum(textArr[lineNumber + 2]);
  }
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
    if (lineNumber >= 0) {
      totalFee = totalFee.plus(parseGermanNum(content[lineNumber + 2]));
    }
  }

  // Eig. Spesen
  {
    const lineNumber = content.findIndex(line => line.includes('Eig. Spesen'));
    if (lineNumber >= 0) {
      totalFee = totalFee.plus(parseGermanNum(content[lineNumber + 2]));
    }
  }

  // Grundgebühr
  {
    const lineNumber = content.findIndex(line => line.includes('Grundgebühr'));
    if (lineNumber >= 0) {
      totalFee = totalFee.plus(parseGermanNum(content[lineNumber + 2]));
    }
  }

  // Bonifikation
  {
    const lineNumber = content.findIndex(line => line.startsWith('BONIFIKAT.'));
    if (lineNumber >= 0) {
      totalFee = totalFee.minus(parseGermanNum(content[lineNumber + 2]));
    }
  }

  // CortalConsors Discount
  {
    const lineNumber = content.findIndex(line =>
      line.startsWith('abz. CortalConsors Discount')
    );
    if (lineNumber >= 0) {
      totalFee = totalFee.minus(parseGermanNum(content[lineNumber + 2]));
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
  return lineNumber > 0 && content[lineNumber + 1].toLowerCase() === 'kauf';
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

export const canParseDocument = (pages, extension) => {
  const firstPageContent = pages[0];
  return (
    extension === 'pdf' &&
    firstPageContent.some(line => line.includes('Cortal Consors')) &&
    (isBuy(firstPageContent) ||
      isSell(firstPageContent) ||
      isDividend(firstPageContent))
  );
};

const parseData = content => {
  let activity = {
    broker: 'cortalconsors',
  };
  let date, time;
  if (isBuy(content)) {
    activity.type = 'Buy';
    activity.wkn = findBuySellWKN(content);
    const isin = findISIN(content);
    if (isin !== undefined) {
      activity.isin = isin;
    }
    activity.company = findCompany(content);
    activity.shares = findShares(content);
    activity.amount = findAmount(content);
    activity.price = +Big(activity.amount).div(Big(activity.shares));
    activity.fee = findFee(content);
    activity.tax = 0;
    date = findDateBuySell(content);
    time = findOrderTime(content);
  } else if (isSell(content)) {
    activity.type = 'Sell';
    activity.wkn = findBuySellWKN(content);
    activity.isin = findISIN(content);
    activity.company = findCompany(content);
    activity.shares = findShares(content);
    activity.amount = findAmount(content);
    activity.price = +Big(activity.amount).div(Big(activity.shares));
    activity.fee = findFee(content);
    activity.tax = findTax(content);
    date = findDateBuySell(content);
    time = findOrderTime(content);
  } else if (isDividend(content)) {
    activity.type = 'Dividend';
    activity.wkn = findDividendWKN(content);
    activity.company = findDividendCompany(content);
    activity.shares = findDividendShares(content);
    activity.amount = findPayout(content);
    activity.price = +Big(activity.amount).div(Big(activity.shares));
    activity.fee = 0;
    activity.tax = findDividendTax(content);
    date = findDateDividend(content);
  }
  [activity.date, activity.datetime] = createActivityDateTime(
    date,
    time,
    'dd.MM.yyyy',
    'dd.MM.yyyy HH:mm:ss'
  );
  return validateActivity(activity);
};

export const parsePages = contents => {
  return {
    activities: [parseData(contents[0])],
    status: 0,
  };
};
