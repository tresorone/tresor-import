import format from 'date-fns/format';
import parse from 'date-fns/parse';
import every from 'lodash/every';
import values from 'lodash/values';
import Big from 'big.js';

// remove . (thousands separator) and replace , (decimal separator) with a dot
// also remove anything that isn't a digit, decimal point or a minus sign
const parseGermanNum = n => {
  return parseFloat(
    n
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '')
  );
};

// parse line like:
//   ISIN                           Company
// "AT0000707674                 ESPA BEST OF WORLD",
const findISIN = (text, span) => {
  const isinLine =
    text[text.findIndex(t => t.includes('Auftragsnummer')) + span];
  // the order number is always 12 charactes long
  const isin = isinLine.substr(0, 12);
  return isin;
};

const findCompany = (text, span) => {
  const companyLine =
    text[text.findIndex(t => t.includes('Auftragsnummer')) + span];
  // company starts right after the order number which is 12 characters followed by 17 spaces
  const company = companyLine.slice(12 + 17);

  return company;
};

const findDateBuySell = textArr => {
  const dateLine = textArr[textArr.findIndex(t => t.includes('Schlusstag'))];
  const date = dateLine.split(':')[1].trim().substr(0, 10);
  return date;
};

const findDateDividend = textArr => {
  const dateLine = textArr[textArr.findIndex(t => t.includes('Extag'))];
  const datePart = dateLine.split('Extag')[1].trim().substr(0, 10);
  const date = datePart;

  return date;
};

const findShares = textArr => {
  const sharesLine =
    textArr[textArr.findIndex(t => t.includes('Nennwert')) + 1];
  const shares = sharesLine.split('  ')[1];
  return parseGermanNum(shares);
};

const findDividendShares = textArr => {
  const sharesLine = textArr[textArr.findIndex(t => t.includes('STK'))];
  const shares = sharesLine.split('  ').filter(i => i.length > 0)[1];
  // console.log(shares)
  return parseGermanNum(shares);
};

const findAmount = textArr => {
  const priceArea = textArr.slice(
    textArr.findIndex(t => t.includes('Kurswert'))
  );
  const priceLine = priceArea[priceArea.findIndex(t => t.includes('EUR'))];
  const amount = priceLine.split('EUR')[1].trim();
  return parseGermanNum(amount);
};

const findPayout = textArr => {
  const amountLine = textArr[textArr.findIndex(t => t.includes('Gunsten')) + 1];
  const amountPart = amountLine.split('EUR');
  const amount = amountPart[amountPart.length - 1].trim();
  // console.log('payout', amount)
  return parseGermanNum(amount);
};

const findFee = textArr => {
  const amount = findAmount(textArr);
  const totalCostLine =
    textArr[textArr.findIndex(t => t.includes('Zu Ihren')) + 1];
  const totalCost = totalCostLine.split('EUR').pop().trim();

  const diff = +Big(parseGermanNum(totalCost)).minus(Big(amount));
  return Math.abs(diff);
};

const isBuy = textArr => {
  return (
    textArr.some(t => t.includes('Kauf aus Wertpapierliste')) ||
    textArr.some(t => t.includes('uf Marktplatz'))
  );
};
const isSell = textArr => textArr.some(t => t.includes('*'));

const isDividend = textArr => textArr.some(t => t.includes('Ausschüttung'));

export const canParseData = textArr => {
  return (
    textArr.some(t => t.includes('ERSTE')) &&
    textArr.some(t => t.includes('SPARKASSEN')) &&
    (isBuy(textArr) || isSell(textArr) || isDividend(textArr))
  );
};
export const parseData = textArr => {
  let type, date, isin, company, shares, price, amount, fee;

  if (isBuy(textArr)) {
    type = 'Buy';
    isin = findISIN(textArr, 1);
    company = findCompany(textArr, 1);
    date = findDateBuySell(textArr);
    shares = findShares(textArr);
    amount = findAmount(textArr);
    price = +Big(amount).div(Big(shares));
    fee = findFee(textArr);
  } else if (isSell(textArr)) {
    type = 'Sell';
    isin = findISIN(textArr, 2);
    company = findCompany(textArr, 1);
    date = findDateBuySell(textArr);
    shares = findShares(textArr);
    amount = findAmount(textArr);
    price = +Big(amount).div(Big(shares));
    fee = findFee(textArr);
  } else if (isDividend(textArr)) {
    type = 'Dividend';
    isin = findISIN(textArr, 1);
    company = findCompany(textArr, 2);
    date = findDateDividend(textArr);
    shares = findDividendShares(textArr);
    amount = findPayout(textArr);
    price = +Big(amount).div(Big(shares));
    fee = 0;
  }

  const activity = {
    broker: 'erstebank',
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
  // only first page has activity data
  const activity = parseData(contents[0]);
  return [activity];
};

export const testables = {
  isBuy: isBuy,
  findISIN: findISIN,
  findCompany: findCompany,
};
