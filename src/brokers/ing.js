import format from 'date-fns/format';
import parse from 'date-fns/parse';
import Big from 'big.js';

import { parseGermanNum } from '@/helper';

const getValueByPreviousElement = (textArr, prev, range) =>
  textArr[textArr.findIndex(t => t.includes(prev)) + range];

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

const findDate = textArr =>
  isBuy(textArr) || isSell(textArr)
    ? getValueByPreviousElement(textArr, 'Ausführungstag', 2).split(' ')[0]
    : getValueByPreviousElement(textArr, 'Zahltag', 1);

const findPrice = textArr =>
  isBuy(textArr) || isSell(textArr)
    ? parseGermanNum(getValueByPreviousElement(textArr, 'Kurs', 2))
    : parseGermanNum(
        getValueByPreviousElement(textArr, 'Zins-/Dividendensatz', 1).split(
          ' '
        )[0]
      );

const findAmount = textArr =>
  parseGermanNum(getValueByPreviousElement(textArr, 'Kurswert', 2));

const findFee = textArr => {
  const fee = parseGermanNum(
    getValueByPreviousElement(textArr, 'Provision', 2)
  );
  return fee && /([0-9]*)/.test(fee) ? fee : 0;
};

const findTaxes = textArr => {
  let totalTax = Big(0);
  const lineOfCommission = textArr.findIndex(t => t.includes('Provision'));

  if (lineOfCommission <= 0 || lineOfCommission == undefined) {
    return +totalTax;
  }

  let lineOfDescription = lineOfCommission;
  while (lineOfDescription > 0) {
    lineOfDescription -= 4;

    let description = textArr[lineOfDescription].toLowerCase();
    if (description.includes('steuer') || description.includes('zuschlag')) {
      totalTax = totalTax.plus(
        Big(parseGermanNum(textArr[lineOfDescription + 3]))
      );

      continue;
    }

    break;
  }

  return +totalTax;
};

const findPayout = textArr =>
  parseGermanNum(
    getValueByPreviousElement(textArr, 'Gesamtbetrag zu Ihren Gunsten', 2)
  );

const parseData = textArr => {
  let type, date, isin, company, shares, price, amount, fee, tax;

  if (isBuy(textArr)) {
    type = 'Buy';
    isin = findISIN(textArr);
    company = findCompany(textArr);
    date = findDate(textArr);
    shares = findShares(textArr);
    amount = findAmount(textArr);
    price = findPrice(textArr);
    fee = findFee(textArr);
    tax = 0;
  } else if (isSell(textArr)) {
    type = 'Sell';
    isin = findISIN(textArr);
    company = findCompany(textArr);
    date = findDate(textArr);
    shares = findShares(textArr);
    amount = findAmount(textArr);
    price = findPrice(textArr);
    fee = findFee(textArr);
    tax = findTaxes(textArr);
  } else if (isDividend(textArr)) {
    type = 'Dividend';
    isin = findISIN(textArr);
    company = findCompany(textArr);
    date = findDate(textArr);
    shares = findShares(textArr);
    amount = findPayout(textArr);
    price = +Big(amount).div(shares);
    fee = 0;
    tax = findTaxes(textArr);
  }

  return {
    broker: 'ing',
    type,
    date: format(parse(date, 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd'),
    isin,
    company,
    shares,
    price,
    amount,
    fee,
    tax,
  };
};

export const parsePages = contents => {
  const activities = [parseData(contents[0])];

  return {
    activities,
    status: 0,
  };
};
