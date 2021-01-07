import Big from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
  timeRegex,
} from '@/helper';

// Both smartbroker and onvista use highly similar parsers due to them both being
// daughter companies from BNP Paribas; a french bank. There is no string which
// uniquely identifies onvista files so we have to construct a multistring
// identifcation scheme.
export const onvistaIdentificationString = 'BELEGDRUCK=J';
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
  return date;
};

export const findDateDividend = text =>
  text[text.findIndex(t => t.includes('Zahltag')) + 1];

const findOrderTime = content => {
  // Extract the time after the line with Handelszeit which contains "17:33"
  const searchTerm = 'Handelszeit';
  const lineNumber = content.findIndex(t => t.includes(searchTerm));

  if (lineNumber < 0) {
    return undefined;
  }

  const lineContentFormatNew = content[lineNumber + 1].trim();
  if (timeRegex(false).test(lineContentFormatNew)) {
    return lineContentFormatNew;
  }

  const lineContentFormatOld = content[lineNumber - 1].trim();
  if (timeRegex(false).test(lineContentFormatOld)) {
    return lineContentFormatOld;
  }

  return undefined;
};

export const findShares = textArr => {
  const sharesLine = textArr[textArr.findIndex(t => t.includes('STK'))];
  return parseGermanNum(sharesLine.split(' ')[1]);
};

export const findPrice = (text, fxRate = undefined) => {
  const priceLine = text[text.findIndex(t => t.includes('Kurs')) + 1];
  const price = parseGermanNum(priceLine.split(' ')[1]);

  return fxRate === undefined ? price : +Big(price).div(fxRate);
};

export const findAmount = (text, fxRate = undefined) => {
  let amount = parseGermanNum(
    text[text.findIndex(t => t.includes('Kurswert')) + 2]
  );
  return fxRate === undefined ? amount : +Big(amount).div(fxRate);
};

export const findFee = (content, fxRate = undefined) => {
  let fee = Big(0);
  const stockFeeIdx = content.indexOf('Börsengebühr') + 2;
  if (stockFeeIdx > 1) {
    fee = fee.plus(parseGermanNum(content[stockFeeIdx]));
  }
  const foreignFeeIdx = content.indexOf('Fremdspesen') + 2;
  if (foreignFeeIdx > 1) {
    fee = fee.plus(parseGermanNum(content[foreignFeeIdx]));
  }
  const exchangeFeeIdx = content.indexOf('Handelsplatzgebühr') + 2;
  if (exchangeFeeIdx > 1) {
    fee = fee.plus(parseGermanNum(content[exchangeFeeIdx]));
  }
  const orderProvisionIdx = content.indexOf('Orderprovision') + 2;
  if (orderProvisionIdx > 1) {
    fee = fee.plus(Big(parseGermanNum(content[orderProvisionIdx])));
  }
  return fxRate === undefined ? +fee : +fee.div(fxRate);
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

const findGrossPayout = (text, tax) => {
  const netPayout =
    text[text.findIndex(t => t.includes('Betrag zu Ihren Gunsten')) + 2];
  return +Big(parseGermanNum(netPayout)).plus(tax);
};

export const canParseDocument = (pages, extension) => {
  const firstPageContent = pages[0];
  return (
    extension === 'pdf' &&
    ((firstPageContent.some(line =>
      line.includes(onvistaIdentificationString)
    ) &&
      !firstPageContent.some(line =>
        line.includes(smartbrokerIdentificationString)
      )) ||
      (firstPageContent.some(line =>
        line.includes('Webtrading onvista bank')
      ) &&
        detectedButIgnoredDocument(firstPageContent)))
  );
};

export const isBuy = content =>
  content.some(line => line.includes('Wir haben für Sie gekauft'));

export const isSell = content =>
  content.some(line => line.includes('Wir haben für Sie verkauft'));

export const isDividend = content =>
  content.some(line => line.includes('Erträgnisgutschrift')) ||
  content.some(line => line.includes('Dividendengutschrift'));

const canParsePage = content =>
  isBuy(content) || isSell(content) || isDividend(content);

const detectedButIgnoredDocument = content => {
  return (
    // When the document contains one of the following lines, we want to ignore these document.
    content.some(line => line.includes('Kostenausweis'))
  );
};

const parseData = text => {
  let activity = {
    broker: 'onvista',
    isin: findISIN(text),
    company: findCompany(text),
    shares: findShares(text),
  };

  const foreignCurrencyIdx = text.indexOf('Devisenkurs') + 1;
  if (foreignCurrencyIdx > 0) {
    activity.fxRate = parseGermanNum(text[foreignCurrencyIdx].split(/\s+/)[1]);
    activity.foreignCurrency = text[foreignCurrencyIdx]
      .split(/\s+/)[0]
      .split(/\//)[1];
  }

  if (isBuy(text)) {
    activity.type = 'Buy';
    [activity.date, activity.datetime] = createActivityDateTime(
      findDateBuySell(text),
      findOrderTime(text)
    );
    activity.amount = findAmount(text, activity.fxRate);
    activity.fee = findFee(text, activity.fxRate);
    activity.tax = 0.0;
    activity.price = findPrice(text, activity.fxRate);
  } else if (isSell(text)) {
    activity.type = 'Sell';
    [activity.date, activity.datetime] = createActivityDateTime(
      findDateBuySell(text),
      findOrderTime(text)
    );
    activity.amount = findAmount(text, activity.fxRate);
    activity.fee = findFee(text, activity.fxRate);
    activity.tax = findTax(text);
    activity.price = findPrice(text, activity.fxRate);
  } else if (isDividend(text)) {
    activity.type = 'Dividend';
    [activity.date, activity.datetime] = createActivityDateTime(
      findDateDividend(text),
      undefined
    );
    activity.fee = 0;
    activity.tax = findTax(text);
    activity.amount = findGrossPayout(text, activity.tax);
    activity.price = +Big(activity.amount).div(activity.shares);
  }
  return validateActivity(activity);
};

export const parsePages = contents => {
  let activities = [];

  if (detectedButIgnoredDocument(contents[0])) {
    // We know this type and we don't want to support it.
    return {
      activities,
      status: 7,
    };
  }

  for (let content of contents) {
    if (canParsePage(content)) {
      activities.push(parseData(content));
    }
  }

  return {
    activities,
    status: 0,
  };
};
