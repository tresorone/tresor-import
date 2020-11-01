import format from 'date-fns/format';
import parse from 'date-fns/parse';
import Big from 'big.js';

import { parseGermanNum, validateActivity } from '@/helper';

const stringAtIndexOf = (pageArray, indexOf, inLineIndex, lineOffset = 0) => {
  const lineIndex = pageArray.indexOf(indexOf) + lineOffset;
  if (lineIndex >= 0) {
    return pageArray[lineIndex].split(/\s+/)[inLineIndex];
  }
};

const findForeignCurrencyFxRate = pageArray => {
  const foreignIndex = pageArray.findIndex(line =>
    line.includes('umgerechneter FW - Endwert')
  );
  let foreignCurrency, fxRate;
  if (foreignIndex > 0) {
    const foreignIndexLine = pageArray[foreignIndex - 1].split(' ');
    fxRate = parseGermanNum(foreignIndexLine[2]);
    foreignCurrency = foreignIndexLine[0].split('-')[0];
  }
  return [fxRate, foreignCurrency];
};

const isForeignCurrencyTransaction = pageArray =>
  pageArray.some(line => line.includes('umgerechneter FW - Endwert'));

const findIsinBuy = pageArray => {
  const isinIndex =
    pageArray.findIndex(line => line.includes('Ihr Auftrag vom')) + 1;
  return pageArray[isinIndex].split(/\s/)[0];
};

const findCompany = pageArray => {
  const companyIndex =
    pageArray.findIndex(line => line.includes('Ihr Auftrag vom')) + 1;
  if (companyIndex >= 0) {
    return pageArray[companyIndex].split(/(\s+)/).slice(2).join('');
  }
};

const findCompanyDividend = pageArray => {
  const companyIndex = pageArray.indexOf('Ausschüttung') + 1;
  if (companyIndex >= 0) {
    return pageArray[companyIndex].split(/(\s+)/).slice(2).join('');
  }
};

const findDateBuy = pageArray => {
  const dateIndex =
    pageArray.findIndex(line => line.includes('Verrechnungskonto')) - 1;
  const date = pageArray[dateIndex].split(/(\s+)/)[6];
  return format(parse(date, 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd');
};

const findDateDividend = pageArray => {
  const dateIndex = pageArray.findIndex(line => line.includes('mit Valuta'));
  const date = pageArray[dateIndex].split(/(\s+)/)[22];
  return format(parse(date, 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd');
};

const findAmountBuy = (pageArray, legacyDocument = false) => {
  // Two occurrences of Kurswert are expected; we are interested in the first
  let amountLineIndex =
    pageArray.findIndex(line => line.includes('Kurswert')) + 1;
  // If the amount is in a foreign currency, the EUR amount will be 2 lines later
  if (isForeignCurrencyTransaction(pageArray)) {
    amountLineIndex += 2;
  }
  // In older Documents the position of the amount is slightly different
  const amountInLinePosition = legacyDocument ? 6 : 4;
  const amount = pageArray[amountLineIndex].split(/\s+/)[amountInLinePosition];
  return parseGermanNum(amount);
};

const findAmountDividend = pageArray => {
  let amountLineIndex = pageArray.findIndex(line =>
    line.includes('Brutto EUR')
  );
  return parseGermanNum(pageArray[amountLineIndex].split(/\s+/)[2]);
};

const findSharesBuy = pageArray => {
  const sharesLineIndex =
    pageArray.findIndex(line => line.includes('ckzahl')) + 1;
  const sharesLineArray = pageArray[sharesLineIndex].split(/\s+/);
  return parseGermanNum(sharesLineArray[1]);
};

const findSharesDividend = pageArray => {
  const sharesLineIndex = pageArray.findIndex(line =>
    line.includes('Menge/Währung:')
  );
  if (sharesLineIndex >= 0) {
    return parseGermanNum(pageArray[sharesLineIndex].split(/\s+/)[1]);
  }
};

const findFee = (pageArray, legacyDocument = false) => {
  // For foreign buy the fees are located somewhere else
  let completeFee = Big(0);
  // Legacy Documents list the fees differently and list the initial charge
  if (legacyDocument) {
    // Add the Ausgabeaufschlag
    const initialChargeLine = pageArray.findIndex(line =>
      line.includes('In der Abrechnung ist in Summe ein Ausgabeaufschlag')
    );
    if (initialChargeLine >= 0) {
      completeFee = completeFee.plus(
        parseGermanNum(pageArray[initialChargeLine].split(/\s+/)[10])
      );
    }
    // Add the bonification
    const bonificationLine = pageArray.findIndex(line =>
      line.includes('Bonifikation')
    );
    if (bonificationLine >= 0) {
      completeFee = completeFee.plus(
        parseGermanNum(pageArray[bonificationLine].split(/\s+/)[3])
      );
    }
  } else {
    const feeIndex = pageArray.indexOf('Summe Kosten und Geb');
    // if the transaction is in EUR
    if (feeIndex > 0) {
      return parseGermanNum(pageArray[feeIndex + 2].split(/\s+/)[1]);
    }
    // if the transaction is in another currency
    else {
      const sharesLineIndex = pageArray.findIndex(line =>
        line.includes('Gesamtkosten und -gebühren')
      );
      if (sharesLineIndex >= 0) {
        completeFee = completeFee.plus(
          parseGermanNum(pageArray[sharesLineIndex].split(/\s+/)[3])
        );
      }
    }
  }
  return completeFee;
};

const findTaxPayout = pageArray => {
  let completeTax = Big(0);
  const kestThreeIndex = pageArray.findIndex(line =>
    line.includes('KESt III pro Stück')
  );
  if (kestThreeIndex >= 0) {
    completeTax = completeTax.plus(
      Big(parseGermanNum(pageArray[kestThreeIndex].split(/\s+/)[6])).abs()
    );
  }
  const kestTwoIndex = pageArray.findIndex(line =>
    line.includes('KESt II pro Stück')
  );
  if (kestTwoIndex >= 0) {
    completeTax = completeTax.plus(
      Big(parseGermanNum(pageArray[kestTwoIndex].split(/\s+/)[6])).abs()
    );
  }
  return completeTax;
};

const isBuy = pageArray => {
  return pageArray.some(line => line.includes('uf Marktplatz vom'));
};

const isDividend = pageArray => pageArray.includes('Ausschüttung');

const isOldBuy = pageArray => {
  return pageArray.some(line => line.includes('Kauf aus Wertpapierliste'));
};

export const canParsePage = (pageArray, extension) => {
  try {
      const isErsteBankFile = pageArray
        .join('')
        .includes('ESTERREICHISCHENSPARKASSEN');
    return (
      extension === 'pdf' &&
      (isBuy(pageArray) || isOldBuy(pageArray) || isDividend(pageArray)) &&
      isErsteBankFile
    );
  }
  catch (TypeError) {
    return false
  }
};

export const parsePages = content => {
  // Flatten every incomming array
  const pdfPagesConcat = [].concat.apply([], content);
  const broker = 'ersteBank';
  let type, amount, shares, isin, company, date, price, tax, fee;

  if (isBuy(pdfPagesConcat)) {
    type = 'Buy';
    isin = findIsinBuy(pdfPagesConcat);
    company = findCompany(pdfPagesConcat);
    date = findDateBuy(pdfPagesConcat);
    amount = findAmountBuy(pdfPagesConcat);
    shares = findSharesBuy(pdfPagesConcat);
    price = +Big(amount).div(shares);
    tax = 0;
    fee = +findFee(pdfPagesConcat);
  } else if (isOldBuy(pdfPagesConcat)) {
    type = 'Buy';
    isin = findIsinBuy(pdfPagesConcat);
    company = findCompany(pdfPagesConcat);
    date = findDateBuy(pdfPagesConcat);
    fee = +findFee(pdfPagesConcat, true);
    amount = +Big(findAmountBuy(pdfPagesConcat, true)).minus(fee);
    shares = findSharesBuy(pdfPagesConcat);
    price = +Big(amount).div(shares);
    tax = 0;
  } else if (isDividend(pdfPagesConcat)) {
    type = 'Dividend';
    isin = stringAtIndexOf(pdfPagesConcat, 'Ausschüttung', 0, 2);
    company = findCompanyDividend(pdfPagesConcat);
    date = findDateDividend(pdfPagesConcat);
    amount = findAmountDividend(pdfPagesConcat);
    shares = findSharesDividend(pdfPagesConcat);
    price = +Big(amount).div(shares);
    fee = 0;
    tax = +findTaxPayout(pdfPagesConcat);
  }

  let activity;
  const foreignInformation = findForeignCurrencyFxRate(pdfPagesConcat);
  activity = {
    broker: broker,
    type: type,
    isin: isin,
    company: company,
    date: date,
    amount: amount,
    shares: shares,
    price: price,
    tax: tax,
    fee: fee,
  };

  if (foreignInformation[0] !== undefined) {
    activity.fxRate = foreignInformation[0];
  }
  if (foreignInformation[1] !== undefined) {
    activity.foreignCurrency = foreignInformation[1];
  }

  const activities = [validateActivity(activity)];

  return {
    //Has to be an array
    activities,
    status: 0,
  };
};
