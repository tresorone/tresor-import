import Big from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
  findFirstIsinIndexInArray,
} from '@/helper';
import { findFirstRegexIndexInArray } from '../helper';

const allowedDegiroCountries = [
  'www.degiro.de',
  'www.degiro.es',
  'www.degiro.ie',
  'www.degiro.gr',
  'www.degiro.it',
  'www.degiro.pt',
  'www.degiro.fr',
  'www.degiro.nl',
  'www.degiro.at',
  'www.degiro.fi',
];

class zeroSharesTransaction extends Error {
  constructor(...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, zeroSharesTransaction);
    }
  }
}

const parseTransaction = (content, index, numberParser, offset) => {
  let foreignCurrencyIndex;
  const numberRegex = /^-?(\d+|\d.\d+)(,\d+)?$/;

  let isinIdx = findFirstIsinIndexInArray(content, index);
  const company = content.slice(index + 2, isinIdx).join(' ');
  const isin = content[isinIdx];

  // degiro tells you now the place of execution. Sometimes it is empty so we have to move the index by 1.
  const hasEmptyLine = content[isinIdx + 2 + offset].indexOf(',') > -1;
  isinIdx = hasEmptyLine ? isinIdx - 1 : isinIdx;

  const sharesIdx = findFirstRegexIndexInArray(content, numberRegex, isinIdx);
  const transactionEndIdx = findFirstRegexIndexInArray(
    content,
    /(DEGIRO B\.V\. )|\d{2}-\d{2}-\d{4}/,
    sharesIdx
  );

  // Sometimes the currency comes first; sometimes the value comes first
  const amountOffset = numberRegex.test(content[sharesIdx + 1]) ? 5 : 6;
  let activity = {
    broker: 'degiro',
    company,
    isin,
    shares: numberParser(content[sharesIdx]),
    // There is the case where the amount is 0, might be a transfer out or a knockout certificate
    amount: Math.abs(numberParser(content[sharesIdx + amountOffset])),
    tax: 0,
    fee: 0,
  };

  if (activity.shares === 0) {
    throw new zeroSharesTransaction(
      'Transaction with ISIN ' + activity.isin + ' has no shares.'
    );
  }

  // Some documents don't have the default columns but instead the venue column.
  // For the currency fields we need to add an offset of 2.
  const currencyOffset = content.some(line => line === 'Venue') ? 2 : 0;

  const currency = content[isinIdx + 3 + offset * 2 + currencyOffset];
  const baseCurrency = content[isinIdx + 7 + offset * 2 + currencyOffset];

  if (currency !== baseCurrency) {
    activity.foreignCurrency = currency;
    activity.fxRate = numberParser(
      content[isinIdx + 9 + offset + currencyOffset]
    );
    // For foreign currency we need to go one line ahead for the following fields.
    foreignCurrencyIndex = 1;
  } else {
    foreignCurrencyIndex = 0;
  }

  activity.type = activity.shares > 0 ? 'Buy' : 'Sell';
  activity.price = +Big(activity.amount).div(activity.shares).abs();
  if (activity.type === 'Buy') {
    activity.fee = Math.abs(
      numberParser(content[isinIdx + foreignCurrencyIndex + 10])
    );
  } else if (activity.type === 'Sell') {
    if (transactionEndIdx - sharesIdx >= 10) {
      activity.tax = Math.abs(
        numberParser(content[isinIdx + foreignCurrencyIndex + 10])
      );
    } else {
      activity.tax = 0;
    }
    activity.shares = Math.abs(activity.shares);
  }

  [activity.date, activity.datetime] = createActivityDateTime(
    content[index],
    content[index + 1],
    'dd-MM-yyyy',
    'dd-MM-yyyy HH:mm'
  );

  return validateActivity(activity);
};

const parseTransactionLog = pdfPages => {
  let activities = [];
  // Set another parser if foreign Degiros such as degiro.ch come into place, they will have other number formats.
  const numberParser = parseGermanNum;
  // Sometimes a reference exchange is given which causes an offset of 1
  let offset = 0;
  if (
    pdfPages.flat().includes('Ausführungso') ||
    pdfPages.flat().includes('Borsa di')
  ) {
    offset += 1;
  }
  for (let content of pdfPages) {
    let transactionIndex =
      content.findIndex(
        currentValue => currentValue === 'Gesamt' || currentValue === 'Totale'
      ) + 1;
    while (transactionIndex > 0 && content.length - transactionIndex > 15) {
      // Entries might have a longer length (by 1) if there is a currency rate
      // this checks that the entry is a date in the expected format
      if (!content[transactionIndex].match(/^[0-9]{2}-[0-9]{2}-[0-9]{4}$/)) {
        transactionIndex += 1;
        continue;
      }

      try {
        const transaction = parseTransaction(
          content,
          transactionIndex,
          numberParser,
          offset
        );
        activities.push(transaction);
      } catch (exception) {
        if (!(exception instanceof zeroSharesTransaction)) {
          throw exception;
        }
      }

      // Always go forward, not only in case of success, to prevent an infinity loop
      // A normal activity w/o currency rates spans 16 lines from date to date, but some have missing
      // lines for fxRate and fee. So we need to check 14 lines ahead (and more) for the next activity.
      transactionIndex += 14;
    }
  }
  return activities;
};

const parseDepotStatement = pdfPages => {
  const flattendPages = pdfPages.flat();
  const dateline =
    flattendPages[
      flattendPages.findIndex(
        line =>
          line.startsWith('Portfolioübersicht per ') ||
          line.startsWith('Panoramica Portafoglio al ')
      )
    ];

  const dateLineSplitted = dateline.split(/\s+/);
  const [date, datetime] = createActivityDateTime(
    dateLineSplitted[dateLineSplitted.length - 1],
    undefined,
    'dd-MM-yyyy'
  );
  let activities = [];
  let isinIdx = findFirstIsinIndexInArray(flattendPages);
  while (isinIdx >= 0) {
    const activity = {
      broker: 'degiro',
      type: 'TransferIn',
      isin: flattendPages[isinIdx],
      company: flattendPages[isinIdx - 1],
      date,
      datetime,
      shares: parseGermanNum(flattendPages[isinIdx + 1]),
      price: parseGermanNum(flattendPages[isinIdx + 2]),
      amount: parseGermanNum(flattendPages[isinIdx + 4]),
      tax: 0,
      fee: 0,
    };
    if (validateActivity(activity)) {
      activities.push(activity);
    } else {
      return undefined;
    }

    isinIdx = findFirstIsinIndexInArray(flattendPages, isinIdx + 1);
  }
  return activities;
};

const getDocumentType = pdfPages => {
  if (pdfPages[0].some(line => line.startsWith('Kontoauszug von'))) {
    return 'AccountStatement';
  } else if (
    pdfPages[0].some(
      line =>
        line.startsWith('Transaktionsübersicht von') ||
        line.startsWith('Operazioni da')
    )
  ) {
    return 'TransactionLog';
  } else if (
    pdfPages[0].some(
      line =>
        line.startsWith('Portfolioübersicht') ||
        line.startsWith('Panoramica Portafoglio')
    )
  ) {
    return 'DepotOverview';
  }
};

export const canParseDocument = (pdfPages, extension) => {
  return (
    extension === 'pdf' &&
    pdfPages[0].some(line => allowedDegiroCountries.includes(line)) &&
    getDocumentType(pdfPages) !== undefined
  );
};

export const parsePages = pdfPages => {
  const documentType = getDocumentType(pdfPages);
  let activities;
  switch (documentType) {
    // This type of file contains Dividends and other information. Only dividends are processed. This is not implemented
    // yet as the dividends lack the information how many shares are in the account
    case 'AccountStatement':
      return {
        activities: [],
        status: 5,
      };

    // This type of file contains Buy and Sell operations
    case 'TransactionLog': {
      activities = parseTransactionLog(pdfPages);
      break;
    }

    case 'DepotOverview': {
      activities = parseDepotStatement(pdfPages);
      break;
    }
  }

  return {
    activities,
    status: activities === undefined ? 1 : 0,
  };
};
