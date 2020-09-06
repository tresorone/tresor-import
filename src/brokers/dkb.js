import format from 'date-fns/format';
import parse from 'date-fns/parse';

import { Big } from 'big.js';
import { parseGermanNum, validateActivity } from '@/helper';

const offsets = {
  shares: 0,
  companyName: 1,
  isin: 3,
};

const getValueByPreviousElement = (textArr, prev) => {
  const index = textArr.findIndex(t => t.includes(prev));
  if (index < 0) return "";
  return textArr[index + 1];
}

const findTableIndex = textArr => textArr.findIndex(t => t.includes('Stück'));

const findShares = textArr =>
  parseGermanNum(
    textArr[findTableIndex(textArr) + offsets.shares].split(' ')[1]
  );

const findISIN = textArr => {
  const isin = textArr[findTableIndex(textArr) + offsets.isin].trim();
  return /^([A-Z]{2})((?![A-Z]{10})[A-Z0-9]{10})$/.test(isin) ? isin : null;
};

const findCompany = textArr =>
  textArr[findTableIndex(textArr) + offsets.companyName].trim();

const findDateBuySell = textArr =>
  getValueByPreviousElement(textArr, 'Schlusstag').split(' ')[0];

const findPrice = textArr =>
  parseGermanNum(
    getValueByPreviousElement(textArr, 'Ausführungskurs').split(' ')[0]
  );

const findAmount = textArr =>
  parseGermanNum(getValueByPreviousElement(textArr, 'Kurswert').trim());

const findFee = textArr =>
  parseGermanNum(
    getValueByPreviousElement(textArr, 'Provision').split(' ')[0].trim()
  );

const findDateDividend = textArr =>
  getValueByPreviousElement(textArr, 'Zahlbarkeitstag').split(' ')[0];

const findPayout = textArr =>
  parseGermanNum(
    getValueByPreviousElement(textArr, 'Ausmachender Betrag').split(' ')[0]
  );

const findTax = textArr => {
  const assessmentBasis = parseGermanNum(
    getValueByPreviousElement(textArr, 'Berechnungsgrundlage für die Kapitalertragsteuer').split(' ')[0]
  );
  if (assessmentBasis === 0)
    return 0;

  const kap = parseGermanNum(
    getValueByPreviousElement(textArr, 'Kapitalertragsteuer 25 %').split(' ')[0]
  );
  const soli = parseGermanNum(
    getValueByPreviousElement(textArr, 'Solidaritätszuschlag').split(' ')[0]
  );
  const churchTax = parseGermanNum(
    getValueByPreviousElement(textArr, 'Kirchensteuer').split(' ')[0]
  );
  return +Big(kap).plus(Big(soli)).plus(Big(churchTax));
}

const isBuy = textArr =>
  textArr.some(
    t =>
      t.includes('Wertpapier Abrechnung Kauf') ||
      t.includes('Wertpapier Abrechnung Ausgabe Investmentfonds')
  );

const isSell = textArr =>
  textArr.some(t => t.includes('Wertpapier Abrechnung Verkauf'));

const isDividend = textArr =>
  textArr.some(
    t =>
      t.includes('Dividendengutschrift') ||
      t.includes('Ausschüttung Investmentfonds')
  );

export const canParseData = textArr =>
  textArr.some(t => t.includes('BIC BYLADEM1001')) &&
  (isBuy(textArr) || isSell(textArr) || isDividend(textArr));

export const parseData = textArr => {
  let type, date, isin, company, shares, price, amount, fee, tax;

  if (isBuy(textArr)) {
    type = 'Buy';
    isin = findISIN(textArr);
    company = findCompany(textArr);
    date = findDateBuySell(textArr);
    shares = findShares(textArr);
    amount = findAmount(textArr);
    price = findPrice(textArr);
    fee = findFee(textArr);
    tax = 0;
  } else if (isSell(textArr)) {
    type = 'Sell';
    isin = findISIN(textArr);
    company = findCompany(textArr);
    date = findDateBuySell(textArr);
    shares = findShares(textArr);
    amount = findAmount(textArr);
    price = findPrice(textArr);
    fee = findFee(textArr);
    tax = findTax(textArr);
  } else if (isDividend(textArr)) {
    type = 'Dividend';
    isin = findISIN(textArr);
    company = findCompany(textArr);
    date = findDateDividend(textArr);
    shares = findShares(textArr);
    amount = findPayout(textArr);
    price = amount / shares;
    fee = 0;
    tax = findTax(textArr);
  }

  return validateActivity({
    broker: 'dkb',
    type,
    date: format(parse(date, 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd'),
    isin,
    company,
    shares,
    price,
    amount,
    fee,
    tax,
  });
};

export const parsePages = contents => {
  // parse first page has activity data
  const activity = parseData(contents[0]);
  return [activity];
};
