import Big from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  findFirstIsinIndexInArray,
  createActivityDateTime,
  timeRegex,
} from '@/helper';

const findISIN = textArr => {
  return textArr[findFirstIsinIndexInArray(textArr)];
};

const findWKN = textArr => {
  // for older dividend files
  const wknIndexOld = textArr.findIndex(line => line.includes('WKN: '));
  if (wknIndexOld >= 0) {
    return textArr[wknIndexOld].split(/\s+/)[3];
  }

  // for newer dividend files
  const wknStringIndex = textArr.indexOf('WKN');
  if (wknStringIndex >= 0) {
    const wknIndexOffset = findFirstIsinIndexInArray(
      textArr.slice(wknStringIndex)
    );
    return textArr[wknStringIndex + wknIndexOffset - 1];
  }
  return undefined;
};

const findCompany = textArr => {
  let indexIsinWkn = textArr.indexOf('ISIN');
  // For older documents there is only a wkn
  if (indexIsinWkn < 0) {
    indexIsinWkn = textArr.findIndex(line => line.includes('WKN: '));
  }
  const name_index_one = textArr[indexIsinWkn + 1];
  // Sometimes a company name is split in two during JSONifying. Only
  // happens in newer documents that have an isin
  if (findFirstIsinIndexInArray(textArr.slice(indexIsinWkn)) > 3) {
    return name_index_one.concat(' ', textArr[indexIsinWkn + 2]);
  }
  return name_index_one;
};

const findBuySellLineNumber = content => {
  return content.findIndex(
    line =>
      line.toLowerCase() === 'orderabrechnung' ||
      line.toLowerCase() === 'wertpapierabrechnung'
  );
};

const findDateBuySell = content => {
  // Before 12/2015 the headline is 'Wertpapierabrechnung'
  const lineNumber = findBuySellLineNumber(content);
  if (lineNumber <= 0) {
    return undefined;
  }
  // Might be a super old file, test from 2003
  if (
    (content[lineNumber + 1].toLowerCase().startsWith('kauf') ||
      content[lineNumber + 1].toLowerCase().startsWith('verkauf')) &&
    content[lineNumber + 1].toLowerCase().includes('am')
  ) {
    return content[lineNumber + 1].split(/\s+/)[2];
  }

  let offset = 0;
  let substrFrom = 3;
  if (content[lineNumber + 2].toLowerCase() === 'am') {
    offset = 1;
    substrFrom = 0;
  }

  return content[lineNumber + 2 + offset].substr(substrFrom).trim();
};

const findOrderTime = content => {
  // Extract the time after the line with order time which contains "15:57:49"
  const lineNumber = findBuySellLineNumber(content);
  if (lineNumber <= 0) {
    return undefined;
  }

  const offset = content[lineNumber + 2].toLowerCase() !== 'am' ? 0 : 1;
  const lineContent = content[lineNumber + 4 + offset];
  if (lineContent === undefined || !timeRegex(true).test(lineContent)) {
    return undefined;
  }

  return lineContent.trim();
};

const findDateDividend = textArr => {
  const keyword = 'valuta';
  const dateLine = textArr.find(t => t.toLowerCase().includes(keyword));
  if (dateLine !== undefined) {
    return dateLine.substr(keyword.length).trim();
  }

  const keywordOld = 'EX-TAG';
  const dateLineOld = textArr.find(t => t.includes(keywordOld));
  if (dateLineOld !== undefined) {
    return dateLineOld.substr(keywordOld.length).trim();
  }
};

const findShares = textArr => {
  let idx = textArr.findIndex(t => t.toLowerCase() === 'umsatz');
  if (idx >= 0) {
    return textArr[idx + 1] === 'Fälligkeit'
      ? parseGermanNum(textArr[idx + 3])
      : parseGermanNum(textArr[idx + 2]);
  }
  idx = textArr.findIndex(t => t.startsWith('ST '));
  if (idx >= 0) {
    return parseGermanNum(textArr[idx].split(/\s+/)[1]);
  }
};

const findDividendShares = textArr => {
  const idx = textArr.findIndex(line => line.toLowerCase() === 'bestand');
  // For newer files:
  if (idx >= 0) {
    return parseGermanNum(textArr[idx + 1].split(' ')[0]);
  }
  // For older files:
  else {
    let lineNumber = textArr.indexOf('DIVIDENDENGUTSCHRIFT');
    if (lineNumber < 0) {
      lineNumber = textArr.indexOf('ERTRAGSGUTSCHRIFT');
    }

    if (lineNumber < 0) {
      return undefined;
    }

    return parseGermanNum(textArr[lineNumber + 1].split(/\s+/)[1]);
  }
};

// Returns an array with amount and amountCurrency
const findAmount = (textArr, type, baseCurrency) => {
  if (type === 'Buy' || type === 'Sell') {
    let lineNumber = textArr.findIndex(line =>
      line.includes('Kurswert in ' + baseCurrency)
    );
    if (lineNumber <= 0) {
      lineNumber = textArr.findIndex(line => line.includes('Kurswert'));
    }
    if (lineNumber <= 0) {
      lineNumber = textArr.indexOf('Nettoinventarwert');
    }
    if (lineNumber <= 0) {
      // For super old files (testfile from 2003)
      lineNumber = textArr.findIndex(line => line.startsWith('KURSWERT'));
      if (
        lineNumber >= 0 &&
        parseGermanNum(textArr[lineNumber].split(/\s+/)[2])
      ) {
        return [
          parseGermanNum(textArr[lineNumber].split(/\s+/)[2]),
          textArr[lineNumber].split(/\s+/)[1],
        ];
      } else {
        return [undefined, undefined];
      }
    }

    let offset = 0;
    let offsetCurrency = 1;
    if (textArr[lineNumber + 1] === '') {
      // Documents before 12/2015 have an empty line after 'Kurswert'
      offset += 1;
      offsetCurrency += 1;
    }

    if (/^[A-Z]{3}$/.test(textArr[lineNumber + 1 + offset])) {
      // Documents before nov 2020 have the currency in a line before the amount.
      offset += 1;
    }

    // Parse the amount currency from the line with the offsetCurrency. When the line contains a space, we take the last element.
    let amountCurrency = textArr[lineNumber + offsetCurrency];
    if (amountCurrency.includes(' ')) {
      const elements = amountCurrency.split(/\s+/);
      amountCurrency = elements[elements.length - 1];
    }

    return [parseGermanNum(textArr[lineNumber + 1 + offset]), amountCurrency];
  }

  if (type === 'Dividend') {
    let amount, idx, currency;

    const oldDividendFile = textArr.some(
      line => line.includes('IBAN') && line !== 'IBAN'
    );

    if (!oldDividendFile) {
      // "Brutto in EUR" is only present if the dividend is paid in a foreign currency, otherwise its just "Brutto"
      idx = textArr.indexOf('Brutto in EUR');
      if (idx < 0) {
        idx = textArr.indexOf('Brutto');
      }
      if (idx >= 0) {
        amount = textArr[idx + 1].split(' ')[0];
        currency = textArr[idx + 1].split(' ')[1];
      }
    } else {
      idx = textArr.findIndex(line => line.includes('BRUTTO'));
      if (idx >= 0) {
        amount = textArr[idx].split(/\s+/)[2];
        currency = textArr[idx].split(/\s+/)[1];
      }
    }

    return [parseGermanNum(amount), currency];
  }
};

const getNumberAfterTermWithOffset = (content, termToLower, offset = 0) => {
  const lineNumber = content.findIndex(line =>
    line.toLowerCase().includes(termToLower)
  );

  if (lineNumber <= 0) {
    return undefined;
  }

  if (/^[A-Z]{3}$/.test(content[lineNumber + offset + 1])) {
    // Documents before nov 2020 have the price after the currency line.
    return parseGermanNum(content[lineNumber + offset + 2]);
  }

  return parseGermanNum(content[lineNumber + offset + 1]);
};

const findFee = content => {
  const parsedFees = [];

  parsedFees.push(getNumberAfterTermWithOffset(content, 'provision'));
  parsedFees.push(getNumberAfterTermWithOffset(content, 'grundgebühr'));
  parsedFees.push(getNumberAfterTermWithOffset(content, 'börsenplatzgebühr'));
  parsedFees.push(getNumberAfterTermWithOffset(content, 'handelsentgelt'));
  parsedFees.push(getNumberAfterTermWithOffset(content, 'transaktionsentgelt'));
  parsedFees.push(getNumberAfterTermWithOffset(content, 'eig. spesen'));

  if (!content.some(line => line.includes('Ausgabegebühr 0,00%'))) {
    parsedFees.push(getNumberAfterTermWithOffset(content, 'ausgabegebühr'));
  }

  const bonificationIdx = content.findIndex(line =>
    line.startsWith('BONIFIKAT')
  );

  let totalFee = Big(0);

  parsedFees.forEach(feeCandidate => {
    if (feeCandidate === undefined) {
      return;
    }

    totalFee = totalFee.plus(feeCandidate);
  });

  if (bonificationIdx >= 0) {
    totalFee = totalFee.minus(
      parseGermanNum(content[bonificationIdx].split(/\s+/)[4])
    );
  }

  return +totalFee;
};

const findTax = textArr => {
  const kapstIdx = textArr.findIndex(t => t.toLowerCase() === 'kapst');
  const solzIdx = textArr.findIndex(t => t.toLowerCase() === 'solz');

  const kapst = kapstIdx >= 0 ? textArr[kapstIdx + 3] : null;
  const solz = solzIdx >= 0 ? textArr[solzIdx + 3] : null;
  const sum = +Big(parseGermanNum(kapst)).plus(Big(parseGermanNum(solz)));

  return Math.abs(sum);
};

const findDividendTax = (textArr, amount) => {
  // For older dividend files:
  const netAmountIndex = textArr.findIndex(line => line.includes('WERT'));
  if (netAmountIndex >= 0) {
    const netAmount = parseGermanNum(textArr[netAmountIndex].split(/\s+/)[3]);
    return +Big(amount).minus(netAmount);
  }

  // For newer dividend files
  const netAmountIndexNew = textArr.findIndex(
    line => line === 'Netto zugunsten' || line === 'Netto zulasten'
  );
  if (netAmountIndexNew >= 0) {
    const netAmount = parseGermanNum(
      textArr[netAmountIndexNew + 4].split(/\s+/)[0]
    );
    return +Big(amount).minus(netAmount);
  }
};

// Returns an array with fxRate, foreignCurrency and baseCurrency
const findForeignInformation = (content, isDividend) => {
  let foreignInfo = content.indexOf('Devisenkurs');
  if (foreignInfo >= 0) {
    const foreignInfoLine = content[foreignInfo + 1].split(/\s+/);
    return [
      parseGermanNum(foreignInfoLine[0]),
      foreignInfoLine[isDividend ? 1 : 3],
      foreignInfoLine[isDividend ? 3 : 1],
    ];
  }

  // Sometimes the fxRate is on the same line:
  // umger. zum Devisenkurs USD 1,092400
  foreignInfo = content.findIndex(line => line.includes('Devisenkurs'));
  if (foreignInfo >= 0) {
    const foreignInfoLine = content[foreignInfo].split(/\s+/);
    return [
      parseGermanNum(foreignInfoLine[foreignInfoLine.length - 1]),
      foreignInfoLine[foreignInfoLine.length - 2],
      content[foreignInfo + 1],
    ];
  }

  return [undefined, undefined, undefined];
};

const getDocumentType = content => {
  // Before 12/2015 the headline is 'Wertpapierabrechnung'
  const lineNumber = findBuySellLineNumber(content);
  if (lineNumber >= 0) {
    if (
      content[lineNumber + 1].toLowerCase().startsWith('kauf') ||
      content[lineNumber + 1] === 'BEZUG'
    ) {
      return 'Buy';
    } else if (
      content[lineNumber + 1].toLowerCase() === 'verkauf' ||
      content[lineNumber + 1] === 'VERK. TEIL-/BEZUGSR.'
    ) {
      return 'Sell';
    }
  } else if (
    content.some(t =>
      ['ertragsgutschrift', 'dividendengutschrift'].includes(t.toLowerCase())
    )
  ) {
    return 'Dividend';
  } else if (
    content.some(
      line =>
        line.includes('Kostenausweis') ||
        line.includes('Aktiensplit') ||
        line.includes('Vorabpauschale')
    ) ||
    content.includes('Kumulierter Gewinn/Verlust')
  ) {
    return 'ignoredDocument';
  }
};

export const canParseDocument = (pages, extension) => {
  if (extension !== 'pdf') {
    return false;
  }

  const firstPageContent = pages[0];

  const isConsors =
    firstPageContent.some(
      line => line.toLowerCase && line.toLowerCase().includes('consorsbank')
    ) ||
    firstPageContent[1] === 'POSTFACH 17 43' ||
    // For depotStatements. The only file we have is quite heavily anonymized.
    // Maybe better strings exist
    (firstPageContent.includes('Kumulierter Gewinn/Verlust') &&
      firstPageContent.includes('Entwicklung seit:'));
  if (!isConsors) {
    return false;
  }
  return getDocumentType(firstPageContent) !== undefined;
};

const parseData = (textArr, type) => {
  let activity = {
    broker: 'consorsbank',
    type,
    company: findCompany(textArr),
    fee: 0,
    tax: 0,
  };
  let isin = findISIN(textArr);
  let wkn = findWKN(textArr);

  if (wkn !== undefined) {
    activity.wkn = wkn;
  }
  if (isin !== undefined) {
    activity.isin = isin;
  }

  let date, time, amountCurrency;

  const [fxRate, foreignCurrency, baseCurrency] = findForeignInformation(
    textArr,
    activity.type === 'Dividend'
  );

  if (fxRate !== undefined) {
    activity.fxRate = fxRate;
    activity.foreignCurrency = foreignCurrency;
  }

  switch (activity.type) {
    case 'Buy':
      date = findDateBuySell(textArr);
      time = findOrderTime(textArr);
      activity.shares = findShares(textArr);
      [activity.amount, amountCurrency] = findAmount(
        textArr,
        'Buy',
        baseCurrency
      );
      activity.fee = findFee(textArr);
      break;

    case 'Sell':
      date = findDateBuySell(textArr);
      time = findOrderTime(textArr);
      activity.shares = findShares(textArr);
      [activity.amount, amountCurrency] = findAmount(
        textArr,
        'Sell',
        baseCurrency
      );
      activity.fee = findFee(textArr);
      activity.tax = findTax(textArr);
      break;

    case 'Dividend':
      date = findDateDividend(textArr);
      activity.shares = findDividendShares(textArr);
      [activity.amount, amountCurrency] = findAmount(
        textArr,
        'Dividend',
        baseCurrency
      );
      activity.tax = findDividendTax(textArr, activity.amount);
      break;
  }
  [activity.date, activity.datetime] = createActivityDateTime(
    date,
    time,
    'dd.MM.yyyy',
    'dd.MM.yyyy HH:mm:ss'
  );

  if (
    amountCurrency !== undefined &&
    baseCurrency !== undefined &&
    amountCurrency !== baseCurrency &&
    fxRate !== undefined
  ) {
    activity.amount = +Big(activity.amount).div(fxRate);
  }

  activity.price = +Big(activity.amount).div(Big(activity.shares));

  return validateActivity(activity);
};

export const parsePages = contents => {
  const documentType = getDocumentType(contents[0]);
  if (documentType === 'ignoredDocument') {
    // We know this type and we don't want to support it.
    return {
      activities: [],
      status: 7,
    };
  }

  const activities = [parseData(contents[0], documentType)];

  return {
    activities,
    status: 0,
  };
};
