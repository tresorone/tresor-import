import Big from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
} from '@/helper';

const getValueByPreviousElement = (textArr, prev, range) => {
  const lineNumber = textArr.findIndex(t => t.includes(prev));
  if (lineNumber < 0) {
    return undefined;
  }

  return textArr[lineNumber + range];
};

const activityType = content => {
  switch (content[0]) {
    case 'Wertpapierabrechnung':
      if (content[1].startsWith('Kauf')) {
        return 'Buy';
      } else if (content[1] === 'Verkauf') {
        return 'Sell';
      }
      break;
    case 'Dividendengutschrift':
    case 'Ertragsgutschrift':
      return 'Dividend';
    case 'Rückzahlung':
      return 'Payback';
  }
  if (content.includes('Depotbewertung')) {
    return 'DepotStatement';
  }
};

const findShares = (content, type) => {
  switch (type) {
    case 'Buy':
    case 'Sell':
      return parseGermanNum(getValueByPreviousElement(content, 'Stück', 1));
    case 'Payback':
    case 'Dividend':
      return parseGermanNum(
        getValueByPreviousElement(content, 'Nominale', 1).split(' ')[0]
      );
  }
};

const findISIN = textArr => {
  const isin = getValueByPreviousElement(textArr, 'ISIN', 1).split(' ')[0];
  return /^([A-Z]{2})((?![A-Z]{10})[A-Z0-9]{10})$/.test(isin) ? isin : null;
};

const findCompany = content => {
  const companyIdx = content.indexOf('Wertpapierbezeichnung');
  return content[companyIdx + 1] + ' ' + content[companyIdx + 2];
};

const findDateTime = (content, type) => {
  switch (type) {
    case 'Buy':
    case 'Sell': {
      const dateIdx = content.findIndex(t => t.includes('Ausführungstag'));
      if (content[dateIdx + 1] === '/ -zeit') {
        return [content[dateIdx + 2], content[dateIdx + 3].split(' ')[1]];
      } else {
        return [content[dateIdx + 1], undefined];
      }
    }
    case 'Payback':
      return [getValueByPreviousElement(content, 'Fälligkeit', 1)];
    case 'Dividend':
      return [getValueByPreviousElement(content, 'Zahltag', 1)];
  }
};

const findPrice = (content, type, baseCurrency, fxRate) => {
  let amount, currency;

  if (['Buy', 'Sell'].includes(type)) {
    amount = parseGermanNum(getValueByPreviousElement(content, 'Kurs', 2));
    currency = getValueByPreviousElement(content, 'Kurs', 1);
  } else if (type === 'Payback') {
    const priceIdx = content.indexOf('Einlösung zum Kurs von');
    if (priceIdx >= 0) {
      // Example for the price format: 0,0001 EUR
      const elements = content[priceIdx + 1].split(/\s+/);

      amount = parseGermanNum(elements[0]);
      currency = elements[1];
    }
  } else {
    // Dividends:
    let amountAndCurrency = getValueByPreviousElement(
      content,
      'Zins-/Dividendensatz',
      1
    );
    if (amountAndCurrency === undefined) {
      // Dividends of ETFs have the label `Ertragsausschüttung per Stück`
      amountAndCurrency = getValueByPreviousElement(
        content,
        'Ertragsausschüttung per Stück',
        1
      );
    }

    amountAndCurrency = amountAndCurrency.split(' ');
    amount = parseGermanNum(amountAndCurrency[0]);
    currency = amountAndCurrency[1];
  }

  if (currency === baseCurrency) {
    return amount;
  }

  return +Big(amount).div(fxRate);
};

const findBaseCurrency = content => {
  let lineNumber = content.findIndex(line =>
    line.toLowerCase().includes('betrag zu ihren')
  );
  if (lineNumber < 0) {
    lineNumber = content.indexOf('Endbetrag');
  }

  if (lineNumber < 0) {
    return undefined;
  }

  return content[lineNumber + 1];
};

const findAmount = (textArr, type, baseCurrency, fxRate) => {
  switch (type) {
    case 'Buy':
    case 'Sell':
    case 'Payback': {
      const amount = parseGermanNum(
        getValueByPreviousElement(textArr, 'Kurswert', 2)
      );
      if (getValueByPreviousElement(textArr, 'Kurswert', 1) === baseCurrency) {
        return amount;
      }

      return +Big(amount).div(fxRate);
    }
    case 'Dividend': {
      const bruttoIndex = textArr.indexOf('Brutto');
      if (!(textArr[bruttoIndex + 1] === baseCurrency)) {
        const foreignPayout = parseGermanNum(textArr[bruttoIndex + 2]);
        return +Big(foreignPayout).div(fxRate);
      } else {
        return +Big(parseGermanNum(textArr[bruttoIndex + 2]));
      }
    }
  }
};

const findFee = content => {
  let totalFee = Big(0);
  const provisionIdx = content.indexOf('Provision');
  if (provisionIdx >= 0 && parseGermanNum(content[provisionIdx + 2])) {
    totalFee = totalFee.plus(parseGermanNum(content[provisionIdx + 2]));
  }

  const discountIdx = content.indexOf('Rabatt');
  if (
    discountIdx >= 0 &&
    parseGermanNum(content[discountIdx + 2].replace(' ', ''))
  ) {
    totalFee = totalFee.plus(
      parseGermanNum(content[discountIdx + 2].replace(' ', ''))
    );
  }

  const transactionFeeIdx = content.indexOf('Variables Transaktionsentgelt');
  if (transactionFeeIdx >= 0) {
    totalFee = totalFee.plus(parseGermanNum(content[transactionFeeIdx + 2]));
  }

  const exchangeFeeIdx = content.indexOf('Handelsplatzgebühr');
  if (exchangeFeeIdx >= 0) {
    totalFee = totalFee.plus(parseGermanNum(content[exchangeFeeIdx + 2]));
  }

  const courtageFeeLineNumber = content.indexOf('Courtage');
  if (courtageFeeLineNumber >= 0) {
    totalFee = totalFee.plus(
      parseGermanNum(content[courtageFeeLineNumber + 2])
    );
  }

  return +totalFee;
};

const findTaxes = content => {
  var totalTax = Big(0);

  for (let lineNumber = 0; lineNumber < content.length; lineNumber++) {
    const line = content[lineNumber].toLowerCase();

    if (line.startsWith('qust')) {
      // Special case:
      // The withholding tax is payed in origin currency but ING write the amount in EUR to the QuST line: `QuSt 15,00 % (EUR 0,41)`
      // For withholding tax in EUR, we need to check the line with offset of 2.

      // Match the amount for withholding tax in other currencies (e.g.: `0,41` from `QuSt 15,00 % (EUR 0,41)`)
      const regexMatch = line.match(/.+?\(.+?([\d,]+)\)/);
      if (regexMatch) {
        totalTax = totalTax.plus(Big(parseGermanNum(regexMatch[1])));
        continue;
      }

      totalTax = totalTax.plus(Big(parseGermanNum(content[lineNumber + 2])));
      lineNumber += 2;
      continue;
    }

    if (
      !line.includes('steuer ') &&
      !line.includes('zuschlag ') &&
      !line.includes('st anteilig')
    ) {
      continue;
    }

    // Normaly the tax amount is in the line after the tax title
    let offset = 2;
    if (line.endsWith('%')) {
      offset = 2;
    } else if (!line.endsWith('%') && !content[lineNumber + 2].endsWith('%')) {
      // but sometimes the line after contains only a %
      // Kapitalertragsteuer 25,00  // <- variable line
      // %
      // EUR
      // 50,46                      // <- tax amount
      offset = 3;
    } else if (!line.endsWith('%') && content[lineNumber + 2].endsWith('%')) {
      // but sometimes the line after contains only a % and the line after this the percentage
      // KapSt anteilig 50,00      // <- variable line
      // %
      // 25,00%
      // EUR
      // 74,29                      // <- tax amount
      offset = 4;
    }

    if (!content[lineNumber + offset].includes(',')) {
      lineNumber += offset;
      continue;
    }

    totalTax = totalTax.plus(Big(parseGermanNum(content[lineNumber + offset])));
  }

  return +totalTax;
};

// Returns an array with [foreignCurrency, fxRate]. Returns undefined when not found.
const findForeignInformation = textArr => {
  let lineNumber = textArr.indexOf('Umg. z. Dev.-Kurs');
  if (lineNumber <= 0) {
    lineNumber = textArr.indexOf('umger. zum Devisenkurs');
  }

  if (lineNumber <= 0) {
    return [undefined, undefined];
  }

  // Regex will match fxRate from the following samples:
  // (USD = 1,217661)
  // (1,1613)
  const match = /\(.*?(\d+,\d+)\)/.exec(textArr[lineNumber + 1]);
  if (!match) {
    return [undefined, undefined];
  }

  return [textArr[lineNumber - 2], parseGermanNum(match[1])];
};

const parseBuySellDividend = (content, type) => {
  let activity = {
    broker: 'ing',
    type,
    isin: findISIN(content),
    company: findCompany(content),
    fee: 0,
    tax: 0,
  };

  const baseCurrency = findBaseCurrency(content);
  const [foreignCurrency, fxRate] = findForeignInformation(content);

  activity.amount = findAmount(content, activity.type, baseCurrency, fxRate);
  activity.shares = findShares(content, activity.type);
  activity.price = findPrice(content, activity.type, baseCurrency, fxRate);

  const [date, datetime] = findDateTime(content, activity.type);
  [activity.date, activity.datetime] = createActivityDateTime(
    date,
    datetime,
    'dd.MM.yyyy',
    'dd.MM.yyyy HH:mm:ss'
  );

  if (foreignCurrency !== undefined || fxRate !== undefined) {
    activity.foreignCurrency = foreignCurrency;
    activity.fxRate = fxRate;
  }

  switch (activity.type) {
    case 'Buy':
      activity.fee = findFee(content);
      break;
    case 'Sell':
      activity.fee = findFee(content);
      activity.tax = findTaxes(content);
      break;
    case 'Dividend':
      activity.tax = findTaxes(content);
      break;
    case 'Payback':
      activity.type = 'Sell';
      activity.fee = findFee(content);
      activity.tax = findTaxes(content);
      break;
  }
  return validateActivity(activity);
};

const parseDepotStatement = content => {
  let idx = content.indexOf('Stück');
  let activities = [];
  const dateIdx =
    content.indexOf(
      'Einstands- und Bewertungskurse, Gewinn oder Verlust aller Depotpositionen'
    ) + 1;
  if (dateIdx < 1) {
    return undefined;
  }
  const [date, datetime] = createActivityDateTime(
    content[dateIdx].split(/\s+/)[0],
    content[dateIdx].split(/\s+/)[1]
  );
  while (idx >= 0) {
    let activity = {
      broker: 'ing',
      type: 'TransferIn',
      isin: content[idx - 2],
      company: content[idx - 3],
      date,
      datetime,
      shares: parseGermanNum(content[idx - 1]),
      amount: parseGermanNum(content[idx + 4]),
      tax: 0,
      fee: 0,
    };
    activity.price = +Big(activity.amount).div(activity.shares);
    activity = validateActivity(activity);
    if (activity === undefined) {
      return undefined;
    }
    activities.push(activity);
    idx = content.indexOf('Stück', idx + 1);
  }
  return activities;
};

export const canParseDocument = (pages, extension) => {
  return (
    extension === 'pdf' &&
    pages[0].some(line => line.toLowerCase().includes('ing-diba')) &&
    activityType(pages.flat()) !== undefined
  );
};

export const parsePages = contents => {
  const contentsFlat = contents.flat();
  const type = activityType(contentsFlat);
  let activities;

  if (type === 'DepotStatement') {
    activities = parseDepotStatement(contentsFlat);
  } else {
    // Information regarding dividends can be split across multiple pdf pages
    activities = [parseBuySellDividend(contentsFlat, type)];
  }

  if (activities !== undefined) {
    return {
      activities,
      status: 0,
    };
  }
  return {
    activities: [],
    status: 3,
  };
};
