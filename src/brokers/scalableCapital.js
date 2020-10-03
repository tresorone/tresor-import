import format from 'date-fns/format';
import parse from 'date-fns/parse';
import Big from 'big.js';

import { parseGermanNum, validateActivity } from '@/helper';

export const isPageTypeBuy = content =>
  content.some(line => line.includes('Wertpapierabrechnung: Kauf'));

export const isPageTypeSell = content =>
  content.some(line => line.includes('Wertpapierabrechnung: Verkauf'));

export const isPageTypeDividend = content =>
  content.some(line => line.includes('Fondsausschüttung'));

export const findOrderDate = content => {
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

export const findPayDate = content =>
  content[findLineNumberByContent(content, 'Zahltag') + 1];

export const findByStartingTerm = (content, term) =>
  content[content.findIndex(line => line.startsWith(term))].substring(
    term.length
  );

export const findLineNumberByCurrentAndPreviousLineContent = (
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

export const findLineNumberByContent = (content, term) =>
  content.findIndex(line => line.includes(term));

export const findISIN = content => findByStartingTerm(content, 'ISIN: ');

export const findCompany = (content, isDividend) =>
  isDividend
    ? content[findLineNumberByContent(content, 'Zahltag:') - 4]
    : content[findLineNumberByContent(content, 'Auftragszeit:') + 5];

export const findShares = (content, isDividend) => {
  const line = isDividend
    ? content[findLineNumberByContent(content, 'Fondsausschüttung') + 1]
    : content[
        findLineNumberByCurrentAndPreviousLineContent(
          content,
          'Nominale',
          'STK'
        )
      ];
  return parseGermanNum(line.split(' ')[1]);
};

export const findAmount = (content, isCredit, isDividend) =>
  parseGermanNum(
    content[
      isDividend
        ? findLineNumberByCurrentAndPreviousLineContent(
            content,
            'Bruttobetrag',
            'EUR'
          ) + 1
        : findLineNumberByCurrentAndPreviousLineContent(
            content,
            isCredit ? 'Zu Gunsten Konto' : 'Zu Lasten Konto',
            'EUR'
          ) + 1
    ]
  );

export const canParseData = content =>
  content.some(line =>
    line.includes('Scalable Capital Vermögensverwaltung GmbH')
  ) &&
  (isPageTypeBuy(content) ||
    isPageTypeSell(content) ||
    isPageTypeDividend(content));

export const parseData = content => {
  let type, date, isin, company, shares, price, amount, fee, tax;

  if (isPageTypeBuy(content)) {
    type = 'Buy';
    isin = findISIN(content);
    company = findCompany(content, false);
    date = findOrderDate(content);
    shares = findShares(content, false);
    amount = findAmount(content, false, false);
    price = +Big(amount).div(Big(shares));
    fee = 0;
    tax = 0;
  } else if (isPageTypeSell(content)) {
    type = 'Sell';
    isin = findISIN(content);
    company = findCompany(content, false);
    date = findOrderDate(content);
    shares = findShares(content, false);
    amount = findAmount(content, true, false);
    price = +Big(amount).div(Big(shares));
    fee = 0;
    tax = 0;
  } else if (isPageTypeDividend(content)) {
    type = 'Dividend';
    isin = findISIN(content);
    company = findCompany(content, true);
    date = findPayDate(content);
    shares = findShares(content, true);
    amount = findAmount(content, false, true);
    price = +Big(amount).div(Big(shares));
    fee = 0;
    tax = 0;
  } else {
    console.error('Unknown page type for scalable.capital');
  }

  return validateActivity({
    broker: 'scalablecapital',
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

  for (let content of contents) {
    try {
      let activity = parseData(content);
      if (activity === undefined) {
        return;
      }

      activities.push(activity);
    } catch (exception) {
      console.error(
        'Error while parsing page (scalable.capital)',
        exception,
        content
      );
    }
  }

  return activities;
};