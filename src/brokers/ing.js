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

const findPrice = (content, type) => {
  if (['Buy', 'Sell'].includes(type)) {
    return parseGermanNum(getValueByPreviousElement(content, 'Kurs', 2));
  } else if (type === 'Payback') {
    const priceIdx = content.indexOf('Einlösung zum Kurs von');
    if (priceIdx >= 0) {
      // Example for the price format: 0,0001 EUR
      return parseGermanNum(content[priceIdx + 1].split(/\s+/)[0]);
    }
  }

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

  const amount = parseGermanNum(amountAndCurrency[0]);
  if (amountAndCurrency[1] === 'EUR') {
    return amount;
  }

  return +Big(amount).div(findExchangeRate(content));
};

const findExchangeRate = content => {
  // Find the value in the line after "Umg. z. Dev.-Kurs"
  const value = getValueByPreviousElement(content, 'Umg. z. Dev.-Kurs', 1);
  if (value === undefined) {
    return 1;
  }

  const regexMatch = value.match(/\(([\d,]+)\)/);
  if (!regexMatch) {
    return 1;
  }

  return Big(parseGermanNum(regexMatch[1]));
};

const findAmount = (textArr, type) => {
  switch (type) {
    case 'Buy':
    case 'Sell':
    case 'Payback':
      return parseGermanNum(getValueByPreviousElement(textArr, 'Kurswert', 2));
    case 'Dividend': {
      const bruttoIndex = textArr.indexOf('Brutto');
      if (!(textArr[bruttoIndex + 1] === 'EUR')) {
        const foreignPayout = parseGermanNum(textArr[bruttoIndex + 2]);
        return +Big(foreignPayout).div(findExchangeRate(textArr));
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

    if (!line.includes('steuer ') && !line.includes('zuschlag ')) {
      continue;
    }

    const offset = line.endsWith('%') ? 2 : 3;
    const lineWithTaxAmount = content[lineNumber + offset];
    if (!lineWithTaxAmount.includes(',')) {
      lineNumber += offset;
      continue;
    }

    totalTax = totalTax.plus(Big(parseGermanNum(content[lineNumber + offset])));
  }

  return +totalTax;
};

const findForeignInfoPayout = textArr => {
  const fxRateIdx = textArr.indexOf('Umg. z. Dev.-Kurs');
  const fxRate = textArr[fxRateIdx + 1].substr(
    1,
    textArr[fxRateIdx].length - 1
  );

  return [textArr[fxRateIdx - 2], parseGermanNum(fxRate)];
};

const parseData = content => {
  let activity = {
    broker: 'ing',
    type: activityType(content),
    isin: findISIN(content),
    company: findCompany(content),
    fee: 0,
    tax: 0,
  };

  activity.amount = findAmount(content, activity.type);
  activity.shares = findShares(content, activity.type);
  activity.price = findPrice(content, activity.type);

  const [date, datetime] = findDateTime(content, activity.type);
  [activity.date, activity.datetime] = createActivityDateTime(
    date,
    datetime,
    'dd.MM.yyyy',
    'dd.MM.yyyy HH:mm:ss'
  );
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
      if (content.includes('Umg. z. Dev.-Kurs')) {
        [activity.foreignCurrency, activity.fxRate] = findForeignInfoPayout(
          content
        );
      }
      break;
    case 'Payback':
      activity.type = 'Sell';
      activity.fee = findFee(content);
      activity.tax = findTaxes(content);
      break;
  }
  return validateActivity(activity);
};

export const canParseDocument = (pages, extension) => {
  const firstPageContent = pages[0];
  return (
    extension === 'pdf' &&
    firstPageContent.some(line => line.includes('BIC: INGDDEFFXX')) &&
    activityType(firstPageContent) !== undefined
  );
};

export const parsePages = contents => {
  // Information regarding dividends can be split across multiple pdf pages
  const activities = [parseData(contents.flat())];

  return {
    activities,
    status: 0,
  };
};
