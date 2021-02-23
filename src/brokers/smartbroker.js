import { Big } from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
} from '@/helper';
import * as onvista from './onvista';

const findTax = (textArr, fxRate) => {
  let completeTax = Big(0);
  const isTaxReturn = textArr.includes('Steuerausgleich nach § 43a EStG:');

  const capitalTaxIndex = textArr.findIndex(t =>
    t.includes('Kapitalertragsteuer')
  );
  if (capitalTaxIndex > 0) {
    completeTax = completeTax.plus(
      parseGermanNum(textArr[capitalTaxIndex + 2])
    );
  }

  const solidarityTaxIndex = textArr.findIndex(t =>
    t.includes('Solidaritätszuschlag')
  );
  if (solidarityTaxIndex > 0) {
    completeTax = completeTax.plus(
      parseGermanNum(textArr[solidarityTaxIndex + 2])
    );
  }

  const churchTaxIndex = textArr.findIndex(
    line =>
      line.includes('Kirchensteuer') && !line.includes('Kapitalertragsteuer')
  );
  if (churchTaxIndex > 0) {
    completeTax = completeTax.plus(parseGermanNum(textArr[churchTaxIndex + 2]));
  }

  if (isTaxReturn) {
    completeTax = completeTax.times(-1);
  }

  const witholdingTaxIndex = textArr.findIndex(
    line =>
      line.includes('-Quellensteuer') ||
      line.includes('ausländische Quellensteuer')
  );

  if (witholdingTaxIndex > 0) {
    const taxLine = textArr[witholdingTaxIndex + 2];
    let amount = Big(parseGermanNum(taxLine));
    if (fxRate !== undefined) {
      amount = amount.div(fxRate);
    }

    completeTax = completeTax.plus(amount);
  }

  return +completeTax;
};

const findFxRateAndForeignCurrency = content => {
  const fxRateLineNumber = content.findIndex(line =>
    line.includes('Devisenkurs')
  );

  if (fxRateLineNumber <= 0) {
    return [undefined, undefined];
  }

  const regex = /[A-Z]\/([A-Z]{3}) ([0-9,]+)/;
  const lineContent = content[fxRateLineNumber];

  let regexMatch;
  if (!lineContent.includes(' ')) {
    // Handle format no. 1:
    // Devisenkurs
    // EUR/USD 1,1821
    regexMatch = regex.exec(content[fxRateLineNumber + 1]);
  } else {
    // Handle fromat no. 2:
    // Devisenkurs: EUR/USD 1,1906
    regexMatch = regex.exec(lineContent);
  }

  if (regexMatch === null) {
    return [undefined, undefined];
  }

  return [parseGermanNum(regexMatch[2]), regexMatch[1]];
};

const findPriceDividend = content => {
  let priceIdx = content.indexOf('Dividenden-Betrag pro Stück');
  if (priceIdx < 0) {
    priceIdx = content.indexOf('Ausschüttungsbetrag pro Stück');
  }
  if (priceIdx >= 0) {
    return parseGermanNum(content[priceIdx + 1].split(/\s+/)[1]);
  }
};

const findOrderTime = content => {
  // Extract the time after the line with Handelszeit which contains "17:33*"
  const searchTerm = 'Handelszeit';
  const lineNumber = content.findIndex(t => t.includes(searchTerm));

  if (lineNumber < 0) {
    return undefined;
  }

  return content[lineNumber + 1].trim().substr(0, 5);
};

const getDocumentType = content => {
  if (onvista.isBuy(content)) {
    return 'Buy';
  } else if (onvista.isSell(content)) {
    return 'Sell';
  } else if (onvista.isDividend(content)) {
    return 'Dividend';
  } else if (content.includes('Einlösung zu:')) {
    return 'TurboKO';
  } else if (
    content.includes('Umtausch/Bezug') ||
    content.includes('Wir haben für Sie folgende Anschaffungsdaten')
  ) {
    return 'TransferIn';
  } else if (
    content.includes('Vermˆgensbericht') ||
    content.includes('Kostendarstellung')
  ) {
    return 'Ignored';
  }
};

export const canParseDocument = (pages, extension) => {
  const firstPageContent = pages[0];
  return (
    extension === 'pdf' &&
    firstPageContent.some(
      line =>
        line.includes(onvista.smartbrokerIdentificationStrings[0]) ||
        line.includes(onvista.smartbrokerIdentificationStrings[1])
    ) &&
    getDocumentType(firstPageContent) !== undefined
  );
};

const parseBuySellDividend = (pdfPages, type) => {
  const textArr = pdfPages.flat();
  let activity = {
    broker: 'smartbroker',
    type,
    shares: onvista.findShares(textArr),
    isin: onvista.findISIN(textArr),
    company: onvista.findCompany(textArr),
    tax: 0,
    fee: 0,
  };
  const [fxRate, foreignCurrency] = findFxRateAndForeignCurrency(textArr);
  let date, time;

  if (activity.type === 'Buy') {
    activity.amount = onvista.findAmount(textArr);
    activity.price = onvista.findPrice(textArr);
    activity.fee = onvista.findFee(textArr);
    date = onvista.findDateBuySell(textArr);
    time = findOrderTime(textArr);
  } else if (activity.type === 'Sell') {
    activity.amount = onvista.findAmount(textArr);
    activity.price = onvista.findPrice(textArr);
    activity.tax = findTax(textArr, fxRate);
    activity.fee = onvista.findFee(textArr);
    date = onvista.findDateBuySell(textArr);
    time = findOrderTime(textArr);
  } else if (activity.type === 'Dividend') {
    activity.tax = findTax(textArr, fxRate);
    activity.price =
      fxRate === undefined
        ? findPriceDividend(textArr)
        : +Big(findPriceDividend(textArr)).div(fxRate);
    activity.amount = +Big(activity.price).times(activity.shares);

    date = onvista.findDateDividend(textArr);
  }
  [activity.date, activity.datetime] = createActivityDateTime(date, time);

  if (fxRate !== undefined) {
    activity.fxRate = fxRate;
  }

  if (foreignCurrency !== undefined) {
    activity.foreignCurrency = foreignCurrency;
  }
  return [validateActivity(activity)];
};

const parseTurboKO = pdfPages => {
  const companyStartIdx = pdfPages.indexOf('Gattungsbezeichnung') + 1;
  const companyEndIdx = pdfPages.indexOf('Fälligkeit');
  let activity = {
    broker: 'smartbroker',
    type: 'Sell',
    shares: onvista.findShares(pdfPages),
    isin: onvista.findISIN(pdfPages),
    company: pdfPages.slice(companyStartIdx, companyEndIdx).join(' '),
    amount: onvista.findAmount(pdfPages),
    tax: findTax(pdfPages),
    fee: 0,
  };
  activity.price = parseGermanNum(
    pdfPages[pdfPages.indexOf('Einlösung zu:') + 1].split(/\s+/)[1]
  );
  [activity.date, activity.datetime] = createActivityDateTime(
    pdfPages[pdfPages.indexOf('Wert') + 1]
  );
  return [validateActivity(activity)];
};

const parseTransferIn = pdfPages => {
  const isRevision = pdfPages.includes('Anpassung Anschaffungsdaten');
  let activity = {
    broker: 'smartbroker',
    type: 'TransferIn',
    shares: onvista.findShares(pdfPages),
    isin: onvista.findISIN(pdfPages),
    company: pdfPages[pdfPages.indexOf('Gattungsbezeichnung') + 1],
    amount: onvista.findAmount(pdfPages),
    price: onvista.findPrice(pdfPages),
    tax: 0,
    fee: onvista.findFee(pdfPages),
  };

  if (isRevision) {
    activity.amount = parseGermanNum(
      pdfPages[pdfPages.indexOf('Anschaffungswert') + 4]
    );
    activity.fee = parseGermanNum(
      pdfPages[pdfPages.indexOf('Anschaffungsnebenkosten') + 4]
    );
    activity.price = +Big(activity.amount).div(activity.shares);
  }
  const dateIdx = isRevision
    ? pdfPages.indexOf('Anschaffungsdatum') + 3
    : pdfPages.indexOf('Wert') + 1;
  [activity.date, activity.datetime] = createActivityDateTime(
    pdfPages[dateIdx]
  );
  return [validateActivity(activity)];
};

export const parsePages = pdfPages => {
  const type = getDocumentType(pdfPages[0]);
  switch (type) {
    case 'Ignored':
      return {
        activities: undefined,
        status: 7,
      };
    case 'Buy':
    case 'Sell':
    case 'Dividend':
      return {
        activities: parseBuySellDividend(pdfPages, type),
        status: 0,
      };
    case 'TurboKO':
      return {
        activities: parseTurboKO(pdfPages.flat()),
        status: 0,
      };
    case 'TransferIn':
      return {
        activities: parseTransferIn(pdfPages.flat()),
        status: 0,
      };
    default:
      return {
        activities: undefined,
        status: 5,
      };
  }
};
