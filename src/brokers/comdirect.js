import format from 'date-fns/format';
import parse from 'date-fns/parse';
import Big from 'big.js';

import { parseGermanNum, validateActivity } from '@/helper';

const findISINAndWKN = (text, spanISIN) => {
  // The line contains either WPKNR/ISIN or WKN/ISIN, depending on the document
  const isinIndex = text.findIndex(t => t.includes('/ISIN'));
  const isinLine = text[isinIndex + spanISIN].split(/\s+/);
  const wknLine = text[isinIndex + 1].split(/\s+/);
  return [isinLine[isinLine.length - 1], wknLine[wknLine.length - 1]];
};

const findCompany = (text, span) => {
  const companyLine = text[text.findIndex(t => t.includes('/ISIN')) + span];
  // span = 2 means its a dividend PDF - dividends dont have the WKN in the same line
  return span === 2
    ? companyLine.trim()
    : companyLine.substr(0, companyLine.length - 6).trim();
};

const findDateBuySell = textArr => {
  const dateLine = textArr[textArr.findIndex(t => t.includes('Geschäftstag'))];
  const date = dateLine.split(/\s+/)[2];
  return format(
    parse(date, 'dd.MM.yyyy', new Date()),
    'yyyy-MM-dd'
  );
};

const findDateDividend = textArr => {
  const dateLine = textArr[
    textArr.findIndex(t => t.includes('Valuta')) + 1
  ].split(/\s+/);
  const date = dateLine[dateLine.length - 3];
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

const findAmount = (textArr, fxRate, foreignCurrency) => {
  const amountArea = textArr.findIndex(t => t.includes('Kurswert'));
  const amountLine = textArr[amountArea].split(/\s+/);
  let amount = Big(parseGermanNum(amountLine[amountLine.length - 1]));

  if (amountLine[amountLine.length - 2] === foreignCurrency) {
    amount = amount.div(fxRate);
  }
  // If there is a currency-rate within the price line a foreign reduction
  // has not yet been factored in
  if (amountLine.includes('Devisenkurs')) {
    return amount.plus(findPurchaseReduction(textArr, fxRate, foreignCurrency));
  }
  return amount;
};

const findPayout = (textArr, fxRate) => {
  const amountLine =
    textArr[textArr.findIndex(t => t.includes('Bruttobetrag'))];
  const amountPart = amountLine.split(/\s+/);
  const amount = parseGermanNum(amountPart[2]);
  if (fxRate !== undefined) {
    return +Big(amount).div(fxRate);
  }
  return amount;
};

const findFee = (textArr, amount) => {
  const totalCostLine = textArr[
    textArr.findIndex(t => t.includes('Zu Ihren')) + 1
  ].split(/\s+/);
  return Big(parseGermanNum(totalCostLine[totalCostLine.length - 1])).minus(
    Big(amount)
  );
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

const findPurchaseReduction = (textArr, fxRate, foreignCurrency) => {
  const reduction = Big(0);
  const reductionIndex = textArr.findIndex(t =>
    t.includes('Reduktion Kaufaufschlag')
  );
  if (reductionIndex < 0) {
    return +reduction;
  }
  let rate = 1;
  const reductionLine = textArr[reductionIndex].split(/\s+/);
  let reductionValue = reductionLine[reductionLine.length - 1];
  if (reductionValue.endsWith('-')) {
    reductionValue = Big(parseGermanNum(reductionValue.slice(0, -1))).abs();
  }
  // Sometimes the reduction is in euro. If not the fxRate will be applied
  if (reductionLine.includes(foreignCurrency)) {
    return Big(reductionValue).div(rate);
  }
  return Big(reductionValue);
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
  const foreignIndexV1 = textArr.findIndex(line =>
    line.includes('Umrechnung zum Devisenkurs ')
  );
  const foreignIndexV2 = textArr.findIndex(line =>
    line.includes('Umrechn. zum Dev. kurs ')
  );
  let fxRate = undefined;
  let foreignCurrency = undefined;
  if (foreignIndexV1 > 0) {
    fxRate = parseGermanNum(textArr[foreignIndexV1].split(/\s+/)[3]);
    foreignCurrency = textArr[foreignIndexV1 - 3].split(/\s+/)[2];
  } else if (foreignIndexV2 > 0) {
    fxRate = parseGermanNum(textArr[foreignIndexV2].split(/\s+/)[4]);
    foreignCurrency = textArr[foreignIndexV2 - 3].split(/\s+/)[2];
  }
  return [fxRate, foreignCurrency];
};

const isBuy = textArr => textArr.some(t => t.includes('Wertpapierkauf'));

const isSell = textArr => textArr.some(t => t.includes('Wertpapierverkauf'));

const isDividend = textArr =>
  textArr.some(t => t.includes('Ertragsgutschrift')) ||
  textArr.some(t => t.includes('Dividendengutschrift'));

export const canParsePage = (content, extension) =>
  // The defining string used to be 'comdirect bank'. However, this string is
  // not present in every document; 'comdirect' is.
  extension === 'pdf' &&
  content.some(line => line.includes('comdirect')) &&
  (isBuy(content) || isSell(content) || isDividend(content));

const parseData = textArr => {
  let type,
    date,
    isin,
    wkn,
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
    [fxRate, foreignCurrency] = findBuyFxRateForeignCurrency(textArr);
    [isin, wkn] = findISINAndWKN(textArr, 2);
    company = findCompany(textArr, 1);
    amount = +findAmount(textArr, fxRate, foreignCurrency);
    shares = findShares(textArr);
    price = +Big(amount).div(shares);
    fee = +findFee(textArr, amount);
    tax = 0;
  } else if (isSell(textArr)) {
    type = 'Sell';
    [isin, wkn] = findISINAndWKN(textArr, 2);
    company = findCompany(textArr, 1);
    date = findDateBuySell(textArr);
    shares = findShares(textArr);
    amount = +findAmount(textArr);
    price = +Big(amount).div(Big(shares));
    fee = +findFee(textArr, amount);
    tax = 0;
  } else if (isDividend(textArr)) {
    [fxRate, foreignCurrency] = findPayoutFxrateForeignCurrency(textArr);
    type = 'Dividend';
    [isin, wkn] = findISINAndWKN(textArr, 3);
    company = findCompany(textArr, 2);
    date = findDateDividend(textArr);
    shares = findDividendShares(textArr);
    amount = findPayout(textArr, fxRate);
    price = +Big(amount).div(Big(shares));
    fee = 0;
    tax = +findPayoutTax(textArr, fxRate);
  }
  let activity = {
    broker: 'comdirect',
    type,
    date,
    isin,
    wkn,
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
