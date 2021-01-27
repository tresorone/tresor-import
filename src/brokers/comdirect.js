import Big from 'big.js';
import { onvistaIdentificationString } from './onvista';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
  timeRegex,
} from '@/helper';

const findISINAndWKN = (pdfPage, spanISIN = 0, spanWKN = 0) => {
  // The line contains either WPKNR/ISIN or WKN/ISIN, depending on the document
  const isinIndex = pdfPage.findIndex(
    t => t.includes('/ISIN') || t.includes('/ ISIN')
  );
  // For Taxinfo dividends lots of information are in one row
  if (spanISIN === 0 && spanWKN === 0) {
    const isinWkn = pdfPage[isinIndex].split(/\s+/);
    const shares = parseGermanNum(isinWkn[1]);
    const isin = isinWkn[isinWkn.length - 1];
    const wkn = isinWkn[isinWkn.length - 3];
    const company = isinWkn.splice(2, isinWkn.length - 9).join(' ');
    return [isin, wkn, company, shares];
  }
  const isinLine = pdfPage[isinIndex + spanISIN].split(/\s+/);
  const wknLine = pdfPage[isinIndex + spanWKN].split(/\s+/);
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
  return dateLine.match(/[0-9]{2}.[0-9]{2}.[1-2][0-9]{3}/)[0];
};

const findDateDividend = (textArr, formatId = false) => {
  let date;
  const valutaIdx = textArr.findIndex(t => t.includes('Valuta'));
  if (formatId === 2) {
    date = textArr[valutaIdx].split(/\s+/)[5];
  } else {
    const dateLine = textArr[valutaIdx + 1].split(/\s+/);
    date = dateLine[dateLine.length - 3];
  }
  return date;
};

const findOrderTime = content => {
  // Extract the time from a string like this: "Handelszeit       : 15:30 Uhr (MEZ/MESZ)                  (Kommissionsgeschäft)"
  const searchTerm = 'Handelszeit';
  const lineNumber = content.findIndex(t => t.includes(searchTerm));

  // Some documents have the time on the same line as `Handelszeit`
  if (lineNumber >= 0 && timeRegex(false).test(content[lineNumber])) {
    return (
      content[lineNumber].split(':')[1].trim() +
      ':' +
      content[lineNumber].split(':')[2].trim().substring(0, 2)
    );
  }

  // and some on two lines after `Handelszeit`
  if (lineNumber >= 0 && timeRegex(false).test(content[lineNumber + 2])) {
    return content[lineNumber + 2].split(' ')[0];
  }

  return undefined;
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
  // In some documents the witholding tax is not listed explicitely but instead
  // can be calculated as the difference between 'Steuerbemessungsgrundlage[...]'
  // and the Pre Tax Payout ('Zu Ihren Gunsten')

  let amount, includedWithholdingTax;

  // This is the case for simple dividend files
  const grossAmountIdx = textArr.findIndex(t => t.includes('Bruttobetrag'));
  if (grossAmountIdx >= 0) {
    amount = Big(parseGermanNum(textArr[grossAmountIdx].split(/\s+/)[2]));
    if (fxRate !== undefined) {
      amount = amount.div(fxRate);
    }
    return [+amount, undefined];
  }

  const preTaxAmountIdx = textArr.findIndex(
    t => t === 'Zu Ihren Gunsten vor Steuern:'
  );
  if (preTaxAmountIdx >= 0) {
    amount = Big(parseGermanNum(textArr[preTaxAmountIdx + 1].split(/\s+/)[1]));
  }

  const taxBasePreLossAmountIdx = textArr.findIndex(
    t => t === 'Steuerbemessungsgrundlage vor Verlustverrechnung'
  );
  if (taxBasePreLossAmountIdx >= 0) {
    const taxBasePreLossAmount = Big(
      parseGermanNum(textArr[taxBasePreLossAmountIdx + 1].split(/\s+/)[1])
    );
    includedWithholdingTax = +taxBasePreLossAmount.minus(amount);
  }
  return [+amount, includedWithholdingTax];
};

const findFee = (textArr, amount, isSell = false, formatId = undefined) => {
  let totalFee = Big(0);
  const span = formatId === undefined || formatId === 1 ? 8 : 1;

  const lineNumberGross = textArr.findIndex(t => t.includes('vor Steuern'));
  if (lineNumberGross >= 0) {
    const preTaxLine = textArr[lineNumberGross + span].split(/\s+/);
    const preTaxAmount = parseGermanNum(preTaxLine[preTaxLine.length - 1]);

    totalFee = isSell
      ? Big(amount).minus(preTaxAmount)
      : Big(preTaxAmount).minus(amount);
  }

  {
    // Bonifikation like:
    // 2,49400% Bonifikation                : EUR                1,28-
    const lineNumber = textArr.findIndex(line => line.includes('Bonifikation'));
    if (lineNumber >= 0) {
      totalFee = totalFee.minus(
        parseGermanNum(textArr[lineNumber].split(/\s+/)[4])
      );
    }
  }

  return +totalFee;
};

const findTax = (textArr, fxRate, formatId) => {
  let withholdingTax = 0;
  if (formatId === 0 || formatId === 2) {
    const withholdingTaxIndex = textArr.findIndex(
      line =>
        line.includes(' Quellensteuer') && !line.includes('Bei einbehaltener ')
    );
    if (withholdingTaxIndex > 0) {
      withholdingTax = parseGermanNum(
        textArr[withholdingTaxIndex].split(/\s+/)[4]
      );
      if (fxRate !== undefined && fxRate > 0) {
        withholdingTax = +Big(withholdingTax).div(fxRate);
      }
    }
  }

  // Relevant for Sell Operations and TaxInfo Dividends
  let localTax = 0;
  const payedTaxIndex = textArr.indexOf('abgeführte Steuern');
  if (payedTaxIndex >= 0) {
    let lineWithTaxValue;
    if (formatId === 1) {
      lineWithTaxValue = textArr[payedTaxIndex + 2];
    } else {
      lineWithTaxValue = textArr[payedTaxIndex + 1].split(/\s+/)[1];
    }
    localTax = Math.abs(parseGermanNum(lineWithTaxValue));
  }

  return [+Big(withholdingTax).plus(localTax), withholdingTax];
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
  // There are currently three types of documents:

  if (content.some(line => line.includes('Wertpapier-Bezeichnung '))) {
    // One with: "Wertpapier-Bezeichnung                                               WPKNR/ISIN"
    return 0;
  } else if (content.some(line => line === 'Wertpapier-Bezeichnung')) {
    // One with: "Wertpapier-Bezeichnung"
    return 1;
  } else if (
    content.some(line => line.startsWith('Steuerliche Behandlung: '))
  ) {
    // This is the case for tax information files
    return 2;
  }
  console.error('Unknown Document Type, can not parse');
};

const isBuy = textArr => textArr.some(t => t.includes('Wertpapierkauf'));

const isSell = textArr => textArr.some(t => t.includes('Wertpapierverkauf'));

const isDividend = textArr => {
  return (
    textArr.some(t => t.includes('Ertragsgutschrift')) ||
    textArr.some(t => t.includes('Dividendengutschrift'))
  );
};

const isTaxinfoDividend = textArr => {
  return textArr.some(
    t =>
      t.includes('Steuerliche Behandlung:') &&
      (t.includes('Dividende') || t.includes('Investment-Ausschüttung'))
  );
};

const detectedButIgnoredDocument = content => {
  return (
    // When the document contains one of the following lines, we want to ignore these document.
    content.some(line => line.includes('Kosteninformation'))
  );
};

export const canParseDocument = (pages, extension) => {
  const firstPageContent = pages[0];
  // The defining string used to be 'comdirect bank'. However, this string is
  // not present in every document; 'comdirect' is.
  return (
    extension === 'pdf' &&
    firstPageContent.some(line => line.includes('comdirect')) &&
    firstPageContent.every(
      line => !line.includes(onvistaIdentificationString)
    ) &&
    (isBuy(firstPageContent) ||
      isSell(firstPageContent) ||
      isDividend(firstPageContent) ||
      isTaxinfoDividend(firstPageContent) ||
      detectedButIgnoredDocument(firstPageContent))
  );
};

const parseData = textArr => {
  let type,
    date,
    time,
    isin,
    wkn,
    company,
    shares,
    price,
    amount,
    fee = 0,
    tax = 0,
    fxRate,
    foreignCurrency;

  const formatId = getDocumentFormatId(textArr);

  if (isBuy(textArr)) {
    type = 'Buy';
    date = findDateBuySell(textArr);
    time = findOrderTime(textArr);
    [fxRate, foreignCurrency] = findBuyFxRateForeignCurrency(textArr);
    [isin, wkn] = findISINAndWKN(textArr, 2, 1);
    company = findCompany(textArr, type, formatId);
    amount = +findAmount(textArr, fxRate, foreignCurrency, formatId);
    shares = findShares(textArr, formatId);
    price = +Big(amount).div(shares);
    fee = findFee(textArr, amount, false, formatId);
  } else if (isSell(textArr)) {
    type = 'Sell';
    [isin, wkn] = findISINAndWKN(
      textArr,
      formatId === 1 ? 4 : 2,
      formatId === 1 ? 2 : 1
    );
    company = findCompany(textArr, type, formatId);
    date = findDateBuySell(textArr);
    time = findOrderTime(textArr);
    [fxRate, foreignCurrency] = findBuyFxRateForeignCurrency(textArr);
    shares = findShares(textArr, formatId);
    amount = +findAmount(textArr, fxRate, foreignCurrency, formatId);
    price = +Big(amount).div(shares);
    fee = findFee(textArr, amount, true, formatId);
    tax = findTax(textArr, fxRate, formatId)[0];
  } else if (isDividend(textArr)) {
    [fxRate, foreignCurrency] = findPayoutFxrateForeignCurrency(textArr);
    type = 'Dividend';
    [isin, wkn] = findISINAndWKN(textArr, 3, 1);
    company = findCompany(textArr, type, formatId);
    date = findDateDividend(textArr);
    shares = findDividendShares(textArr);
    amount = findPayout(textArr, fxRate)[0];
    price = +Big(amount).div(shares);
    tax = findTax(textArr, fxRate, formatId)[0];
  } else if (isTaxinfoDividend(textArr)) {
    // Still needs handling of Foreign  Rates
    let payout, withholdingTax, integratedWithholdingTax;
    type = 'Dividend';
    [isin, wkn, company, shares] = findISINAndWKN(textArr, 0, 0);
    date = findDateDividend(textArr, formatId);
    [tax, withholdingTax] = findTax(textArr, undefined, formatId);
    [payout, integratedWithholdingTax] = findPayout(textArr);
    if (integratedWithholdingTax > withholdingTax) {
      withholdingTax = integratedWithholdingTax;
      tax = +Big(tax).plus(integratedWithholdingTax);
    }
    amount = +Big(payout).plus(withholdingTax);
    price = +Big(amount).div(shares);
  }
  const [parsedDate, parsedDateTime] = createActivityDateTime(date, time);

  let activity = {
    broker: 'comdirect',
    type,
    date: parsedDate,
    datetime: parsedDateTime,
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
  if (detectedButIgnoredDocument(contents[0])) {
    // We know this type and we don't want to support it.
    return {
      activities: [],
      status: 7,
    };
  }

  // Sometimes information regarding the first transcation (i. e. tax in sell
  // documents) is spread across multiple pdf pages
  const activities = [parseData(contents.flat())];

  return {
    activities,
    status: 0,
  };
};
