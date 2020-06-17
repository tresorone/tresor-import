import format from 'date-fns/format';
import parse from 'date-fns/parse';
import every from 'lodash/every';
import values from 'lodash/values';
import Big from 'big.js';

const parseGermanNum = n => {
  return parseFloat(n.replace(/\./g, '').replace(',', '.'));
};

const findISIN = text => {
  const isin = text[text.findIndex(t => t.includes('ISIN')) + 1];
  return isin;
};

const findCompany = text => {
  let company = text[text.findIndex(t => t.includes('ISIN')) - 1];
  if (company === 'Gattungsbezeichnung') {
    company = text[text.findIndex(t => t.includes('ISIN')) - 2];
  }

  return company;
};

const findDateBuySell = text => {
  const lineNumber = text.findIndex(t => t.includes('Handelstag'));

  if (text[lineNumber + 1].split('.').length === 3) {
    return text[lineNumber + 1];
  } else if (text[lineNumber - 1].split('.').length === 3) {
    return text[lineNumber - 1];
  }

  throw { text: 'Unknown date' };
};

const findDateDividend = text => {
  const date = text[text.findIndex(t => t.includes('Zahltag')) + 1];
  return date;
};

const findShares = text => {
  const sharesLine = text[text.findIndex(t => t.includes('STK'))];
  const shares = sharesLine.split(' ')[1];
  return parseGermanNum(shares);
};

const findPrice = text => {
  const priceLine = text[text.findIndex(t => t.includes('Kurs')) + 1];
  const price = priceLine.split(' ')[1];
  return parseGermanNum(price);
};

const findAmount = text => {
  let amount = text[text.findIndex(t => t.includes('Kurswert')) + 2];
  return parseGermanNum(amount);
};

const findPayout = text => {
  const amount =
    text[text.findIndex(t => t.includes('Betrag zu Ihren Gunsten')) + 2];
  return parseGermanNum(amount);
};

const findFee = text => {
  let totalTraded = parseGermanNum(
    text[text.findIndex(t => t.includes('Kurswert')) + 2]
  );

  let skipLineCounter = 1;
  const amountLineNumber = text.findIndex(t => t.includes('Betrag zu Ihren '));

  // Search the debited amount which is in a line after `EUR`
  while (!text[amountLineNumber + skipLineCounter].includes('EUR')) {
    skipLineCounter++;
  }

  let totalPrice = parseGermanNum(text[amountLineNumber + skipLineCounter + 1]);
  return +Big(totalPrice).minus(totalTraded).abs();
};

const findTax = text => {
  const amount1 =
    text[
      text.findIndex(t =>
        t.includes('im laufenden Jahr einbehaltene Kapitalertragsteuer')
      ) + 2
    ];
  const amount2 =
    text[
      text.findIndex(t =>
        t.includes('im laufenden Jahr einbehaltener Solidaritätszuschlag')
      ) + 2
    ];
  return parseGermanNum(amount1) + parseGermanNum(amount2);
};

export const canParseData = textArr =>
  textArr.some(t => t.includes('BELEGDRUCK=J'));

export const parseData = text => {
  const isBuy = text.some(t => t.includes('Wir haben für Sie gekauft'));
  const isSell = text.some(t => t.includes('Wir haben für Sie verkauft'));
  const isDividend =
    text.some(t => t.includes('Erträgnisgutschrift')) ||
    text.some(t => t.includes('Dividendengutschrift'));

  let type, date, isin, company, shares, price, amount, fee, tax;

  if (isBuy) {
    type = 'Buy';
    date = findDateBuySell(text);
    amount = findAmount(text);
    fee = findFee(text);
    shares = findShares(text);
    tax = 0.0;
    price = findPrice(text);
  } else if (isSell) {
    type = 'Sell';
    date = findDateBuySell(text);
    amount = findAmount(text);
    fee = findFee(text);
    tax = findTax(text);
    shares = findShares(text);
    price = findPrice(text);
  } else if (isDividend) {
    type = 'Dividend';
    date = findDateDividend(text);
    amount = findPayout(text);
    fee = 0;
    tax = findTax(text);
    shares = findShares(text);
    price = +Big(amount).div(shares);
  } else throw { text: 'Unknown document type' };

  isin = findISIN(text);
  company = findCompany(text);

  const activity = {
    broker: 'onvista',
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

  const valid = every(values(activity), a => !!a || a === 0);

  if (!valid) throw { text: 'Error while parsing PDF', activity };
  return activity;
};

export const parsePages = contents => {
  let activities = [];
  for (let c of contents) {
    try {
      activities.push(parseData(c));
    } catch (e) {
      console.error('Error while parsing page (onvista)', e, c);
    }
  }
  return activities;
};
