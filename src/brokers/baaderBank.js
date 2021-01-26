import Big from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
  timeRegex,
  findFirstRegexIndexInArray,
} from '@/helper';
// This broker also handles scalable capital

const isPageTypeBuy = content =>
  content.some(line => line.includes('Wertpapierabrechnung: Kauf'));

const isPageTypeSell = content =>
  content.some(line => line.includes('Wertpapierabrechnung: Verkauf'));

const isPageTypeDividend = content =>
  content.some(
    line =>
      line.includes('Fondsausschüttung') ||
      line.includes('Dividendenabrechnung')
  );

const isPageTypeAccountStatement = content =>
  content.indexOf('Perioden-Kontoauszug: EUR-Konto') > 0;

const isBrokerGratisbroker = content =>
  content.some(line => line.includes('GRATISBROKER GmbH'));

const isBrokerScalableCapital = content =>
  content.some(
    line =>
      line.includes('Scalable Capital Vermögensverwaltung GmbH') ||
      content.some(line => line.includes('Scalable Capital Vermögensverw.GmbH'))
  );

const isBrokerOskar = content =>
  content.some(line => line.includes('Oskar.de GmbH'));

const getBroker = content => {
  if (isBrokerGratisbroker(content)) {
    return 'gratisbroker';
  }

  if (isBrokerOskar(content)) {
    return 'oskar';
  }

  return 'scalablecapital';
};

const findOrderDate = content => {
  let orderDate =
    content[
      findLineNumberByCurrentAndPreviousLineContent(
        content,
        'Handels-',
        'datum'
      ) + 5
    ];

  if (orderDate !== undefined) {
    // The document is a normal market order
    return orderDate;
  }

  // For a saving plan, the order date is on another location
  return content[findLineNumberByContent(content, 'Handelsdatum') + 2];
};

const findOrderTime = content => {
  // Extract the time after the line with order time which contains "06:24:26:12". The
  // time must match the format `HH:mm:ss`.
  let orderTime =
    content[
      findLineNumberByCurrentAndPreviousLineContent(
        content,
        'Handels-',
        'uhrzeit'
      ) + 4
    ];

  if (orderTime !== undefined && timeRegex(true).test(orderTime)) {
    // The document is a normal market order
    return orderTime.substring(0, 8);
  }

  // For a saving plan, the order date is on another location
  orderTime = content[findLineNumberByContent(content, 'Handelsuhrzeit') + 2];

  if (orderTime !== undefined && timeRegex(true).test(orderTime)) {
    // The document is a normal market order
    return orderTime.substring(0, 8);
  }

  return undefined;
};

const findPayDate = content => {
  const term = 'Valuta: ';
  return content[findLineNumberByContent(content, term)].substring(term.length);
};

const findByStartingTerm = (content, term) =>
  content[content.findIndex(line => line.startsWith(term))].substring(
    term.length
  );

const findLineNumberByContent = (content, term, contains = true) =>
  content.findIndex(line => (contains ? line.includes(term) : line === term));

const findLineNumberByCurrentAndPreviousLineContent = (
  content,
  firstTerm,
  secondTerm
) => {
  for (let lineNumber = 0; lineNumber < content.length; lineNumber++) {
    const lineContent = content[lineNumber];
    if (!lineContent.includes(firstTerm)) {
      continue;
    }

    if (content[lineNumber + 1].includes(secondTerm)) {
      return lineNumber + 1;
    }
  }

  return undefined;
};

const findISIN = content => findByStartingTerm(content, 'ISIN: ');

const findCompany = (content, isDividend) => {
  let startLineNumber;
  let endLineNumber;
  if (isDividend) {
    startLineNumber = findLineNumberByContent(content, 'p.STK') + 1;
    endLineNumber = findLineNumberByContent(content, 'Zahlungszeitraum:') - 1;
  } else {
    startLineNumber = findLineNumberByContent(content, 'Auftragszeit:') + 5;
    endLineNumber = findLineNumberByContent(content, 'Orderroutingssystem') - 2;
  }

  if (startLineNumber + 1 <= endLineNumber) {
    return content[startLineNumber] + ' ' + content[startLineNumber + 1];
  }

  return content[startLineNumber];
};

const findShares = (content, isDividend) => {
  const line = isDividend
    ? content[findLineNumberByContent(content, 'Ausschüttung', false) - 1]
    : content[
        findLineNumberByCurrentAndPreviousLineContent(
          content,
          'Nominale',
          'STK'
        )
      ];
  return parseGermanNum(line.split(' ')[1]);
};

const findAmount = (content, type) => {
  if (type === 'Dividend') {
    //First occurence of Bruttobetrag  can be in foreign currency; last Occurence is in €
    return parseGermanNum(content[content.lastIndexOf('Bruttobetrag') + 2]);
  } else if (type === 'Buy' || type === 'Sell') {
    return parseGermanNum(content[content.indexOf('Kurswert') + 1]);
  }
};

const findPricePerShare = (content, isDividend) => {
  if (!isDividend) {
    return parseGermanNum(
      content[findLineNumberByContent(content, 'Ausführungsplatz:') + 1]
    );
  }

  const lineNumberOfValue = findLineNumberByContent(content, 'p.STK');
  const pricePerShareValue = content[lineNumberOfValue];
  const pricePerShare = pricePerShareValue.split(' ')[0].trim();
  const currency = content[lineNumberOfValue - 1];

  if (currency === 'EUR') {
    return parseGermanNum(pricePerShare);
  }

  return +Big(parseGermanNum(pricePerShare)).div(
    findExchangeRate(content, currency)
  );
};

const findExchangeRate = (content, currency) => {
  // Find the value of "EUR/USD 1,1869" by searching for "EUR/USD"
  const searchTerm = 'EUR/' + currency;
  const exchangeRateValue =
    content[findLineNumberByContent(content, searchTerm) - 1];

  return Big(parseGermanNum(exchangeRateValue));
};

const findTax = content => {
  var totalTax = Big(0);

  // We should only parse the tax amounts before the information about the tax calculation.
  const lineNumberWithTaxCalculations = findLineNumberByContent(
    content,
    'Darstellung der steuerlichen Berechnungsgrundlagen'
  );

  const searchTermTax = 'Kapitalertragsteuer';
  const lineWithTax = findLineNumberByContent(content, searchTermTax);
  if (lineWithTax > -1 && lineWithTax < lineNumberWithTaxCalculations) {
    totalTax = totalTax.plus(Big(parseGermanNum(content[lineWithTax + 1])));
  }

  const searchTermChurchTax = 'Kirchensteuer';
  const lineWithChurchTax = findLineNumberByContent(
    content,
    searchTermChurchTax
  );
  if (
    lineWithChurchTax > -1 &&
    lineWithChurchTax < lineNumberWithTaxCalculations
  ) {
    totalTax = totalTax.plus(
      Big(parseGermanNum(content[lineWithChurchTax + 1]))
    );
  }

  const searchTermSolidarityTax = 'Solidaritätszuschlag';
  const lineWithSolidarityTax = findLineNumberByContent(
    content,
    searchTermSolidarityTax
  );
  if (
    lineWithSolidarityTax > -1 &&
    lineWithSolidarityTax < lineNumberWithTaxCalculations
  ) {
    totalTax = totalTax.plus(
      Big(parseGermanNum(content[lineWithSolidarityTax + 1]))
    );
  }

  const searchTermWithholdingTax = 'Quellensteuer';
  const lineWithWithholdingTax = findLineNumberByContent(
    content,
    searchTermWithholdingTax
  );
  if (
    lineWithWithholdingTax > -1 &&
    lineWithWithholdingTax < lineNumberWithTaxCalculations
  ) {
    totalTax = totalTax.plus(
      Big(parseGermanNum(content[lineWithWithholdingTax + 1]))
    );
  }

  const financialTaxIdx = content.findIndex(l =>
    l.endsWith('Finanztransaktionssteuer')
  );
  if (financialTaxIdx >= 0) {
    totalTax = totalTax.plus(Big(parseGermanNum(content[financialTaxIdx + 1])));
  }

  return +totalTax;
};

const canParsePage = content =>
  isPageTypeBuy(content) ||
  isPageTypeSell(content) ||
  isPageTypeDividend(content) ||
  isPageTypeAccountStatement(content);

export const canParseDocument = (pages, extension) => {
  const firstPageContent = pages[0];
  return (
    extension === 'pdf' &&
    canParsePage(firstPageContent) &&
    (isBrokerGratisbroker(firstPageContent) ||
      isBrokerScalableCapital(firstPageContent) ||
      isBrokerOskar(firstPageContent))
  );
};

const parsePage = content => {
  let type, date, time, isin, company, shares, price, amount, fee, tax;

  if (isPageTypeBuy(content)) {
    type = 'Buy';
    isin = findISIN(content);
    company = findCompany(content, false);
    date = findOrderDate(content);
    time = findOrderTime(content);
    shares = findShares(content, false);
    amount = findAmount(content, 'Buy');
    price = findPricePerShare(content, false);
    fee = 0;
    tax = findTax(content);
  } else if (isPageTypeSell(content)) {
    type = 'Sell';
    isin = findISIN(content);
    company = findCompany(content, false);
    date = findOrderDate(content);
    time = findOrderTime(content);
    shares = findShares(content, false);
    amount = findAmount(content, 'Sell');
    price = findPricePerShare(content, false);
    fee = 0;
    tax = findTax(content);
  } else if (isPageTypeDividend(content)) {
    type = 'Dividend';
    isin = findISIN(content);
    company = findCompany(content, true);
    date = findPayDate(content);
    shares = findShares(content, true);
    amount = findAmount(content, 'Dividend');
    price = findPricePerShare(content, true);
    fee = 0;
    tax = findTax(content);
  } else {
    console.error('Unknown page type for Baader Bank');
  }

  const [parsedDate, parsedDateTime] = createActivityDateTime(
    date,
    time,
    'dd.MM.yyyy',
    'dd.MM.yyyy HH:mm:ss'
  );

  return validateActivity({
    broker: getBroker(content),
    type,
    date: parsedDate,
    datetime: parsedDateTime,
    isin,
    company,
    shares,
    price,
    amount,
    fee,
    tax,
  });
};

const parseAccountStatement = content => {
  const dateRegex = /^\d{2}.\d{2}.\d{4}$/;
  let startIndex = content.indexOf('Perioden-Kontoauszug: EUR-Konto');

  let activities = [];
  while (startIndex >= 0) {
    // Search the next date with an offset of two of the last one. We need the offset of two, because of the credit date the valuta date follows.
    startIndex = findFirstRegexIndexInArray(content, dateRegex, startIndex + 2);
    if (startIndex === undefined) {
      break;
    }

    let companyLineNumber, type, isin, company, shares, amount;
    if (content[startIndex + 2] === 'Kauf') {
      type = 'Buy';
      amount = parseGermanNum(content[startIndex + 3]);
      companyLineNumber = startIndex + 5;
    } else if (content[startIndex + 3] === 'Coupons/Dividende') {
      type = 'Dividend';
      amount = parseGermanNum(content[startIndex + 2]);
      companyLineNumber = startIndex + 4;
    } else {
      // This type is not supported (yet).
      continue;
    }

    company = content[companyLineNumber];
    isin = content[companyLineNumber + 1].split(/\s+/)[1];
    shares = parseGermanNum(content[companyLineNumber + 2].split(/\s+/)[1]);

    const [parsedDate, parsedDateTime] = createActivityDateTime(
      content[startIndex + 1],
      undefined,
      'dd.MM.yyyy'
    );

    activities.push(
      validateActivity({
        broker: getBroker(content),
        type,
        date: parsedDate,
        datetime: parsedDateTime,
        isin,
        company,
        shares,
        price: +Big(amount).div(shares),
        amount,
        fee: 0,
        tax: 0,
      })
    );
  }

  return activities;
};

export const parsePages = contents => {
  let activities = [];
  const content = contents.flat();

  if (isPageTypeAccountStatement(contents[0])) {
    activities.push(...parseAccountStatement(content));
  } else if (canParsePage(content)) {
    activities.push(parsePage(content));
  }

  return {
    activities,
    status: 0,
  };
};
