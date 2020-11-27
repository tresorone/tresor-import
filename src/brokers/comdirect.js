import format from 'date-fns/format';
import parse from 'date-fns/parse';
import Big from 'big.js';
import { onvistaIdentificationString } from './onvista';

import { parseGermanNum, validateActivity } from '@/helper';

const findISINAndWKN = (text, spanISIN, spanWKN) => {
  // The line contains either WPKNR/ISIN or WKN/ISIN, depending on the document
  const isinIndex = text.findIndex(t => t.includes('/ISIN'));
  const isinLine = text[isinIndex + spanISIN].split(/\s+/);
  const wknLine = text[isinIndex + spanWKN].split(/\s+/);
  return [isinLine[isinLine.length - 1], wknLine[wknLine.length - 1]];
};

const findCompany = (text, type, formatId) => {
  const companyLineIndex = text.findIndex(t => t.includes('/ISIN'));
  // span = 2 means its a dividend PDF - dividends dont have the WKN in the same line
  if (type === 'Buy') {
    return text[companyLineIndex + 1].split(/\s+/).slice(0, -1).join(' ');
  } else if (type === 'Sell') {
    const lineContent = text[companyLineIndex + 1].trim();

    if (formatId === 0) {
      // In this format, the name is one the same line as the WKN. We need only the first element before multiple spaces. Example:
      // Arcimoto Inc.                                                            A2JN1H
      return lineContent.split(/\s{2,}/)[0].trim();
    }

    return lineContent;
  } else if (type === 'Dividend') {
    return text[companyLineIndex + 2].trim();
  }
};

const findDateBuySell = textArr => {
  const dateLine = textArr[textArr.findIndex(t => t.includes('Geschäftstag'))];
  return format(
    parse(
      dateLine.match(/[0-9]{2}.[0-9]{2}.[1-2][0-9]{3}/)[0],
      'dd.MM.yyyy',
      new Date()
    ),
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

const findShares = (textArr, formatId) => {
  // for sells that are split into multiple sellorders, we want to get all
  // sell shares at once

  const splitSellAmountIndex = textArr.indexOf('(ggf. gerundet)');
  if (splitSellAmountIndex >= 0) {
    if (formatId === 0) {
      const splitSellLine = textArr[splitSellAmountIndex - 1].split(/\s+/);
      return parseGermanNum(splitSellLine[2]);
    } else {
      const splitSellLine = textArr[splitSellAmountIndex - 3].split(/\s+/);
      return parseGermanNum(splitSellLine[splitSellLine.length - 1]);
    }
  }

  // Otherwise just search for the first occurance of 'St.'
  const sharesLine =
    textArr[textArr.findIndex(t => t.includes('Nennwert')) + 1];
  let shares = 0;
  let hasPiece = false;
  sharesLine.split(/\s+/).forEach(element => {
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
  const shares = sharesLine.split(/\s+/).filter(i => i.length > 0)[1];
  return parseGermanNum(shares);
};

const findAmount = (textArr, fxRate, foreignCurrency, formatId) => {
  let isInForeignCurrency = false;
  let amount = 0;
  // Sometimes orders are split across multiple sells. This needs to be
  // handled differently. There are no tests for split sells in foreign currencies
  // at the moment so issues might arise here
  const splitSellAmountIndex = textArr.indexOf('(ggf. gerundet)');

  // Logic for normal Buy, Sell, and Dividend Operations:
  const amountIndex = textArr.findIndex(t => t.includes('Kurswert'));

  if (splitSellAmountIndex > 0) {
    let lineWithAmount;
    if (formatId === 0) {
      const splittedLine = textArr[splitSellAmountIndex - 1].split(/\s+/);
      lineWithAmount = splittedLine[splittedLine.length - 1];
      if (splittedLine[splittedLine.length - 2] === foreignCurrency) {
        isInForeignCurrency = true;
      }
    } else {
      lineWithAmount = textArr[splitSellAmountIndex - 1];
    }

    amount = Big(parseGermanNum(lineWithAmount));
  } else if (amountIndex > 0) {
    const amountLine = textArr[amountIndex].split(/\s+/);
    amount = Big(parseGermanNum(amountLine[amountLine.length - 1]));

    if (amountLine[amountLine.length - 2] === foreignCurrency) {
      isInForeignCurrency = true;
    }

    // BUY ONLY:
    // If there is a currency-rate within the price line a foreign
    // reduction has not yet been factored in
    if (amountLine.includes('Devisenkurs')) {
      return amount.plus(
        findPurchaseReduction(textArr, fxRate, foreignCurrency)
      );
    }
  }
  return isInForeignCurrency ? amount.div(fxRate) : amount;
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

const findFee = (textArr, amount, isSell = false, formatId = undefined) => {
  const span = formatId === undefined || formatId === 1 ? 8 : 1;

  const preTaxLine = textArr[
    textArr.findIndex(t => t.includes('vor Steuern')) + span
  ].split(/\s+/);
  const preTaxAmount = parseGermanNum(preTaxLine[preTaxLine.length - 1]);

  return isSell
    ? Big(amount).minus(preTaxAmount)
    : Big(preTaxAmount).minus(amount);
};

const findTax = (textArr, fxRate, formatId) => {
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

  // Relevant for Sell Operations
  const payedTaxIndex = textArr.indexOf('abgeführte Steuern');
  if (payedTaxIndex >= 0) {
    let lineWithTaxValue;
    if (formatId === 1) {
      lineWithTaxValue = textArr[payedTaxIndex + 2];
    } else {
      lineWithTaxValue = textArr[payedTaxIndex + 1].split(/\s+/)[1];
    }

    payoutTax = payoutTax.plus(Big(parseGermanNum(lineWithTaxValue)).abs());
  }

  return +payoutTax;
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

    const currencyLineNumber = textArr.findIndex(line => line.includes('St.'));
    if (currencyLineNumber > 0) {
      const lineElements = textArr[currencyLineNumber]
        .split('St.')[1]
        .trim()
        .split(/\s+/);
      foreignCurrency = lineElements[1];
    }
  }

  return [fxRate, foreignCurrency];
};

// I'm not sure whats the best way to handle different types of document layouts AND if the reason
// for this are different layouts or only minor document structure changes which will end up with
// an other text format for us...
const getDocumentFormatId = content => {
  // There are currently two types of documents:

  if (content.some(line => line.includes('Wertpapier-Bezeichnung '))) {
    // One with: "Wertpapier-Bezeichnung                                               WPKNR/ISIN"
    return 0;
  }

  // One with: "Wertpapier-Bezeichnung"
  return 1;
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
  content.every(line => !line.includes(onvistaIdentificationString)) &&
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

  const formatId = getDocumentFormatId(textArr);

  if (isBuy(textArr)) {
    type = 'Buy';
    date = findDateBuySell(textArr);
    [fxRate, foreignCurrency] = findBuyFxRateForeignCurrency(textArr);
    [isin, wkn] = findISINAndWKN(textArr, 2, 1);
    company = findCompany(textArr, type, formatId);
    amount = +findAmount(textArr, fxRate, foreignCurrency, formatId);
    shares = findShares(textArr, formatId);
    price = +Big(amount).div(shares);
    fee = +findFee(textArr, amount, false, formatId);
    tax = 0;
  } else if (isSell(textArr)) {
    type = 'Sell';
    [isin, wkn] = findISINAndWKN(
      textArr,
      formatId == 1 ? 4 : 2,
      formatId == 1 ? 2 : 1
    );
    company = findCompany(textArr, type, formatId);
    date = findDateBuySell(textArr);
    [fxRate, foreignCurrency] = findBuyFxRateForeignCurrency(textArr);
    shares = findShares(textArr, formatId);
    amount = +findAmount(textArr, fxRate, foreignCurrency, formatId);
    price = +Big(amount).div(shares);
    fee = +findFee(textArr, amount, true, formatId);
    tax = findTax(textArr, fxRate, formatId);
  } else if (isDividend(textArr)) {
    [fxRate, foreignCurrency] = findPayoutFxrateForeignCurrency(textArr);
    type = 'Dividend';
    [isin, wkn] = findISINAndWKN(textArr, 3, 1);
    company = findCompany(textArr, type, formatId);
    date = findDateDividend(textArr);
    shares = findDividendShares(textArr);
    amount = findPayout(textArr, fxRate);
    price = +Big(amount).div(shares);
    fee = 0;
    tax = findTax(textArr, fxRate, formatId);
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
  // Sometimes information regarding the first transcation (i. e. tax in sell
  // documents) is spread across multiple pdf pages
  const activities = [parseData(contents.flat())];

  return {
    activities,
    status: 0,
  };
};
