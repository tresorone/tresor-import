import Big from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
  findFirstRegexIndexInArray,
  findFirstIsinIndexInArray,
} from '@/helper';

const findISIN = text => {
  if (text.some(t => t.includes('ISIN:'))) {
    // Newer PDFs from traderepublic do contain an explicit "ISIN" string
    const isinLine = text[text.findIndex(t => t.includes('ISIN:'))];
    return isinLine.substr(isinLine.length - 12);
  } else {
    // Older PDFs from traderepublic do not contain an explicit "ISIN" string, here we look up the
    // ISIN value by referencing it from the "shares" index.
    return text[text.findIndex(t => t.includes('Stk.')) - 1];
  }
};

const findCompany = text => {
  let companyIdx = text.indexOf('Reinvestierung');
  if (companyIdx < 0) {
    companyIdx = text.indexOf('Umtausch/Bezug');
  }
  if (companyIdx < 0) {
    companyIdx = text.indexOf('BETRAG');
  }
  return text[companyIdx + 1];
};

const findDateSingleBuy = content => {
  // Extract the date from a string like this: "Market-Order Kauf am 04.02.2020, um 14:02 Uhr an der Lang & Schwarz Exchange."
  const searchTerm = 'Kauf am ';
  const dateIdx = content.findIndex(t => t.includes(searchTerm));
  if (dateIdx >= 0) {
    const dateLine = content[dateIdx];
    return dateLine.split(searchTerm)[1].trim().substr(0, 10);
  }

  // For some special buys as part of capital increases there is no dateline
  return content[content.indexOf('VALUTA') + 3];
};

const findOrderTime = content => {
  // Extract the time from a string like this: "Market-Order Kauf am 04.02.2020, um 14:02 Uhr an der Lang & Schwarz Exchange."
  const searchTerm = ', um ';
  const lineNumber = content.findIndex(t => t.includes(searchTerm));

  if (lineNumber < 0) {
    return undefined;
  }

  return content[lineNumber].split(searchTerm)[1].trim().substr(0, 5);
};

const findDateBuySavingsPlan = textArr => {
  // Extract the date from a string like this: "Sparplanausführung am 16.01.2020 an der Lang & Schwarz Exchange."
  const searchTerm = 'Sparplanausführung am ';
  const dateLine = textArr[textArr.findIndex(t => t.includes(searchTerm))];
  return dateLine.split(searchTerm)[1].trim().substr(0, 10);
};

const findDateSell = textArr => {
  // Extract the date from a string like this: "Market-Order Verkauf am 04.02.2020, um 14:02 Uhr an der Lang & Schwarz Exchange."
  const searchTerm = 'Verkauf am ';
  const dateLine = textArr[textArr.findIndex(t => t.includes(searchTerm))];
  return dateLine.split(searchTerm)[1].trim().substr(0, 10);
};

const findDateDividend = textArr => {
  const searchTerm = 'VALUTA';
  return textArr[textArr.indexOf(searchTerm) + 3];
};

const findShares = textArr => {
  const searchTerm = ' Stk.';
  const sharesLine = textArr[textArr.findIndex(t => t.includes(searchTerm))];
  const shares = sharesLine.split(searchTerm)[0];
  return parseGermanNum(shares);
};

const findAmount = (textArr, fxRate) => {
  let amountIdx = textArr.indexOf('Bruttoertrag');
  if (amountIdx < 0) {
    amountIdx = textArr.indexOf('Kurswert');
  }
  if (amountIdx < 0) {
    amountIdx = textArr.indexOf('GESAMT');
  }
  const totalAmountLine = textArr[amountIdx + 1];
  const amount = parseGermanNum(totalAmountLine.split(' ')[0].trim());
  return fxRate !== undefined
    ? +Big(amount).div(fxRate).abs()
    : Math.abs(amount);
};

const findForeignInformation = textArr => {
  // Look for a line with the format 1,234 EUR/USD
  const foreignIdx = textArr.findIndex(line =>
    /[0-9]+(,[0-9]+)?\s[A-Z]{3}\/[A-Z]{3}/.test(line)
  );
  if (foreignIdx >= 0) {
    const foreignInfo = textArr[foreignIdx].split(/\s+/);
    return [parseGermanNum(foreignInfo[0]), foreignInfo[1].split('/')[1]];
  }
  return [undefined, undefined];
};

const findFee = (textArr, fxRate) => {
  let totalFee = Big(0);
  if (textArr.indexOf('Fremde Spesen') > -1) {
    const feeLine = textArr[textArr.indexOf('Fremde Spesen') + 1];
    const feeNumberString = feeLine.split(/\s+/)[0];
    totalFee = totalFee.minus(Big(parseGermanNum(feeNumberString)).div(fxRate));
  }
  if (textArr.indexOf('Fremdkostenzuschlag') > -1) {
    const feeLine = textArr[textArr.indexOf('Fremdkostenzuschlag') + 1];
    const feeNumberString = feeLine.split(/\s+/)[0];
    totalFee = totalFee.minus(parseGermanNum(feeNumberString));
  }
  if (textArr.indexOf('Gebühr Kundenweisung') > -1) {
    const feeLine = textArr[textArr.indexOf('Gebühr Kundenweisung') + 1];
    const feeNumberString = feeLine.split(/\s+/)[0];
    totalFee = totalFee.minus(parseGermanNum(feeNumberString));
  }

  return +totalFee;
};

const findTax = (textArr, fxRate) => {
  let totalTax = Big(0);
  const transactionTaxIdx = textArr.findIndex(line =>
    line.includes('Finanztransaktionssteuer')
  );
  if (transactionTaxIdx >= 0) {
    const transactionTax = parseGermanNum(
      textArr[transactionTaxIdx + 1].split(/\s+/)[0]
    );
    totalTax = totalTax.minus(transactionTax);
  }
  const withholdingTaxLine = textArr.findIndex(line =>
    line.startsWith('Quellensteuer')
  );
  if (withholdingTaxLine >= 0) {
    const foreignTax = parseGermanNum(
      textArr[withholdingTaxLine + 1].split(/\s+/)[0]
    );
    if (fxRate !== undefined) {
      totalTax = totalTax.minus(Big(foreignTax).div(fxRate));
    } else {
      totalTax = totalTax.minus(foreignTax);
    }
  }
  const capitalTaxIdx = textArr.findIndex(
    line =>
      line.includes('Kapitalertragssteuer') ||
      line.includes('Kapitalertragsteuer')
  );
  if (capitalTaxIdx >= 0) {
    totalTax = totalTax.minus(
      parseGermanNum(textArr[capitalTaxIdx + 1].split(/\s+/)[0])
    );
  }
  const soliTaxIdx = textArr.findIndex(line =>
    line.includes('Solidaritätszuschlag')
  );
  if (soliTaxIdx >= 0) {
    totalTax = totalTax.minus(
      parseGermanNum(textArr[soliTaxIdx + 1].split(/\s+/)[0])
    );
  }
  const churchTaxIdx = textArr.findIndex(line =>
    line.includes('Kirchensteuer')
  );
  if (churchTaxIdx >= 0) {
    totalTax = totalTax.minus(
      parseGermanNum(textArr[churchTaxIdx + 1].split(/\s+/)[0])
    );
  }
  return +totalTax;
};

const getDocumentType = content => {
  if (
    content.some(
      line =>
        line.includes('KOSTENINFORMATION') ||
        line.includes('SPLIT') ||
        line.includes('AUFTRAGSBESTÄTIGUNG') ||
        line.includes('ÄNDERUNGSBESTÄTIGUNG') ||
        line.includes('SPARPLANAUSFÜHRUNG FEHLGESCHLAGEN') ||
        line.includes('KONTOAUSZUG')
    )
  ) {
    return 'Ignored';
  } else if (
    content.some(
      line =>
        line.includes('DEPOTAUSZUG') || line.includes('JAHRESDEPOTABSTIMMUNG')
    )
  ) {
    return 'DepotStatement';
  } else if (
    content.some(
      line => line.includes('mit dem Ex-Tag') || line.includes('REINVESTIERUNG')
    )
  ) {
    return 'Dividend';
  } else if (
    content.some(
      line =>
        line.includes('Sparplanausführung am') ||
        line.includes('Kauf am') ||
        line === 'UMTAUSCH/BEZUG'
    )
  ) {
    return 'Buy';
  } else if (content.some(line => line.includes('Verkauf am'))) {
    return 'Sell';
  } else if (content.includes('TILGUNG')) {
    return 'callRepayment';
  }
  return undefined;
};

// Functions to parse an overview Statement
const parseDepotStatementEntry = (content, startLineNumber) => {
  const isinIdx = findFirstRegexIndexInArray(
    content,
    /ISIN: .+/,
    startLineNumber
  );
  const dateIdx = findFirstRegexIndexInArray(
    content,
    /^\d{2}\.\d{2}\.\d{4}$/,
    isinIdx
  );
  // Edge-case: On a pages change, the total amount are located under the company name.
  const amountIdx =
    isinIdx - startLineNumber > 5 ? startLineNumber + 3 : dateIdx + 1;
  let sharesLine;
  if (content[startLineNumber].includes(' ')) {
    // Normaly the number of shares are listed in a line with Stk.:
    // 1000 Stk.
    sharesLine = content[startLineNumber].split(' ')[0];
  } else {
    // But sometimes before:
    // 61.1149
    // Stk.
    sharesLine = content[startLineNumber - 1];
  }

  if (!sharesLine.includes(',') && sharesLine.includes('.')) {
    // In the Q4 2020 document the number format has changed (once?) from the german one to the english one.
    // We simply replace the dot with a comma.
    sharesLine = sharesLine.replace('.', ',');
  }

  let activity = {
    broker: 'traderepublic',
    type: 'TransferIn',
    isin: content[isinIdx].split(' ')[1],
    company: content[startLineNumber + 1],
    shares: parseGermanNum(sharesLine),
    amount: parseGermanNum(content[amountIdx]),
    fee: 0,
    tax: 0,
  };

  [activity.date, activity.datetime] = createActivityDateTime(
    content[dateIdx],
    undefined
  );

  // We need to calculate the buy-price per share because in the overview is only the current price per share available.
  activity.price = +Big(activity.amount).div(Big(activity.shares));
  return validateActivity(activity);
};

const parseOverviewStatement = content => {
  const foundActivities = [];

  for (let lineNumber = 0; lineNumber < content.length; lineNumber++) {
    if (!content[lineNumber].includes('Stk.')) {
      continue;
    }

    foundActivities.push(parseDepotStatementEntry(content, lineNumber));
  }

  return foundActivities;
};

// Individual transaction file
const parseBuySellDividend = (textArr, docType) => {
  const [fxRate, foreignCurrency] = findForeignInformation(textArr);
  let activity = {
    broker: 'traderepublic',
    type: docType,
    isin: findISIN(textArr),
    company: findCompany(textArr),
    shares: findShares(textArr),
    tax: findTax(textArr, fxRate),
    fee: findFee(textArr, fxRate),
  };

  if (fxRate !== undefined && foreignCurrency !== undefined) {
    activity.fxRate = fxRate;
    activity.foreignCurrency = foreignCurrency;
  }

  if (activity.type === 'Buy') {
    const date = textArr.some(line => line.includes('Sparplanausführung am'))
      ? findDateBuySavingsPlan(textArr)
      : findDateSingleBuy(textArr);
    [activity.date, activity.datetime] = createActivityDateTime(
      date,
      findOrderTime(textArr)
    );
    activity.amount = findAmount(textArr, fxRate);
  } else if (activity.type === 'Sell') {
    [activity.date, activity.datetime] = createActivityDateTime(
      findDateSell(textArr),
      findOrderTime(textArr)
    );
    activity.amount = +findAmount(textArr);
  } else if (activity.type === 'Dividend') {
    const dateFormat = findDateDividend(textArr).includes('-')
      ? 'yyyy-MM-dd'
      : 'dd.MM.yyyy';
    [activity.date, activity.datetime] = createActivityDateTime(
      findDateDividend(textArr),
      findOrderTime(textArr),
      dateFormat
    );
    activity.amount = +Big(findAmount(textArr, fxRate));
  }
  activity.price = +Big(activity.amount).div(activity.shares);
  return validateActivity(activity);
};

const parseOption = content => {
  const activityIdx = content.indexOf('Tilgung');
  const isinIdx = findFirstIsinIndexInArray(content);
  const amountIdx = content.indexOf('Kurswert') + 1;
  let activity = {
    broker: 'traderepublic',
    type: 'Sell',
    company: content.slice(activityIdx + 1, isinIdx).join(' '),
    isin: content[isinIdx],
    shares: parseGermanNum(content[isinIdx + 1].split(/\s+/)[0]),
    amount: parseGermanNum(content[amountIdx]),
    tax: findTax(content),
    fee: 0,
  };
  activity.price = +Big(activity.amount).div(activity.shares);
  [activity.date, activity.datetime] = createActivityDateTime(
    content[content.indexOf('VALUTA') + 3],
    undefined
  );
  return validateActivity(activity);
};

// FUnctions to be exported
export const canParseDocument = (pages, extension) => {
  const firstPageContent = pages[0];
  return (
    extension === 'pdf' &&
    firstPageContent.includes('TRADE REPUBLIC BANK GMBH') &&
    getDocumentType(firstPageContent) !== undefined
  );
};

export const parsePages = contents => {
  let activities = [];
  const allPagesFlat = contents.flat();
  const docType = getDocumentType(allPagesFlat);
  if (docType === 'Ignored') {
    // We know this type and we don't want to support it.
    return {
      activities,
      status: 7,
    };
  }

  if (docType === 'DepotStatement') {
    parseOverviewStatement(allPagesFlat).forEach(activity => {
      activities.push(activity);
    });
  } else if (docType === 'callRepayment') {
    activities.push(parseOption(allPagesFlat));
  } else {
    for (let content of contents) {
      activities.push(parseBuySellDividend(content, docType));
    }
  }
  return {
    activities,
    status: 0,
  };
};
