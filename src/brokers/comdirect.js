import format from 'date-fns/format';
import parse from 'date-fns/parse';
import every from 'lodash/every';
import values from 'lodash/values';
import Big from 'big.js';

import { parseGermanNum } from '@/helper';

const findISIN = (text, span) => {
  const isinLine = text[text.findIndex(t => t.includes('/ISIN')) + span];
  const isin = isinLine.substr(isinLine.length - 12);
  return isin;
};

const findCompany = (text, span) => {
  const companyLine = text[text.findIndex(t => t.includes('/ISIN')) + span];
  // span = 2 means its a dividend PDF - dividends dont have the WKN in the same line
  const company =
    span === 2
      ? companyLine.trim()
      : companyLine.substr(0, companyLine.length - 6).trim();

  return company;
};

const findDateBuySell = textArr => {
  const dateLine = textArr[textArr.findIndex(t => t.includes('Geschäftstag'))];
  const date = dateLine.split(':')[1].trim().substr(0, 10);
  return date;
};

const findDateDividend = textArr => {
  const dateLine = textArr[textArr.findIndex(t => t.includes('zahlbar ab'))];
  const datePart = dateLine.split('zahlbar ab')[1].trim().substr(0, 10);
  const date = datePart;

  return date;
};

const findShares = textArr => {
  const sharesLine =
    textArr[textArr.findIndex(t => t.includes('Nennwert')) + 1];

  let shares = 0;
  let hasPiece = false;
  sharesLine.split(' ').forEach(element => {
    if (shares > 0) {
      return;
    }

    if (element.includes('St.')) {
      hasPiece = true;
      return;
    }

    if (!hasPiece || element.length == 0) {
      return;
    }

    shares = parseGermanNum(element);
  });

  return shares;
};

const findDividendShares = textArr => {
  const sharesLine = textArr[textArr.findIndex(t => t.includes('STK'))];
  const shares = sharesLine.split('  ').filter(i => i.length > 0)[1];
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

const findPurchaseReduction = textArr => {
  let reduction = Big(0);
  const lineWithReduction = textArr.findIndex(t =>
    t.includes('Reduktion Kaufaufschlag')
  );
  if (lineWithReduction < 0) {
    return +reduction;
  }

  const reductionLineContent = textArr[lineWithReduction];
  let reductionValue = reductionLineContent.split('EUR').pop();
  if (reductionValue.endsWith('-')) {
    reductionValue = reductionValue.slice(0, -1);
  }

  return +reduction.minus(Big(parseGermanNum(reductionValue)));
};

const isBuy = textArr => textArr.some(t => t.includes('Wertpapierkauf'));
const isSell = textArr => textArr.some(t => t.includes('Wertpapierverkauf'));

const isDividend = textArr =>
  textArr.some(t => t.includes('Ertragsgutschrift')) ||
  textArr.some(t => t.includes('Dividendengutschrift'));

export const canParseData = textArr =>
  textArr.some(t => t.includes('comdirect bank')) &&
  (isBuy(textArr) || isSell(textArr) || isDividend(textArr));

export const parseData = textArr => {
  let type, date, isin, company, shares, price, amount, fee;

  if (isBuy(textArr)) {
    const reduction = findPurchaseReduction(textArr);
    const foundAmount = Big(findAmount(textArr));
    const totalAmount = foundAmount.plus(reduction);
    const totalFee = Big(findFee(textArr)).plus(reduction); // Use plus instead of minus to prevent multiply with -1

    type = 'Buy';
    isin = findISIN(textArr, 2);
    company = findCompany(textArr, 1);
    date = findDateBuySell(textArr);
    shares = findShares(textArr);
    amount = +totalAmount;
    price = 0;
    price = +foundAmount.div(Big(shares));
    fee = +totalFee;
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
    isin = findISIN(textArr, 3);
    company = findCompany(textArr, 2);
    date = findDateDividend(textArr);
    shares = findDividendShares(textArr);
    amount = findPayout(textArr);
    price = +Big(amount).div(Big(shares));
    fee = 0;
  }

  const activity = {
    broker: 'comdirect',
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
