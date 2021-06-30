import Big from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
  timeRegex,
  findFirstSearchtermIndexInArray,
} from '@/helper';
import { findFirstRegexIndexInArray } from '../helper';

// Both smartbroker and onvista use highly similar parsers due to them both being
// daughter companies from BNP Paribas; a french bank. There is no string which
// uniquely identifies onvista files so we have to construct a multistring
// identifcation scheme.
export const onvistaIdentificationString = 'BELEGDRUCK=J';
export const smartbrokerIdentificationStrings = [
  'Landsberger Straße 300',
  'Landsberger Straˇe 300',
];

export const findISIN = text => {
  return text[text.indexOf('ISIN') + 1];
};

const findISINFullText = fullText => {
  const startPosition = fullText.indexOf('ISIN') + 4;
  return fullText.substring(startPosition, startPosition + 12);
};

export const findCompany = text => {
  let company = text[text.findIndex(t => t.includes('ISIN')) - 1];
  if (company === 'Gattungsbezeichnung') {
    company = text[text.findIndex(t => t.includes('ISIN')) - 2];
  }
  if (company) return company;
};

const findCompanyFullText = fullText =>
  findValueBetweenElements(fullText, 'Gattungsbezeichnung', 'ISIN');

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

const findDateBuySellFullText = fullText =>
  findValueBetweenElements(fullText, 'Handelstag', 'Handelszeit');

export const findDateDividend = text => {
  return text[text.findIndex(t => t.includes('Zahltag')) + 1];
};

const findDateDividendFullText = fullText =>
  fullText.substring(
    fullText.indexOf('Zahltag') + 7,
    fullText.indexOf('Zahltag') + 17 // The date with german format has a length of 10 charaters
  );

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

const findOrderTimeFullText = fullText =>
  findValueBetweenElements(fullText, 'Handelszeit', 'Handelsplatz');

export const findShares = textArr => {
  const sharesLine = textArr[textArr.findIndex(t => t.includes('STK'))];
  return parseGermanNum(sharesLine.split(' ')[1]);
};

const findSharesFullText = fullText =>
  findNumberByOneStartingElements(fullText, 'STK', 0);

export const findPrice = (text, fxRate = undefined) => {
  const priceLine = text[text.findIndex(t => t.includes('Kurs')) + 1];
  const price = parseGermanNum(priceLine.split(' ')[1]);

  return fxRate === undefined ? price : +Big(price).div(fxRate);
};

const findPriceFullText = (fullText, fxRate) => {
  const amount = findNumberByOneStartingElements(fullText, 'Kurs');
  return fxRate === undefined ? amount : +Big(amount).div(fxRate);
};

export const findAmount = (text, fxRate = undefined) => {
  let amountIdx = text.findIndex(t => t.includes('Kurswert'));
  if (amountIdx < 0) {
    amountIdx = text.findIndex(t => t.includes('Bezugspreis'));
  }
  let amount = parseGermanNum(text[amountIdx + 2]);
  return fxRate === undefined ? amount : +Big(amount).div(fxRate);
};

const findAmountFullText = (fullText, fxRate) => {
  const amount = findNumberByOneStartingElements(fullText, [
    'Kurswert',
    'Bezugspreis',
  ]);
  return fxRate === undefined ? amount : +Big(amount).div(fxRate);
};

const findNumberByOneStartingElements = (fullText, elements, offset = 3) => {
  const position = findFirstPositionOfElements(fullText, elements);
  if (position < 0) {
    return undefined;
  }

  let value = '';
  const pattern = /[0-9-,.]/;
  for (let index = position + offset; index < fullText.length; index++) {
    const element = fullText[index];
    if (!pattern.test(element)) {
      break;
    }

    value += element;
  }

  return parseGermanNum(value);
};

const findFirstPositionOfElements = (
  fullText,
  elements,
  minimumIndex = 0,
  appendLength = true
) => {
  if (typeof elements === 'string') {
    elements = [elements];
  }

  for (let index = 0; index < elements.length; index++) {
    const element = elements[index];
    const position = fullText.indexOf(element, minimumIndex);

    if (position >= minimumIndex) {
      return appendLength ? position + element.length : position;
    }
  }

  return -1;
};

const findValueBetweenElements = (fullText, startElements, endElements) => {
  let startPosition = findFirstPositionOfElements(fullText, startElements);
  if (startPosition < 0) {
    return undefined;
  }

  let endPosition = findFirstPositionOfElements(
    fullText,
    endElements,
    startPosition,
    false
  );
  if (endPosition < 0) {
    return undefined;
  }

  return fullText.substring(startPosition, endPosition);
};

export const findFee = (content, fxRate = undefined) => {
  let fee = Big(0);
  const potentialFees = [
    'Börsengebühr',
    'Fremdspesen',
    'Handelsplatzgebühr',
    'Orderprovision',
    'Provision',
    'Maklercourtage',
    'Fremde Spesen Xontro',
    'Gebühr',
  ];
  potentialFees.forEach(feeString => {
    const feeIdx = content.indexOf(feeString);
    if (feeIdx >= 0) {
      fee = fee.plus(Big(parseGermanNum(content[feeIdx + 2])));
    }
  });
  return fxRate === undefined ? +fee : +fee.div(fxRate);
};

const findFeeFullText = (fullText, fxRate) => {
  let fee = Big(0);
  const potentialFees = [
    'Börsengebühr',
    'Fremdspesen',
    'Handelsplatzgebühr',
    'Orderprovision',
    'Provision',
    'Maklercourtage',
    'FremdeSpesenXontro',
    'Gebühr',
  ];

  potentialFees.forEach(feeString => {
    const value = findNumberByOneStartingElements(fullText, feeString);
    if (value === undefined) {
      return;
    }

    fee = fee.plus(Big(value));
  });

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

  const witholdingTaxFondInputIdx = text.indexOf(
    'anrechenbare Quellensteuer Fondseingangsseite'
  );
  if (witholdingTaxFondInputIdx >= 0) {
    totalTax = totalTax.plus(
      parseGermanNum(text[witholdingTaxFondInputIdx + 2])
    );
  }

  return +totalTax;
};

const findTaxFullText = fullText => {
  let totalTax = Big(0);

  const taxText = findValueBetweenElements(
    fullText,
    'HinweisezursteuerlichenVerrechnung',
    'imlaufendenJahr'
  );
  let lastPosition = 0;
  if (taxText === undefined) {
    return +totalTax;
  }

  do {
    lastPosition = taxText.indexOf('einbehaltene', lastPosition + 1);
    if (lastPosition > 0) {
      totalTax = totalTax.plus(
        findNumberByOneStartingElements(
          taxText.substring(lastPosition),
          'EUR',
          0
        )
      );
    }
  } while (lastPosition > 0);

  const withholdingTaxPosition = taxText.indexOf('anrechenbare');
  if (withholdingTaxPosition > 0) {
    totalTax = totalTax.plus(
      findNumberByOneStartingElements(
        taxText.substring(withholdingTaxPosition),
        'EUR',
        0
      )
    );
  }

  return +totalTax;
};

const findGrossPayout = (text, tax) => {
  const netPayoutIdx = text.findIndex(t =>
    t.includes('Betrag zu Ihren Gunsten')
  );
  if (netPayoutIdx >= 0) {
    return +Big(parseGermanNum(text[netPayoutIdx + 2])).plus(tax);
  }
  const reinvestIdx = text.indexOf('Thesaurierung brutto');
  if (reinvestIdx >= 0) {
    return parseGermanNum(text[reinvestIdx + 2]);
  }
  const foreignDividend = text.indexOf('ausländische Dividende');
  if (foreignDividend >= 0) {
    return parseGermanNum(text[foreignDividend + 2]);
  }
};

const findGrossPayoutFullText = (fullText, tax) => {
  const netAmountValue = findNumberByOneStartingElements(
    fullText,
    'BetragzuIhrenGunsten'
  );
  if (netAmountValue !== undefined) {
    return +Big(netAmountValue).plus(tax);
  }

  const grossAmountValue = findNumberByOneStartingElements(fullText, [
    'Thesaurierungbrutto',
    'ausländischeDividende',
  ]);
  if (grossAmountValue !== undefined) {
    return grossAmountValue;
  }
};

const findForeignInformation = pdfPage => {
  const foreignCurrencyIdx = pdfPage.indexOf('Devisenkurs') + 1;
  if (foreignCurrencyIdx > 0) {
    const fxRate = parseGermanNum(pdfPage[foreignCurrencyIdx].split(/\s+/)[1]);
    const foreignCurrency = pdfPage[foreignCurrencyIdx]
      .split(/\s+/)[0]
      .split(/\//)[1];
    return [foreignCurrency, fxRate];
  }
  return [undefined, undefined];
};

const findForeignInformationFullText = fullText => {
  const value = findValueBetweenElements(fullText, 'Devisenkurs', 'Betrag');
  if (value === undefined) {
    return [undefined, undefined];
  }

  return [value.substring(4, 7), parseGermanNum(value.substring(7))];
};

export const canParseDocument = (pages, extension) => {
  const firstPageContent = pages[0];
  const allPagesFlat = pages.flat();
  const firstPageText = pages[0].join('');

  return (
    extension === 'pdf' &&
    (((firstPageContent.some(line =>
      line.includes(onvistaIdentificationString)
    ) ||
      firstPageText.includes(onvistaIdentificationString)) &&
      !firstPageContent.some(
        line =>
          line.includes(smartbrokerIdentificationStrings[0]) ||
          line.includes(smartbrokerIdentificationStrings[1])
      )) ||
      (firstPageContent.some(line =>
        line.includes('Webtrading onvista bank')
      ) &&
        detectedButIgnoredDocument(firstPageContent)) ||
      // Account Statements
      (firstPageContent.some(line => line.includes('www.onvista-bank.de')) &&
        isAccountStatement(allPagesFlat)) ||
      // Depotübersicht
      (allPagesFlat[allPagesFlat.length - 1] ===
        'Powered by TCPDF (www.tcpdf.org)' &&
        isOverviewPage(allPagesFlat)))
  );
};

export const isBuy = content =>
  content.some(line => line.includes('Wir haben für Sie gekauft'));

export const isBuyFullText = fullText =>
  fullText.includes('WirhabenfürSiegekauft');

export const isSell = content =>
  content.some(line => line.includes('Wir haben für Sie verkauft'));

export const isSellFullText = fullText =>
  fullText.includes('WirhabenfürSieverkauft');

export const isDividend = content =>
  content.some(line => line.includes('Erträgnisgutschrift')) ||
  content.some(line => line.includes('Dividendengutschrift'));

export const isDividendFullText = fullText =>
  fullText.includes('Erträgnisgutschrift') ||
  fullText.includes('Dividendengutschrift');

const isAccountStatement = content =>
  content.some(
    line =>
      line.toLowerCase().startsWith('kontoauszug nr. ') ||
      line.toLowerCase().startsWith('kontoauszugnr.')
  );

const canParsePage = content => {
  return isBuy(content) || isSell(content) || isDividend(content);
};

const canParsePageFullText = fullText =>
  isBuyFullText(fullText) ||
  isSellFullText(fullText) ||
  isDividendFullText(fullText);

const isOverviewPage = content =>
  content.some(line => line.includes('Depotübersicht Wertpapiere'));

const detectedButIgnoredDocument = (content, fullText) => {
  return (
    // When the document contains one of the following lines, we want to ignore these document.
    content.some(
      line =>
        line.includes('Kostenausweis') ||
        line === 'Storno - Erträgnisgutschrift' ||
        line.startsWith('Stornierung und')
    ) ||
    fullText.includes('Kostenausweis') ||
    fullText.includes('Storno-Erträgnisgutschrift') ||
    fullText.startsWith('Stornierungund')
  );
};

const parseOverview = content => {
  let activities = [];

  for (
    let tableStartLine = content.findIndex(line =>
      line.includes('Aktueller Wert')
    );
    tableStartLine < content.length;
    tableStartLine += 16
  ) {
    const shares = content[tableStartLine + 1].trim();
    if (shares === '/') {
      // The last two lines don't contains securities and are marked with /. We can leave the loop here.
      break;
    }

    const [parsedDate, parsedDateTime] = createActivityDateTime(
      content[tableStartLine + 5],
      content[tableStartLine + 6],
      'dd.MM.yyyy',
      'dd.MM.yyyy HH:mm:ss'
    );

    const activity = validateActivity(
      {
        broker: 'onvista',
        type: 'TransferIn',
        date: parsedDate,
        datetime: parsedDateTime,
        wkn: content[tableStartLine + 3].split('/')[0].trim(),
        isin: content[tableStartLine + 3].split('/')[1].trim(),
        company: content[tableStartLine + 2],
        shares: parseGermanNum(shares),
        price: parseGermanNum(content[tableStartLine + 9].split(' ')[0]),
        amount: parseGermanNum(content[tableStartLine + 10].split(' ')[0]),
        fee: 0,
        tax: 0,
      },
      true
    );

    if (activity === undefined) {
      continue;
    }

    activities.push(activity);
  }

  return activities;
};

const parseAccountStatement = pdfPages => {
  const searchTerms = [
    'Wertpapierkauf',
    'Wertpapierverkauf',
    'Zinsen/Dividenden',
  ];
  const yearLine = pdfPages[
    pdfPages.findIndex(line =>
      line.toLowerCase().startsWith('kontoauszug nr. ')
    )
  ].split('.');
  const year = yearLine[yearLine.length - 1];
  let idx = findFirstSearchtermIndexInArray(pdfPages, searchTerms);
  let activities = [];
  while (idx >= 0) {
    const isinIdx = findFirstRegexIndexInArray(
      pdfPages,
      /^ISIN: [A-Z]{2}[0-9A-Z]{9}[0-9]$/,
      idx
    );
    const sharesIdx = findFirstRegexIndexInArray(pdfPages, /^STK: [1-9]+/, idx);
    const companyIdx = pdfPages[idx + 1].startsWith('ABR: ')
      ? idx + 4
      : idx + 1;
    let activity = {
      broker: 'onvista',
      company: pdfPages[companyIdx],
      isin: pdfPages[isinIdx].split(/\s+/)[1],
      shares: parseGermanNum(pdfPages[sharesIdx].split(/\s+/)[1]),
      amount: Math.abs(parseGermanNum(pdfPages[idx - 1])),
      tax: 0,
      fee: 0,
    };
    activity.price = +Big(activity.amount).div(activity.shares);
    [activity.date, activity.datetime] = createActivityDateTime(
      pdfPages[idx - 3] + year
    );

    switch (pdfPages[idx]) {
      case searchTerms[0]:
        activity.type = 'Buy';
        break;
      case searchTerms[1]:
        activity.type = 'Sell';
        break;
      case searchTerms[2]:
        activity.type = 'Dividend';
        break;
    }
    activity = validateActivity(activity);
    if (activity !== undefined) {
      activities.push(activity);
      idx = findFirstSearchtermIndexInArray(pdfPages, searchTerms, idx + 1);
    } else {
      return undefined;
    }
  }
  return activities;
};

const parseSingleTransactionFullText = fullText => {
  let activity = {
    broker: 'onvista',
    isin: findISINFullText(fullText),
    company: findCompanyFullText(fullText),
    shares: findSharesFullText(fullText),
  };

  const [foreignCurrency, fxRate] = findForeignInformationFullText(fullText);
  if (foreignCurrency !== undefined && fxRate !== undefined) {
    activity.foreignCurrency = foreignCurrency;
    activity.fxRate = fxRate;
  }

  activity.fee = findFeeFullText(fullText, activity.fxRate);
  activity.tax = findTaxFullText(fullText);

  if (isBuyFullText(fullText)) {
    activity.type = 'Buy';
    [activity.date, activity.datetime] = createActivityDateTime(
      findDateBuySellFullText(fullText),
      findOrderTimeFullText(fullText)
    );
    activity.amount = findAmountFullText(fullText, activity.fxRate);
    activity.price = findPriceFullText(fullText, activity.fxRate);
  } else if (isSellFullText(fullText)) {
    activity.type = 'Sell';
    [activity.date, activity.datetime] = createActivityDateTime(
      findDateBuySellFullText(fullText),
      findOrderTimeFullText(fullText)
    );
    activity.amount = findAmountFullText(fullText, activity.fxRate);
    activity.price = findPriceFullText(fullText, activity.fxRate);
  } else if (isDividendFullText(fullText)) {
    activity.type = 'Dividend';
    [activity.date, activity.datetime] = createActivityDateTime(
      findDateDividendFullText(fullText),
      undefined
    );
    activity.amount = findGrossPayoutFullText(fullText, activity.tax);
    activity.price = +Big(activity.amount).div(activity.shares);
  }

  return validateActivity(activity);
};

const parseSingleTransaction = pdfPage => {
  let activity = {
    broker: 'onvista',
    isin: findISIN(pdfPage),
    company: findCompany(pdfPage),
    shares: findShares(pdfPage),
  };
  const [foreignCurrency, fxRate] = findForeignInformation(pdfPage);
  if (foreignCurrency !== undefined && fxRate !== undefined) {
    activity.foreignCurrency = foreignCurrency;
    activity.fxRate = fxRate;
  }

  if (isBuy(pdfPage)) {
    activity.type = 'Buy';
    [activity.date, activity.datetime] = createActivityDateTime(
      findDateBuySell(pdfPage),
      findOrderTime(pdfPage)
    );
    activity.amount = findAmount(pdfPage, activity.fxRate);
    activity.fee = findFee(pdfPage, activity.fxRate);
    activity.tax = 0.0;
    activity.price = findPrice(pdfPage, activity.fxRate);
  } else if (isSell(pdfPage)) {
    activity.type = 'Sell';
    [activity.date, activity.datetime] = createActivityDateTime(
      findDateBuySell(pdfPage),
      findOrderTime(pdfPage)
    );
    activity.amount = findAmount(pdfPage, activity.fxRate);
    activity.fee = findFee(pdfPage, activity.fxRate);
    activity.tax = findTax(pdfPage);
    activity.price = findPrice(pdfPage, activity.fxRate);
  } else if (isDividend(pdfPage)) {
    activity.type = 'Dividend';
    [activity.date, activity.datetime] = createActivityDateTime(
      findDateDividend(pdfPage),
      undefined
    );
    activity.fee = 0;
    activity.tax = findTax(pdfPage);
    activity.amount = findGrossPayout(pdfPage, activity.tax);
    activity.price = +Big(activity.amount).div(activity.shares);
  }
  return validateActivity(activity);
};

export const parsePages = pdfPages => {
  let activities = [];
  if (detectedButIgnoredDocument(pdfPages[0], pdfPages[0].join(''))) {
    // We know this type and we don't want to support it.
    return {
      activities,
      status: 7,
    };
  }

  const allPagesFlat = pdfPages.flat();
  if (isAccountStatement(allPagesFlat)) {
    activities = parseAccountStatement(allPagesFlat);
  } else if (isOverviewPage(allPagesFlat)) {
    activities = parseOverview(allPagesFlat);
  } else {
    for (let content of pdfPages) {
      if (canParsePage(content)) {
        activities.push(parseSingleTransaction(content));
      }
    }

    if (activities.length === 0) {
      pdfPages.forEach(content => {
        const fullText = content.join('');
        if (canParsePageFullText(fullText)) {
          activities.push(parseSingleTransactionFullText(fullText));
        }
      });
    }
  }

  // No valid activities were found
  if (activities.length === 0) {
    return {
      activities,
      status: 5,
    };
  }

  return {
    activities,
    status: activities === undefined ? 3 : 0,
  };
};
