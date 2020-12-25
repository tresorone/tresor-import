import Big from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
} from '@/helper';

const findForeignCurrencyFxRate = pageArray => {
  let foreignIndex = pageArray.findIndex(line => line.includes('-Kurs Mitte'));
  if (foreignIndex >= 0) {
    const foreignIndexLine = pageArray[foreignIndex].split(' ');
    return [
      parseGermanNum(foreignIndexLine[2]),
      foreignIndexLine[0].split('-')[0],
    ];
  }
  foreignIndex = pageArray.findIndex(line =>
    line.startsWith('Devisenkurs Mitte')
  );
  if (foreignIndex >= 0) {
    const foreignIndexLine = pageArray[foreignIndex].split(/\s+/);
    return [
      parseGermanNum(foreignIndexLine[5]),
      foreignIndexLine[2].split('/')[0],
    ];
  }

  return [undefined, undefined];
};

const isForeignCurrencyTransaction = pageArray =>
  pageArray.some(line => line.includes('-Kurs Mitte'));

const findIsinBuy = pageArray => {
  const isinIndex =
    pageArray.findIndex(line => line.includes('Ihr Auftrag vom')) + 1;
  return pageArray[isinIndex].split(/\s/)[0];
};

const findCompanyBuy = pageArray => {
  const companyIndex =
    pageArray.findIndex(line => line.includes('Ihr Auftrag vom')) + 1;
  if (companyIndex >= 0) {
    return pageArray[companyIndex].split(/(\s+)/).slice(2).join('');
  }
};

const findCompanyIsinDividend = pageArray => {
  const isinIndex = pageArray.findIndex(line => line.startsWith('ISIN:'));
  if (isinIndex >= 0) {
    return [
      pageArray[isinIndex + 1].split(/\s+/)[0],
      pageArray[isinIndex].split(/(\s+)/).slice(2).join(''),
    ];
  }
};

const findDateBuy = (pageArray, legacyDocument = false) => {
  const dateIndex = legacyDocument
    ? pageArray.findIndex(line => line.includes('Kauf aus Wertpapierliste vom'))
    : pageArray.findIndex(line => line.includes('uf Marktplatz vom'));

  const dateLine = pageArray[dateIndex].split(/(\s+)/);
  return dateLine[dateLine.length - 1];
};

const findOrderTime = content => {
  const lineNumber = content.findIndex(line => line.includes('hrungszeit'));
  if (lineNumber > 0) {
    const elements = content[lineNumber].split(/\s+/);
    const elementIndex = elements.findIndex(element =>
      element.includes('hrungszeit')
    );

    if (elementIndex >= 0) {
      return elements[elementIndex + 1].trim();
    }
  }

  return undefined;
};

const findDateDividend = pageArray => {
  let dateLineIdx = pageArray.findIndex(line => line.includes('mit Valuta'));
  if (dateLineIdx >= 0) {
    const dateLine = pageArray[dateLineIdx].split(/(\s+)/);
    return dateLine[dateLine.length - 1];
  }
  dateLineIdx = pageArray.findIndex(line => line.startsWith('Extag '));
  if (dateLineIdx >= 0) {
    return parseGermanNum(pageArray[dateLineIdx].split(/\s+/)[1]);
  }
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
  // Regex matches lines such as
  // Brutto USD                                                     9,84                  8,07
  // and
  // Brutto EUR                                                                           9,98
  let amountLineIndex = pageArray.findIndex(line =>
    /^Brutto [A-Z]{3}\s+([0-9]+(,[0-9]+)?\s+)?[0-9]+(,[0-9]+)?$/.test(line)
  );
  if (amountLineIndex >= 0) {
    const taxLine = pageArray[amountLineIndex].split(/\s+/);
    return parseGermanNum(taxLine[taxLine.length - 1]);
  }
};

const findSharesBuy = pageArray => {
  const sharesLineIndex =
    pageArray.findIndex(line => line.includes('ckzahl')) + 1;
  const sharesLineArray = pageArray[sharesLineIndex].split(/\s+/);
  return parseGermanNum(sharesLineArray[1]);
};

const findSharesDividend = pageArray => {
  let sharesLineIndex = pageArray.findIndex(line =>
    line.includes('Menge/Währung:')
  );
  if (sharesLineIndex >= 0) {
    return parseGermanNum(pageArray[sharesLineIndex].split(/\s+/)[1]);
  }
  sharesLineIndex = pageArray.findIndex(line => line.includes('Menge/W'));
  if (sharesLineIndex >= 0) {
    return parseGermanNum(pageArray[sharesLineIndex + 2].split(/\s+/)[1]);
  }
};

const findFeeBuy = (pageArray, legacyDocument = false) => {
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
    return completeFee;
  }
  // If the document is a in a newer format, choose this parser for fees
  else {
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
    line.startsWith('KESt III ')
  );
  if (kestThreeIndex >= 0) {
    const taxLine = pageArray[kestThreeIndex].split(/\s+/);
    completeTax = completeTax.plus(
      Big(parseGermanNum(taxLine[taxLine.length - 1])).abs()
    );
  }
  const kestTwoIndex = pageArray.findIndex(line => line.startsWith('KESt II '));
  if (kestTwoIndex >= 0) {
    const taxLine = pageArray[kestTwoIndex].split(/\s+/);
    completeTax = completeTax.plus(
      Big(parseGermanNum(taxLine[taxLine.length - 1])).abs()
    );
  }
  const kestOneIndex = pageArray.findIndex(line => line.startsWith('KESt I '));
  if (kestOneIndex >= 0) {
    const taxLine = pageArray[kestOneIndex].split(/\s+/);
    completeTax = completeTax.plus(
      Big(parseGermanNum(taxLine[taxLine.length - 1])).abs()
    );
  }
  const withholdingTaxIndex = pageArray.findIndex(line =>
    line.startsWith('QESt ')
  );
  if (withholdingTaxIndex >= 0) {
    const taxLine = pageArray[withholdingTaxIndex].split(/\s+/);
    completeTax = completeTax.plus(
      Big(parseGermanNum(taxLine[taxLine.length - 1])).abs()
    );
  }
  return +completeTax;
};

const isBuy = pageArray => {
  return pageArray.some(line => line.includes('uf Marktplatz vom'));
};

const isDividend = pageArray => {
  return (
    pageArray.includes('Ausschüttung') ||
    pageArray.includes('Quartalsdividende')
  );
};

const isOldBuy = pageArray => {
  return pageArray.some(line => line.includes('Kauf aus Wertpapierliste'));
};

export const canParseFirstPage = (pageArray, extension) => {
  try {
    const isErsteBankFile = pageArray
      .join('')
      .includes('ESTERREICHISCHENSPARKASSEN');
    return (
      extension === 'pdf' &&
      (isBuy(pageArray) || isOldBuy(pageArray) || isDividend(pageArray)) &&
      isErsteBankFile
    );
  } catch (TypeError) {
    return false;
  }
};

export const parsePages = content => {
  // Flatten every incomming array
  const pdfPagesConcat = [].concat.apply([], content);
  const broker = 'ersteBank';
  const [fxRate, foreignCurrency] = findForeignCurrencyFxRate(pdfPagesConcat);

  let type, amount, shares, isin, company, date, time, price, tax, fee;

  if (isBuy(pdfPagesConcat)) {
    type = 'Buy';
    isin = findIsinBuy(pdfPagesConcat);
    company = findCompanyBuy(pdfPagesConcat);
    date = findDateBuy(pdfPagesConcat);
    time = findOrderTime(pdfPagesConcat);
    amount = findAmountBuy(pdfPagesConcat);
    shares = findSharesBuy(pdfPagesConcat);
    price = +Big(amount).div(shares);
    tax = 0;
    fee = +findFeeBuy(pdfPagesConcat);
  } else if (isOldBuy(pdfPagesConcat)) {
    type = 'Buy';
    isin = findIsinBuy(pdfPagesConcat);
    company = findCompanyBuy(pdfPagesConcat);
    date = findDateBuy(pdfPagesConcat, true);
    time = findOrderTime(pdfPagesConcat);
    fee = +findFeeBuy(pdfPagesConcat, true);
    amount = +Big(findAmountBuy(pdfPagesConcat, true)).minus(fee);
    shares = findSharesBuy(pdfPagesConcat);
    price = +Big(amount).div(shares);
    tax = 0;
  } else if (isDividend(pdfPagesConcat)) {
    type = 'Dividend';
    [isin, company] = findCompanyIsinDividend(pdfPagesConcat);
    date = findDateDividend(pdfPagesConcat);
    amount = findAmountDividend(pdfPagesConcat, fxRate);
    shares = findSharesDividend(pdfPagesConcat);
    price = +Big(amount).div(shares);
    fee = 0;
    tax = findTaxPayout(pdfPagesConcat);
  }

  const [parsedDate, parsedDateTime] = createActivityDateTime(
    date,
    time,
    'dd.MM.yyyy',
    'dd.MM.yyyy HH:mm:ss'
  );

  let activity = {
    broker: broker,
    type: type,
    isin: isin,
    company: company,
    date: parsedDate,
    datetime: parsedDateTime,
    amount: amount,
    shares: shares,
    price: price,
    tax: tax,
    fee: fee,
  };

  if (fxRate !== undefined) {
    activity.fxRate = fxRate;
  }

  if (foreignCurrency !== undefined) {
    activity.foreignCurrency = foreignCurrency;
  }

  return {
    activities: [validateActivity(activity)],
    status: 0,
  };
};
