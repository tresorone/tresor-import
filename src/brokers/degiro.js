import Big from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
  isinRegex,
  findFirstIsinIndexInArray,
} from '@/helper';

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
  // Is it possible that the transaction logs contains dividends?

  let totalOffset = offset;
  const isinIdx =
    content.slice(index).findIndex(line => isinRegex.test(line)) + index;
  const company = content.slice(index + 2, isinIdx).join(' ');
  const isin = content[isinIdx];
  const shares = Big(numberParser(content[isinIdx + 2 + offset]));
  if (+shares === 0) {
    throw new zeroSharesTransaction(
      'Transaction with ISIN ' + isin + ' has no shares.'
    );
  }
  const amount = Big(numberParser(content[isinIdx + 8])).abs();
  // There is the case where the amount is 0, might be a transfer out or a knockout certificate
  const currency = content[isinIdx + 3 + offset * 2];
  const baseCurrency = content[isinIdx + 7 + offset * 2];

  let fxRate = undefined;
  if (currency !== baseCurrency) {
    fxRate = numberParser(content[isinIdx + 9 + offset]);
    // For foreign currency we need to go one line ahead for the following fields.
    totalOffset = 1;
  } else {
    totalOffset = 0;
  }

  const type = shares > 0 ? 'Buy' : 'Sell';
  const price = amount.div(shares.abs());
  let tax = 0;
  let fee = 0;
  if (type === 'Buy') {
    fee = Math.abs(numberParser(content[isinIdx + totalOffset + 10]));
  } else if (type === 'Sell') {
    tax = Math.abs(numberParser(content[isinIdx + totalOffset + 10]));
  }

  const [parsedDate, parsedDateTime] = createActivityDateTime(
    content[index],
    content[index + 1],
    'dd-MM-yyyy',
    'dd-MM-yyyy HH:mm'
  );

  const activity = {
    broker: 'degiro',
    date: parsedDate,
    datetime: parsedDateTime,
    company,
    isin,
    shares: +shares.abs(),
    amount: +amount,
    type,
    price: +price,
    fee,
    tax,
  };

  if (fxRate !== undefined) {
    activity.fxRate = fxRate;
  }

  if (currency !== baseCurrency) {
    activity.foreignCurrency = currency;
  }
  return validateActivity(activity);
};

const parseTransactionLog = pdfPages => {
  let activities = [];
  // Set another parser if foreign Degiros such as degiro.ch come into place, they will have other number formats.
  const numberParser = parseGermanNum;
  // Sometimes a reference exchange is given which causes an offset of 1
  let offset = 0;
  if (pdfPages.flat().includes('Ausführungso')) {
    offset += 1;
  }
  for (let content of pdfPages) {
    let transactionIndex = content.indexOf('Gesamt') + 1;
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
      flattendPages.findIndex(line =>
        line.startsWith('Portfolioübersicht per ')
      )
    ];
  const [date, datetime] = createActivityDateTime(
    dateline.split(/\s+/)[2],
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
    pdfPages[0].some(line => line.startsWith('Transaktionsübersicht von'))
  ) {
    return 'TransactionLog';
  } else if (pdfPages[0].some(line => line.startsWith('Portfolioübersicht'))) {
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
