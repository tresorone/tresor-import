import Big from 'big.js';

import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
} from '@/helper';

//===========================
// BLOCK 1
// SINGLE TRANSACTIONS
//===========================
const findAmountBuy = textArr => {
  const amountIdx = textArr.findIndex(t => t.includes('Kurswert'));
  return parseGermanNum(textArr[amountIdx + 3]);
};

const findAmountDividend = (textArr, foreignDividend) => {
  let amountIndex;
  if (foreignDividend) {
    amountIndex = textArr.findIndex(t => t.includes('Devisenkurs:')) + 4;
  } else {
    amountIndex =
      textArr.findIndex(t => t.includes('Steuerbemessungsgrundlage')) - 1;
  }
  return parseGermanNum(textArr[amountIndex]);
};

const findSharesBuy = textArr => {
  return Big(
    parseGermanNum(textArr[textArr.findIndex(t => t.includes('St.')) + 1])
  );
};

const findSharesDividend = textArr => {
  return parseGermanNum(
    textArr[textArr.findIndex(t => t.includes('Stk.') || t.includes('STK')) + 1]
  );
};

const findDateBuy = textArr =>
  textArr[textArr.findIndex(t => t.includes('Geschäftstag')) + 2];

const findDateDividend = (textArr, foreignDividend = false) => {
  if (foreignDividend) {
    return textArr[textArr.findIndex(t => t.includes('Information')) - 3];
  }
  return textArr[textArr.findIndex(t => t.includes('Valuta')) + 1];
};

const findWknBuy = textArr => {
  const wknRoughIdx = textArr.indexOf('Wertpapierkennnummer');
  const slicedArry = textArr.slice(wknRoughIdx);
  return slicedArry[slicedArry.findIndex(t => /^[0-9A-Z]{6}$/.test(t))];
};

const findWknDividend = textArr =>
  textArr[textArr.findIndex(t => t.includes('WKN')) + 3];

const findIsinDividend = (textArr, foreignDividend) => {
  let isinIdx;
  if (foreignDividend) {
    isinIdx = textArr.findIndex(t => t.includes('STK')) + 2;
  } else {
    isinIdx = textArr.findIndex(t => t.includes('ISIN')) + 3;
  }
  return textArr[isinIdx];
};

const findPriceBuy = textArr => {
  const priceIdx = textArr.findIndex(t => t.includes('Kurswert')) - 1;
  return parseGermanNum(textArr[priceIdx]);
};

const findFeeBuy = (textArr, amount) => {
  const payedAmountIdx = textArr.findIndex(t => t.includes('Valuta')) + 15;
  return +Big(parseGermanNum(textArr[payedAmountIdx])).minus(amount);
};

const findTaxDividend = textArr => {
  const taxIndex = textArr.findIndex(t => t.includes('abgeführte'));
  if (taxIndex >= 0) {
    return Math.abs(parseGermanNum(textArr[taxIndex + 3]));
  }
  return 0;
};

const findCompanyBuy = textArr => {
  const startCompanyName =
    textArr.findIndex(t => t.includes('Wertpapierkennnummer')) + 1;
  const companyLength = textArr
    .slice(startCompanyName)
    .findIndex(t => /^[0-9A-Z]{6}$/.test(t));
  return textArr
    .slice(startCompanyName, startCompanyName + companyLength)
    .join(' ');
};

const findCompanyDividend = (textArr, foreignDividend = false) => {
  if (foreignDividend) {
    const startCompanyName = textArr.findIndex(t => t.includes('WKN/ISIN')) + 4;
    const endCompanyName = textArr.findIndex(t => t.includes('STK')) - 1;
    return textArr.slice(startCompanyName, endCompanyName + 1).join(' ');
  }
  const startCompanyName =
    textArr.findIndex(t => t.includes('Investment-Ausschüttung')) + 5;
  return textArr.slice(startCompanyName, startCompanyName + 2).join(' ');
};

const isBuy = textArr => textArr.some(t => t.includes('Wertpapierkauf'));

const isDividend = textArr =>
  textArr.some(
    t => t === 'Investment-Ausschüttung' || t === 'Ertragsgutschrift'
  );

const parseSingleTransaction = textArr => {
  let type,
    date,
    wkn,
    isin,
    company,
    shares,
    price,
    amount,
    fxRate,
    foreignCurrency;
  let fee = 0;
  let tax = 0;
  let activity;
  if (isBuy(textArr)) {
    type = 'Buy';
    date = findDateBuy(textArr);
    wkn = findWknBuy(textArr);
    company = findCompanyBuy(textArr);
    shares = +findSharesBuy(textArr);
    amount = findAmountBuy(textArr);
    price = findPriceBuy(textArr);
    fee = findFeeBuy(textArr, amount);
  } else if (isDividend(textArr)) {
    const foreignCurrencyIndex = textArr.indexOf('Devisenkurs:');
    const foreignDividend = foreignCurrencyIndex >= 0;
    type = 'Dividend';
    date = findDateDividend(textArr, foreignDividend);
    wkn = findWknDividend(textArr);
    isin = findIsinDividend(textArr, foreignDividend);
    company = findCompanyDividend(textArr, foreignDividend);
    shares = findSharesDividend(textArr);
    amount = findAmountDividend(textArr, foreignDividend);
    price = +Big(amount).div(shares);
    tax = findTaxDividend(textArr);
    if (foreignCurrencyIndex >= 0) {
      foreignCurrency = textArr[foreignCurrencyIndex + 1].split('/')[1];
      fxRate = parseGermanNum(textArr[foreignCurrencyIndex + 2]);
    }
  }
  // sadly, no exact times can be extracted as they are not given in any of the
  // files
  const [parsedDate, parsedDateTime] = createActivityDateTime(date, undefined);
  activity = {
    broker: 'commerzbank',
    type,
    date: parsedDate,
    datetime: parsedDateTime,
    wkn,
    company,
    shares,
    price,
    amount,
    fee,
    tax,
  };
  if (isin !== undefined) {
    activity.isin = isin;
  }
  if (foreignCurrency !== undefined) {
    activity.foreignCurrency = foreignCurrency;
    activity.fxRate = fxRate;
  }
  return validateActivity(activity);
};

//===========================
// BLOCK 2
// TRANSACTION REPORTS
//===========================

const findPriorIndex = (arr, idx, keyArr = ['STK', '/ Sperre']) => {
  let backwardIdx = 1;
  while (idx - backwardIdx >= 0) {
    if (keyArr.includes(arr[idx - backwardIdx])) {
      return idx - backwardIdx;
    }
    backwardIdx += 1;
  }
  return -1;
};

const isTransactionReport = textArr =>
  textArr
    .join('')
    .includes(
      'StückzinsenKurs/ AusschüttungTransaktionsartDatumWKN / ISINEndbetrag'
    );

const parseBuySellTransaction = (pdfPage, pageIdx, type) => {
  const txStart = findPriorIndex(pdfPage, pageIdx) + 1;
  const txEndIdx = pdfPage.indexOf('STK', pageIdx);
  const priceSplitOffset = pdfPage[pageIdx - 1].includes(' ') ? 0 : 1;
  const fxOffset = txEndIdx - pageIdx > 7 ? 1 : 0;
  const [parsedDate, parsedDateTime] = createActivityDateTime(
    pdfPage[pageIdx + 6 + fxOffset],
    undefined
  );
  let activity = {
    broker: 'commerzbank',
    type: type,
    date: parsedDate,
    datetime: parsedDateTime,
    company: pdfPage.slice(txStart, pageIdx - 2 - priceSplitOffset).join(' '),
    wkn: pdfPage[pageIdx + 2],
    isin: pdfPage[pageIdx + 3].split(' ')[1],
    shares: Math.abs(parseGermanNum(pdfPage[pageIdx + 5 + fxOffset])),
    amount: Math.abs(parseGermanNum(pdfPage[pageIdx - 2 - priceSplitOffset])),
    price: Math.abs(parseGermanNum(pdfPage[pageIdx - 1 - priceSplitOffset])),
    fee: 0,
    tax: 0,
  };
  // It is not exactly clear what is a fee and what is a tax from the .pdf
  // Since Buy only has fees it will be a fee for the buy operation and a
  // tax for the sell operations. This is NOT ENTIRELY CORRECT
  const payedAmount = Math.abs(parseGermanNum(pdfPage[pageIdx + 4]));
  if (type === 'Buy') {
    activity.fee = +Big(activity.amount).minus(payedAmount).abs();
  } else if (type === 'Sell') {
    activity.tax = +Big(activity.amount).minus(payedAmount).abs();
  }
  if (fxOffset === 1) {
    activity.foreignCurrency =
      priceSplitOffset === 0
        ? pdfPage[pageIdx - 1].split(' ')[1]
        : pdfPage[pageIdx - 1];
    activity.fxRate = parseGermanNum(pdfPage[pageIdx + 5]);
    activity.price = +Big(activity.price).div(activity.fxRate);
  }
  return activity;
};

const parseDividendTransaction = (pdfPage, pageIdx) => {
  const txEndIdx = pdfPage.indexOf('STK', pageIdx);
  const txStart = findPriorIndex(pdfPage, pageIdx) + 1;
  const priceSplitOffset = pdfPage[pageIdx - 1].includes(' ') ? 0 : 1;

  // If the activity is this long, it is because of foreign currency information
  const fxOffset = txEndIdx - pageIdx > 7 ? 1 : 0;
  const [parsedDate, parsedDateTime] = createActivityDateTime(
    pdfPage[pageIdx + 6 + fxOffset],
    undefined
  );

  let activity = {
    broker: 'commerzbank',
    type: 'Dividend',
    date: parsedDate,
    datetime: parsedDateTime,
    company: pdfPage.slice(txStart, pageIdx - 1 - priceSplitOffset).join(' '),
    wkn: pdfPage[pageIdx + 2],
    isin: pdfPage[pageIdx + 3].split(' ')[1],
    shares: Math.abs(parseGermanNum(pdfPage[pageIdx + 5 + fxOffset])),
    price: Math.abs(parseGermanNum(pdfPage[pageIdx - 1 - priceSplitOffset])),
    fee: 0,
  };

  if (fxOffset === 1) {
    activity.foreignCurrency =
      priceSplitOffset === 0
        ? pdfPage[pageIdx - 1].split(' ')[1]
        : pdfPage[pageIdx - 1];
    activity.fxRate = parseGermanNum(pdfPage[pageIdx + 5]);
    activity.price = +Big(activity.price).div(activity.fxRate);
  }

  activity.amount = +Big(activity.shares).times(activity.price);
  const postTaxAmount = Math.abs(parseGermanNum(pdfPage[pageIdx + 4]));
  // It is unknown from the .pdf file why the net amount and payed out amount
  // diverge, most likely reason is tax:
  activity.tax = +Big(activity.amount).minus(postTaxAmount);
  return activity;
};

// This is not yet implemented in the T1 backend and can be commented out as soon as it is.
/* const parseTxInOutTransaction = (pdfPage, pageIdx, type) => {

  const txStart = findPriorIndex(pdfPage, pageIdx)+1;
  const fxOffset = pdfPage[pageIdx+7] === 'STK' ? 1 : 0;
  return {
    broker: 'commerzbank',
    type: type,
    company: pdfPage.slice(txStart, pageIdx).join(' '),
    wkn: pdfPage[pageIdx+2],
    isin: pdfPage[pageIdx+3].split(' ')[1],
    shares: Math.abs(parseGermanNum(pdfPage[pageIdx+4+fxOffset])),
    date: format(parse(pdfPage[pageIdx+5+fxOffset], 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd'),
    tax: 0,
    fee: 0,
  }
} */

const parseTransactionReport = pdfPages => {
  let actions = [];
  for (const pdfPage of pdfPages) {
    let pageIdx = 0;
    while (pageIdx <= pdfPage.length) {
      let activity = undefined;
      if (pdfPage[pageIdx] === 'Kauf') {
        activity = parseBuySellTransaction(pdfPage, pageIdx, 'Buy');
        pageIdx += 6; // A transaction string is followed by 6 least related entries
      } else if (pdfPage[pageIdx] === 'Verkauf') {
        activity = parseBuySellTransaction(pdfPage, pageIdx, 'Sell');
        pageIdx += 6;
      } else if (pdfPage[pageIdx] === 'Ausschüttung') {
        activity = parseDividendTransaction(pdfPage, pageIdx, 'Dividend');
        pageIdx += 6;
      } else if (pdfPage[pageIdx] === 'Einbuchung') {
        // activity = parseTxInOutTransaction(pdfPage, pageIdx, 'TransferIn');
        pageIdx += 6;
      } else if (pdfPage[pageIdx] === 'Ausbuchung') {
        // activity = parseTxInOutTransaction(pdfPage, pageIdx, 'TransferOut');
        pageIdx += 6;
      }
      pageIdx++;
      if (activity !== undefined) {
        actions.push(validateActivity(activity));
      }
    }
  }
  return actions;
};

//===========================
// BLOCK 3
// GENERAL PARSING FUNCTIONS
//===========================
export const canParsePage = (content, extension) => {
  // The first PDF Page does not always contain "Commerzbank", thus this ugly
  // workaround. e. G. dividend_IE00B3RBWM25_1.json
  if (!Array.isArray(content)) {
    return undefined;
  }

  const joinedContent = content.join('');
  return (
    extension === 'pdf' &&
    (((joinedContent.toLowerCase().includes('commerzbank') ||
      joinedContent.includes(
        'SteuerlicheBehandlung:AusländischeInvestment-Ausschüttung'
      )) &&
      !(
        // Don't match the sub brands of commerzbank which we implemented with custom logic
        (
          joinedContent.toLowerCase().includes('comdirect') ||
          joinedContent.toLowerCase().includes('onvista')
        )
      ) &&
      (isBuy(content) || isDividend(content))) ||
      isTransactionReport(content))
  );
};

export const parsePages = contents => {
  // Transaction Reports need to be handled completely different from individual
  // transaction documents
  let activities;
  if (isTransactionReport(contents[0])) {
    activities = parseTransactionReport(contents);
  } else {
    activities = [parseSingleTransaction(contents[0])];
  }
  return {
    activities,
    status: 0,
  };
};
