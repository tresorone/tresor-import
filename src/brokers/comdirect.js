import format from 'date-fns/format';
import parse from 'date-fns/parse';
import Big from 'big.js';

import { parseGermanNum, validateActivity } from '@/helper';

const findISIN = (text, span) => {
  const isinLine = text[text.findIndex(t => t.includes('/ISIN')) + span];
  return isinLine.substr(isinLine.length - 12);
};

const findCompany = (text, span) => {
  const companyLine = text[text.findIndex(t => t.includes('/ISIN')) + span];
  // span = 2 means its a dividend PDF - dividends dont have the WKN in the same line
  return span === 2
    ? companyLine.trim()
    : companyLine.substr(0, companyLine.length - 6).trim();
};

const findDateBuySell = textArr => {
  const dateLine = textArr[textArr.findIndex(t => t.includes('Valuta')) + 1];
  const date = dateLine.split(/\s+/);
  return format(
    parse(date[date.length - 3], 'dd.MM.yyyy', new Date()),
    'yyyy-MM-dd'
  );
};

const findDateDividend = textArr => {
  const dateLine = textArr[textArr.findIndex(t => t.includes('zahlbar ab'))];
  const date = dateLine.split('zahlbar ab')[1].trim().substr(0, 10);
  return format(parse(date, 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd');
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

    if (!hasPiece || element.length === 0) {
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
  const amount = Big(parseGermanNum(priceLine.split('EUR')[1].trim()));
  // If there is a currency-rate within the price line a foreign reduction
  // has not yet been factored in
  if (priceLine.includes('Devisenkurs')) {
    return amount.plus(findPurchaseReduction(textArr));
  }
  return amount;
};

const findPayout = textArr => {
  const amountLine = textArr[textArr.findIndex(t => t.includes('Gunsten')) + 1];
  const amountPart = amountLine.split('EUR');
  const amount = amountPart[amountPart.length - 1].trim();
  return parseGermanNum(amount);
};

const findFee = (textArr, amount) => {
  const totalCostLine =
    textArr[textArr.findIndex(t => t.includes('Zu Ihren')) + 1];
  const totalCost = totalCostLine.split('EUR').pop().trim();
  return Big(parseGermanNum(totalCost)).minus(Big(amount));
};

const findPayoutTax = (textArr, fxRate) => {
  let payoutTax = Big(0);
  const withholdingTaxIndex = textArr.findIndex(line =>
    line.includes('Quellensteuer')
  );
  if (withholdingTaxIndex > 0) {
    const withholdingTax = parseGermanNum(
      textArr[withholdingTaxIndex].split(/\s+/)[4]
    );
    if (fxRate !== undefined && fxRate > 0) {
      payoutTax = payoutTax.plus(withholdingTax).div(fxRate);
    } else {
      payoutTax = payoutTax.plus(withholdingTax);
    }
  }
  return payoutTax;
};

const findPurchaseReduction = textArr => {
  const reduction = Big(0);
  const lineWithReduction = textArr.findIndex(t =>
    t.includes('Reduktion Kaufaufschlag')
  );
  if (lineWithReduction < 0) {
    return +reduction;
  }
  let rate = 1;
  // Sometimes the reduction is in euro. If not the rate will be determined to adjust to the right currency.
  if (!textArr[lineWithReduction].includes('EUR')) {
    rate = parseGermanNum(textArr[lineWithReduction - 1].split(' ')[3]);
  }
  const reductionValueSplit = textArr[lineWithReduction].split(' ');
  let reductionValue = reductionValueSplit[reductionValueSplit.length - 1];
  if (reductionValue.endsWith('-')) {
    reductionValue = Big(parseGermanNum(reductionValue.slice(0, -1))).abs();
  }
  return Big(reductionValue).div(rate);
};

const findPayoutFxrateForeignCurrency = textArr => {
  const foreignIndex = textArr.findIndex(line =>
    line.includes('zum Devisenkurs:')
  );
  if (foreignIndex > 0) {
    const foreignLine = textArr[foreignIndex].split(/\s+/);
    const fxRate = parseGermanNum(foreignLine[3]);
    const foreignCurrency = foreignLine[2].split('/')[1];
    return [fxRate, foreignCurrency];
  }
  return [undefined, undefined];
};

const findBuyFxRateForeignCurrency = textArr => {
  const foreignIndex = textArr.findIndex(line =>
    line.includes('Umrechnung zum Devisenkurs ')
  );
  if (foreignIndex > 0) {
    const fxRateLine = textArr[foreignIndex].split(/\s+/);
    const foreignCurrency = textArr[foreignIndex - 3].split(/\s+/);
    return [parseGermanNum(fxRateLine[3]), foreignCurrency[2]];
  }
  return [undefined, undefined];
};

const isBuy = textArr => textArr.some(t => t.includes('Wertpapierkauf'));
const isSell = textArr => textArr.some(t => t.includes('Wertpapierverkauf'));

const isDividend = textArr =>
  textArr.some(t => t.includes('Ertragsgutschrift')) ||
  textArr.some(t => t.includes('Dividendengutschrift'));

export const canParsePage = (content, extension) =>
  extension === 'pdf' &&
  content.some(line => line.includes('comdirect bank')) &&
  (isBuy(content) || isSell(content) || isDividend(content));

const parseData = textArr => {
  let type,
    date,
    isin,
    company,
    shares,
    price,
    amount,
    fee,
    tax,
    fxRate,
    foreignCurrency;

  if (isBuy(textArr)) {
    type = 'Buy';
    date = findDateBuySell(textArr);
    isin = findISIN(textArr, 2);
    company = findCompany(textArr, 1);
    amount = +findAmount(textArr);
    shares = findShares(textArr);
    price = +Big(amount).div(shares);
    fee = +findFee(textArr, amount);
    tax = 0;
    [fxRate, foreignCurrency] = findBuyFxRateForeignCurrency(textArr);
  } else if (isSell(textArr)) {
    type = 'Sell';
    isin = findISIN(textArr, 2);
    company = findCompany(textArr, 1);
    date = findDateBuySell(textArr);
    shares = findShares(textArr);
    amount = +findAmount(textArr);
    price = +Big(amount).div(Big(shares));
    fee = +findFee(textArr, amount);
    tax = 0;
  } else if (isDividend(textArr)) {
    type = 'Dividend';
    isin = findISIN(textArr, 3);
    company = findCompany(textArr, 2);
    date = findDateDividend(textArr);
    shares = findDividendShares(textArr);
    amount = findPayout(textArr);
    price = +Big(amount).div(Big(shares));
    [fxRate, foreignCurrency] = findPayoutFxrateForeignCurrency(textArr);
    fee = 0;
    tax = +findPayoutTax(textArr, fxRate);
  }
  let activity = {
    broker: 'comdirect',
    type,
    date,
    isin,
    company,
    shares,
    price,
    amount,
    fee,
    tax,
  };
  if (fxRate !== undefined) {
    activity.fxRate = fxRate;
  }
  if (foreignCurrency !== undefined) {
    activity.foreignCurrency = foreignCurrency;
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
