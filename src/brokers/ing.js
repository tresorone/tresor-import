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

const isBuy = textArr =>
  textArr.some(t => t.includes('Wertpapierabrechnung')) &&
  textArr.some(t => t.includes('Kauf aus Sparplan') || t.includes('Kauf'));

const isSell = textArr =>
  textArr.some(t => t.includes('Wertpapierabrechnung')) &&
  textArr.some(t => t.includes('Verkauf'));

const isDividend = textArr =>
  textArr.some(
    t => t.includes('Dividendengutschrift') || t.includes('Ertragsgutschrift')
  );

export const canParsePage = (content, extension) =>
  extension === 'pdf' &&
  content.some(t => t.includes('BIC: INGDDEFFXX')) &&
  (isBuy(content) || isSell(content) || isDividend(content));

const findShares = textArr =>
  isBuy(textArr) || isSell(textArr)
    ? parseGermanNum(getValueByPreviousElement(textArr, 'Stück', 1))
    : parseGermanNum(
        getValueByPreviousElement(textArr, 'Nominale', 1).split(' ')[0]
      );

const findISIN = textArr => {
  const isin = getValueByPreviousElement(textArr, 'ISIN', 1).split(' ')[0];
  return /^([A-Z]{2})((?![A-Z]{10})[A-Z0-9]{10})$/.test(isin) ? isin : null;
};

const findCompany = textArr =>
  getValueByPreviousElement(textArr, 'Wertpapierbezeichnung', 1).split(' -')[0];

const findDateTime = textArr => {
  if (isBuy(textArr) || isSell(textArr)) {
    const dateIdx = textArr.findIndex(t => t.includes('Ausführungstag'));
    if (textArr[dateIdx + 1] === '/ -zeit') {
      return [textArr[dateIdx + 2], textArr[dateIdx + 3].split(' ')[1]];
    } else {
      return [textArr[dateIdx + 1], undefined];
    }
  } else if (isDividend(textArr)) {
    return [getValueByPreviousElement(textArr, 'Zahltag', 1), undefined];
  }
};

const findPrice = content => {
  if (isBuy(content) || isSell(content)) {
    return parseGermanNum(getValueByPreviousElement(content, 'Kurs', 2));
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

const findAmount = textArr =>
  parseGermanNum(getValueByPreviousElement(textArr, 'Kurswert', 2));

const findFee = textArr => {
  const fee = parseGermanNum(
    getValueByPreviousElement(textArr, 'Provision', 2)
  );
  return fee && /([0-9]*)/.test(fee) ? fee : 0;
};

const findTaxes = content => {
  var totalTax = Big(0);

  for (let lineNumber = 0; lineNumber < content.length; lineNumber++) {
    const line = content[lineNumber].toLowerCase();

    if (line.includes('qust')) {
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

const findPayout = textArr => {
  const bruttoIndex = textArr.indexOf('Brutto');
  if (!(textArr[bruttoIndex + 1] === 'EUR')) {
    const foreignPayout = parseGermanNum(textArr[bruttoIndex + 2]);
    return +Big(foreignPayout).div(findExchangeRate(textArr));
  } else {
    return +Big(parseGermanNum(textArr[bruttoIndex + 2]));
  }
};

const parseData = pdfPage => {
  let activity = {
    broker: 'ing',
    isin: findISIN(pdfPage),
    company: findCompany(pdfPage),
    shares: findShares(pdfPage),
    price: findPrice(pdfPage),
    fee: 0,
    tax: 0,
  };
  const [date, datetime] = findDateTime(pdfPage);
  [activity.date, activity.datetime] = createActivityDateTime(
    date,
    datetime,
    'dd.MM.yyyy',
    'dd.MM.yyyy HH:mm:ss'
  );
  if (isBuy(pdfPage)) {
    activity.type = 'Buy';
    activity.amount = findAmount(pdfPage);
    activity.fee = findFee(pdfPage);
  } else if (isSell(pdfPage)) {
    activity.type = 'Sell';
    activity.amount = findAmount(pdfPage);
    activity.fee = findFee(pdfPage);
    activity.tax = findTaxes(pdfPage);
  } else if (isDividend(pdfPage)) {
    activity.type = 'Dividend';
    activity.tax = findTaxes(pdfPage);
    activity.amount = findPayout(pdfPage);
  }
  return validateActivity(activity);
};

export const parsePages = contents => {
  const activities = [parseData(contents[0])];

  return {
    activities,
    status: 0,
  };
};
