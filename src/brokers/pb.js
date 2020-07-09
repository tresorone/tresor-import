import format from 'date-fns/format';
import parse from 'date-fns/parse';
import every from 'lodash/every';
import values from 'lodash/values';

const offsets = {
  shares: 0,
  companyName: 1,
  isin: 3,
};

import { parseGermanNum } from '@/helper';

const getValueByPreviousElement = (textArr, prev) =>
  textArr[textArr.findIndex(t => t.includes(prev)) + 1];

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
  textArr.some(t => t.includes('BIC PBNKDEFFXXX')) &&
  (isBuy(textArr) || isSell(textArr) || isDividend(textArr));

export const parseData = textArr => {
  let type, date, isin, company, shares, price, amount, fee;

  if (isBuy(textArr)) {
    type = 'Buy';
    isin = findISIN(textArr);
    company = findCompany(textArr);
    date = findDateBuySell(textArr);
    shares = findShares(textArr);
    amount = findAmount(textArr);
    price = findPrice(textArr);
    fee = findFee(textArr);
  } else if (isSell(textArr)) {
    type = 'Sell';
    isin = findISIN(textArr);
    company = findCompany(textArr);
    date = findDateBuySell(textArr);
    shares = findShares(textArr);
    amount = findAmount(textArr);
    price = findPrice(textArr);
    fee = findFee(textArr);
  } else if (isDividend(textArr)) {
    type = 'Dividend';
    isin = findISIN(textArr);
    company = findCompany(textArr);
    date = findDateDividend(textArr);
    shares = findShares(textArr);
    amount = findPayout(textArr);
    price = amount / shares;
    fee = 0;
  } else {
    console.error('Type could not be determined!');
    return undefined;
  }

  const activity = {
    broker: 'pb',
    type,
    date: format(parse(date, 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd'),
    isin,
    company,
    shares,
    price,
    amount,
    fee,
  };

  const valid = every(values(activity), a => !!a || a === 0);

  if (!valid) {
    console.error('Error while parsing PDF', activity);
    return undefined;
  } else {
    return activity;
  }
};

export const parsePages = contents => {
  // parse first page has activity data
  const activity = parseData(contents[0]);
  return [activity];
};
