import format from 'date-fns/format';
import parse from 'date-fns/parse';
import Big from 'big.js';

import { parseGermanNum, validateActivity } from '@/helper';

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
  return Big(parseGermanNum(amount));
};

const findFee = text => {
  const totalTradedLineNumber = text.findIndex(t => t.includes('Kurswert')) + 2;
  const totalTraded = parseGermanNum(text[totalTradedLineNumber]);

  let skipLineCounter = 1;
  const amountLineNumber = text.findIndex(t => t.includes('Betrag zu Ihren '));
  const fristTaxLineNumber = text.findIndex(
    t =>
      (t.toLowerCase().includes('steuer') ||
        t.toLowerCase().includes('zuschlag')) &&
      !t.toLowerCase().startsWith('steuer')
  );

  // Search the debited amount which is in a line after `EUR`
  while (!text[amountLineNumber + skipLineCounter].includes('EUR')) {
    skipLineCounter++;
  }

  let totalPrice = Big(
    parseGermanNum(text[amountLineNumber + skipLineCounter + 1])
  );

  if (fristTaxLineNumber < amountLineNumber) {
    // This is an old document. Old documents has an amount with deducted taxes.
    totalPrice = totalPrice.plus(findTax(text));
  }

  return +totalPrice.minus(totalTraded).abs();
};

const findTax = text => {
  let totalTax = Big(0);

  let lastTaxIndex = undefined;
  let taxLineNumber = text.findIndex(t => t.startsWith('einbehaltene '));
  if (taxLineNumber > 0) {
    lastTaxIndex = taxLineNumber;
  } else {
    let taxLineNumber = text.findIndex(t => t.startsWith('einbehaltener '));
    if (taxLineNumber > 0) {
      lastTaxIndex = taxLineNumber;
    }
  }

  const dayOfTradeLineNumber = text.findIndex(t => t.includes('Handelstag'));
  if (lastTaxIndex === undefined && dayOfTradeLineNumber > 0) {
    // This document hasn't any taxes or is an old document.
    // Search the taxes between Kurswert und Handelstag.

    let nameOfPositionLineNumber =
      text.findIndex(t => t.includes('Kurswert')) + 3;
    while (nameOfPositionLineNumber < dayOfTradeLineNumber) {
      let nameOfPosition = text[nameOfPositionLineNumber];

      if (
        nameOfPosition.toLowerCase().includes('steuer') ||
        nameOfPosition.toLowerCase().includes('zuschlag')
      ) {
        totalTax = totalTax.plus(
          Big(parseGermanNum(text[nameOfPositionLineNumber + 2]))
        );
      }

      nameOfPositionLineNumber += 4;
    }

    return +totalTax;
  }

  while (lastTaxIndex !== undefined) {
    const lineParsedAmount = Math.abs(parseGermanNum(text[lastTaxIndex + 2]));
    totalTax = totalTax.plus(Big(lineParsedAmount));
    lastTaxIndex += 3;

    if (
      !text[lastTaxIndex].startsWith('einbehaltene ') &&
      !text[lastTaxIndex].startsWith('einbehaltener ')
    ) {
      break;
    }
  }

  return +totalTax;
};

export const canParsePage = (content, extension) =>
  extension === 'pdf' && content.some(line => line.includes('BELEGDRUCK=J'));

const parseData = text => {
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
    fee = 0;
    tax = findTax(text);
    amount = +findPayout(text).plus(tax);
    shares = findShares(text);
    price = +Big(amount).div(shares);
  }

  isin = findISIN(text);
  company = findCompany(text);

  return validateActivity({
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
  });
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

  return {
    activities,
    status: 0,
  };
};
