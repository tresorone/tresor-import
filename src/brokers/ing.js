import format from 'date-fns/format';
import parse from 'date-fns/parse';
import every from 'lodash/every';
import values from 'lodash/values';
import Big from 'big.js';

const parseGermanNum = n =>
  parseFloat(n.replace(/[-+]$/, '').replace(/\./g, '').replace(',', '.'));

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

export const canParseData = textArr =>
  textArr.some(t => t.includes('BIC: INGDDEFFXX')) &&
  (isBuy(textArr) || isSell(textArr) || isDividend(textArr));

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

const findFee = textArr =>
  parseGermanNum(getValueByPreviousElement(textArr, 'Provision', 2));

const findPayout = textArr =>
  parseGermanNum(
    getValueByPreviousElement(textArr, 'Gesamtbetrag zu Ihren Gunsten', 2)
  );

export const parseData = textArr => {
  let type, date, isin, company, shares, price, amount, fee;

  if (isBuy(textArr)) {
    type = 'Buy';
    isin = findISIN(textArr);
    company = findCompany(textArr);
    date = findDate(textArr);
    shares = findShares(textArr);
    amount = findAmount(textArr);
    price = findPrice(textArr);
    fee = findFee(textArr);
  } else if (isSell(textArr)) {
    type = 'Sell';
    isin = findISIN(textArr);
    company = findCompany(textArr);
    date = findDate(textArr);
    shares = findShares(textArr);
    amount = findAmount(textArr);
    price = findPrice(textArr);
    fee = findFee(textArr);
  } else if (isDividend(textArr)) {
    type = 'Dividend';
    isin = findISIN(textArr);
    company = findCompany(textArr);
    date = findDate(textArr);
    shares = findShares(textArr);
    amount = findPayout(textArr);
    price = +Big(amount).div(shares);
    fee = 0;
  } else {
    console.error('Type could not be determined!');
    return undefined;
  }

  const activity = {
    broker: 'ing',
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
