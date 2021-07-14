import Big from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
  timeRegex,
} from '@/helper';

const isPageTypeBuy = content =>
  content.some(
    line =>
      line.includes('Wertpapier Abrechnung Kauf') ||
      line.includes('Wertpapier Abrechnung Ausgabe Investmentfonds')
  );

const isPageTypeSell = content =>
  content.some(
    line =>
      line.includes('Wertpapier Abrechnung Verkauf') ||
      line.includes('Wertpapier Abrechnung Rücknahme Investmentfonds')
  );

const isPageTypeDividend = content =>
  content.some(
    line => 
      line.includes('Ausschüttung Investmentfonds') ||
      line.includes('Dividendengutschrift')
  );

const findISIN = content =>
  content[findLineNumberByContent(content, 'ISIN') + 5];

const findOrderDate = content => {
  const lineNumber = findLineNumberByContent(content, 'Schlusstag');
  if (lineNumber <= 0) {
    return undefined;
  }

  const value = content[lineNumber + 1];
  if (!value.includes(' ')) {
    return value;
  }

  return value.split(' ')[0];
};

const findOrderTime = content => {
  const lineNumber = findLineNumberByContent(content, 'Schlusstag/-Zeit');
  if (lineNumber <= 0) {
    return undefined;
  }

  const lineValue = content[lineNumber + 1];
  if (!lineValue.includes(' ') || !timeRegex(true).test(lineValue)) {
    return undefined;
  }

  return lineValue.split(' ')[1];
};

const findPayDate = content =>
  content[findLineNumberByContent(content, 'Zahlbarkeitstag') + 1];

const findCompany = content =>
  content[findLineNumberByContent(content, 'Stück') + 1];

const findShares = content =>
  parseGermanNum(
    content[findLineNumberByContent(content, 'Stück')].split(' ')[1]
  );

const findAmount = (content, findTotalAmount) => {
  return formatNumber(
    content[
      findLineNumberByContent(
        content,
        findTotalAmount ? 'Ausmachender Betrag' : 'Kurswert'
      ) + 1
    ]
  );
};

const findPayoutAmount = content => {
  let currentLineNumber = findLineNumberByContent(content, 'Ausschüttung');
  if (currentLineNumber < 0) {
    currentLineNumber = findLineNumberByContent(content, 'Dividendengutschrift');
  }
  while (!content[currentLineNumber + 2].includes('EUR')) {
    currentLineNumber += 2;
  }

  return formatNumber(content[currentLineNumber + 1]);
};

const formatNumber = value => {
  if (value.endsWith('-')) {
    value = value.slice(0, -1);
  }

  return parseGermanNum(value);
};

const findLineNumberByContent = (content, term) =>
  content.findIndex(line => line.includes(term));

export const canParseDocument = (pages, extension) => {
  const firstPageContent = pages[0];
  return (
    extension === 'pdf' &&
    firstPageContent.some(line => line.includes('1822direkt')) &&
    (isPageTypeBuy(firstPageContent) ||
      isPageTypeSell(firstPageContent) ||
      isPageTypeDividend(firstPageContent))
  );
};

const parsePage = content => {
  let type, date, time, isin, company, shares, price, amount, fee, tax;

  if (isPageTypeBuy(content)) {
    const amountWithoutFees = Big(findAmount(content, false));
    type = 'Buy';
    isin = findISIN(content);
    company = findCompany(content);
    date = findOrderDate(content);
    time = findOrderTime(content);
    shares = findShares(content);
    amount = +amountWithoutFees;
    price = +amountWithoutFees.div(Big(shares));
    fee = +Big(findAmount(content, true)).minus(amountWithoutFees);
    tax = 0;
  } else if (isPageTypeSell(content)) {
    const amountWithoutFees = Big(findAmount(content, false));
    type = 'Sell';
    isin = findISIN(content);
    company = findCompany(content, false);
    date = findOrderDate(content);
    time = findOrderTime(content);
    shares = findShares(content, false);
    amount = +amountWithoutFees;
    price = +amountWithoutFees.div(Big(shares));
    fee = +Big(amountWithoutFees).minus(findAmount(content, true));
    tax = 0;
  } else if (isPageTypeDividend(content)) {
    const amountWithoutTaxes = Big(findPayoutAmount(content));
    type = 'Dividend';
    isin = findISIN(content);
    company = findCompany(content, true);
    date = findPayDate(content);
    shares = findShares(content, true);
    amount = +amountWithoutTaxes;
    price = +amountWithoutTaxes.div(Big(shares));
    fee = 0;
    tax = +Big(amountWithoutTaxes).minus(findAmount(content, true));
  } else {
    console.error('Unknown page type for 1822direkt');
    return undefined;
  }

  const [parsedDate, parsedDateTime] = createActivityDateTime(
    date,
    time,
    'dd.MM.yyyy',
    'dd.MM.yyyy HH:mm:ss'
  );

  return validateActivity({
    broker: '1822direkt',
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

export const parsePages = contents => {
  let activities = [];

  for (let content of contents) {
    const activity = parsePage(content);
    if (activity === undefined) {
      continue;
    }

    activities.push(activity);
  }

  return {
    activities,
    status: 0,
  };
};
