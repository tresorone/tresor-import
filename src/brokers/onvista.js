import format from 'date-fns/format';
import parse from 'date-fns/parse';
import Big from 'big.js';

import { parseGermanNum, validateActivity } from '@/helper';

// Both smartbroker and onvista use highly similar parsers due to them both being
// daughter companies from BNP Paribas; a french bank. There is no string which
// uniquely identifies onvista files so we have to construct a multistring
// identifcation scheme.
const onvistaIdentificationString = 'BELEGDRUCK=J';
export const smartbrokerIdentificationString = 'Landsberger Straße 300';

export const findISIN = text =>
  text[text.findIndex(t => t.includes('ISIN')) + 1];

export const findCompany = text => {
  let company = text[text.findIndex(t => t.includes('ISIN')) - 1];
  if (company === 'Gattungsbezeichnung') {
    company = text[text.findIndex(t => t.includes('ISIN')) - 2];
  }

  return company;
};

export const findDateBuySell = text => {
  const lineNumber = text.findIndex(t => t.includes('Handelstag'));

  let date;
  if (text[lineNumber + 1].split('.').length === 3) {
    date = text[lineNumber + 1];
  } else if (text[lineNumber - 1].split('.').length === 3) {
    date = text[lineNumber - 1];
  } else {
    throw { text: 'Unknown date' };
  }
  return format(parse(date, 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd');
};

export const findDateDividend = text =>
  format(
    parse(
      text[text.findIndex(t => t.includes('Zahltag')) + 1],
      'dd.MM.yyyy',
      new Date()
    ),
    'yyyy-MM-dd'
  );

export const findShares = textArr => {
  const sharesLine = textArr[textArr.findIndex(t => t.includes('STK'))];
  return parseGermanNum(sharesLine.split(' ')[1]);
};

export const findPrice = text => {
  const priceLine = text[text.findIndex(t => t.includes('Kurs')) + 1];
  const price = priceLine.split(' ')[1];
  return parseGermanNum(price);
};

export const findAmount = text => {
  let amount = text[text.findIndex(t => t.includes('Kurswert')) + 2];
  return parseGermanNum(amount);
};

export const findFee = text => {
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
  const sourceTaxIndex = text.findIndex(t => t.includes('davon anrechenbare'));
  if (sourceTaxIndex > -1) {
    totalTax = totalTax.plus(parseGermanNum(text[sourceTaxIndex + 2]));
  }

  return +totalTax;
};

const findPayout = text => {
  const amount =
    text[text.findIndex(t => t.includes('Betrag zu Ihren Gunsten')) + 2];
  return parseGermanNum(amount);
};

export const canParsePage = (content, extension) =>
  extension === 'pdf' &&
  content.some(line => line.includes(onvistaIdentificationString)) &&
  !content.some(line => line.includes(smartbrokerIdentificationString));

export const isBuy = text =>
  text.some(t => t.includes('Wir haben für Sie gekauft'));

export const isSell = text =>
  text.some(t => t.includes('Wir haben für Sie verkauft'));

export const isDividend = text =>
  text.some(t => t.includes('Erträgnisgutschrift')) ||
  text.some(t => t.includes('Dividendengutschrift'));

const parseData = text => {
  let type, date, price, amount, fee, tax;

  const isin = findISIN(text);
  const company = findCompany(text);
  const shares = findShares(text);

  if (isBuy(text)) {
    type = 'Buy';
    date = findDateBuySell(text);
    amount = findAmount(text);
    fee = findFee(text);
    tax = 0.0;
    price = findPrice(text);
  } else if (isSell(text)) {
    type = 'Sell';
    date = findDateBuySell(text);
    amount = findAmount(text);
    fee = findFee(text);
    tax = findTax(text);
    price = findPrice(text);
  } else if (isDividend(text)) {
    type = 'Dividend';
    date = findDateDividend(text);
    fee = 0;
    tax = findTax(text);
    amount = +Big(findPayout(text)).plus(tax);
    price = +Big(amount).div(shares);
  }
  const activity = {
    broker: 'onvista',
    type: type,
    shares: shares,
    date: date,
    isin: isin,
    company: company,
    price: price,
    amount: amount,
    tax: tax,
    fee: fee,
  };
  return validateActivity(activity);
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
