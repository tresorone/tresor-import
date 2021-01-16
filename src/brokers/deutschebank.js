import { Big } from 'big.js';
import {
  createActivityDateTime,
  findFirstIsinIndexInArray,
  parseGermanNum,
  validateActivity,
  findNextLineIndexByRegex,
} from '@/helper';

const idStringLong =
  'Bitte beachten Sie auch unsere weiteren Erläuterungen zu diesem Report, die Sie auf beiliegender Anlage finden! Bei Fragen sprechen Sie bitte Ihren Berater an.';

/////////////////////////////////////////////////
// Transaction Log Functions
/////////////////////////////////////////////////

// Takes array of strings <transactionTypes> and returns the next occurrence of one of these strings in array <content>
const findNextIdx = (content, transactionTypes, offset = 0) => {
  Array.min = function (array) {
    return Math.min.apply(Math, array);
  };

  let idxArray = [];
  transactionTypes.forEach(type => {
    idxArray.push(content.slice(offset).indexOf(type));
  });
  const nextIdx = Array.min(idxArray.filter(lineNumber => lineNumber >= 0));
  return nextIdx !== Infinity ? nextIdx + offset : -1;
};

const parseTransactionLog = content => {
  const transactionTypes = ['Kauf'];
  let txIdx = 0;
  let activities = [];
  while (txIdx >= 0) {
    txIdx = findNextIdx(content, transactionTypes, txIdx + 1);
    switch (content[txIdx]) {
      // Buy
      case transactionTypes[0]: {
        const firstCurrencyIdx = findNextLineIndexByRegex(
          content,
          /^[A-Z]{3}$/,
          txIdx + 2
        );
        let activity = {
          broker: 'deutschebank',
          type: 'Buy',
          shares: parseGermanNum(content[txIdx + 1]),
          company: content.slice(txIdx + 2, firstCurrencyIdx - 1).join(' '),
          wkn: content[firstCurrencyIdx - 1],
          price: parseGermanNum(content[firstCurrencyIdx + 1]),
          amount: Math.abs(parseGermanNum(content[firstCurrencyIdx + 2])),
          tax: 0,
          fee: 0,
        };
        [activity.date, activity.datetime] = createActivityDateTime(
          content[txIdx - 3]
        );
        activity = validateActivity(activity);
        if (activity !== undefined) {
          activities.push(activity);
        } else {
          return undefined;
        }
        break;
      }
    }
  }
  return activities;
};

/////////////////////////////////////////////////
// Depot Status parsing
/////////////////////////////////////////////////
const parseDepotStatus = content => {
  let activities = [];
  let idx = findNextLineIndexByRegex(content, /^[A-Z0-9]{6}$/);
  const dateTimeLine = content[
    content.indexOf('Vermögensaufstellung Standard') + 4
  ].split(/\s+/);
  const [date, datetime] = createActivityDateTime(
    dateTimeLine[2],
    dateTimeLine[4]
  );
  while (idx >= 0) {
    if (/^[A-Z]{3}$/.test(content[idx + 1])) {
      let activity = {
        broker: 'deutschebank',
        type: 'TransferIn',
        date,
        datetime,
        wkn: content[idx],
        company: content[idx - 1],
        shares: parseGermanNum(content[idx - 2]),
        amount: parseGermanNum(content[idx + 3]),
        price: parseGermanNum(content[idx + 2]),
        tax: 0,
        fee: 0,
      };
      activity = validateActivity(activity);
      if (activity !== undefined) {
        activities.push(activity);
      } else {
        return undefined;
      }
    }
    idx = findNextLineIndexByRegex(content, /[A-Z0-9]{6}/, idx + 1);
  }
  return activities;
};

/////////////////////////////////////////////////
// Individual Transaction Functions
/////////////////////////////////////////////////
const findDividendIsin = content => {
  const isinIdx = content.indexOf('ISIN');
  if (isinIdx >= 0) {
    return content[findFirstIsinIndexInArray(content, isinIdx)];
  }
};

const findDividendWKN = content => {
  const isinIdx = content.indexOf('ISIN');
  if (isinIdx >= 0) {
    return content[findFirstIsinIndexInArray(content, isinIdx) + 1];
  }
};

const findDividendCompany = content => {
  const startCompany = content.indexOf('Stück') + 4;
  const endCompany = content.indexOf('Zahlbar') - 1;
  return content.slice(startCompany, endCompany).join(' ');
};

const findDividendDate = content => {
  const dateIdx = content.indexOf('Gutschrift');
  if (dateIdx >= 0) {
    return content[dateIdx - 1];
  }
};

const findDividendShares = content => {
  const sharesIdx = content.indexOf('Stück');
  if (sharesIdx >= 0) {
    return parseGermanNum(content[sharesIdx + 1]);
  }
};

const findDividendForeignInformation = content => {
  const foreignIdx = content.indexOf('Umrechnungskurs');
  if (foreignIdx >= 0) {
    const foreignCurrency = content[foreignIdx + 1].split(/\s+/)[0];
    const fxRate = parseGermanNum(content[foreignIdx - 1]);
    return [foreignCurrency, fxRate];
  }
  return [undefined, undefined];
};

const findDividendAmount = (content, fxRate) => {
  const amountIdx = content.indexOf('Bruttoertrag');
  if (amountIdx >= 0) {
    const offset = fxRate === undefined ? 1 : 2;
    return parseGermanNum(content[amountIdx - offset].split(/\s+/)[0]);
  }
};

const findDividendTax = (content, fxRate) => {
  let totalTax = Big(0);
  const offset = fxRate === undefined ? 1 : 2;
  const withholdingTaxIdx = content.indexOf('% Ausländische');
  if (withholdingTaxIdx >= 0) {
    totalTax = totalTax.plus(
      parseGermanNum(content[withholdingTaxIdx - offset - 1].split(/\s+/)[1])
    );
  }
  const solidarityTaxIdx = content.indexOf('Solidaritätszuschlag');
  if (solidarityTaxIdx >= 0) {
    totalTax = totalTax.plus(
      parseGermanNum(content[solidarityTaxIdx - offset].split(/\s+/)[1])
    );
  }
  const capitalIncomeTax = content.indexOf('Kapitalertragsteuer');
  if (capitalIncomeTax >= 0) {
    totalTax = totalTax.plus(
      parseGermanNum(content[capitalIncomeTax - offset].split(/\s+/)[1])
    );
  }
  return +totalTax;
};

const getDocumentType = content => {
  // It seems the pdf for Deutsche Bank Buy transactions can't be parsed by pdfjs (see case unsupported)
  if (
    content.includes('Dividendengutschrift') ||
    content.includes('Ertragsgutschrift')
  ) {
    return 'Dividend';
  } else if (content.includes('_itte überprüfen')) {
    return 'Unsupported';
  } else if (content.includes('Umsatzliste')) {
    return 'TransactionLog';
  } else if (content.includes('Vermögensaufstellung Standard')) {
    return 'DepotStatus';
  }
};

const parseDividend = (pagesFlat, activityType) => {
  let activity = {
    broker: 'deutschebank',
    type: activityType,
  };
  const [foreignCurrency, fxRate] = findDividendForeignInformation(pagesFlat);
  if (foreignCurrency !== undefined && fxRate !== undefined) {
    activity.foreignCurrency = foreignCurrency;
    activity.fxRate = fxRate;
  }
  activity.isin = findDividendIsin(pagesFlat);
  activity.wkn = findDividendWKN(pagesFlat);
  activity.company = findDividendCompany(pagesFlat);
  [activity.date, activity.datetime] = createActivityDateTime(
    findDividendDate(pagesFlat)
  );
  activity.shares = findDividendShares(pagesFlat);
  activity.amount = findDividendAmount(pagesFlat, activity.fxRate);
  activity.price = +Big(activity.amount).div(activity.shares);
  activity.fee = 0;
  activity.tax = findDividendTax(pagesFlat, activity.fxRate);
  return activity;
};

export const canParseDocument = (document, extension) => {
  const documentFlat = document.flat();
  // It seems the pdf for Deutsche Bank Buy transactions can't be parsed by pdfjs (_itte überprüfen)
  return (
    (extension === 'pdf' &&
      (documentFlat.includes('www.deutsche-bank.de') ||
        (documentFlat.includes(idStringLong) &&
          getDocumentType(documentFlat) !== undefined))) ||
    documentFlat.includes('_itte überprüfen')
  );
};

export const parsePages = pages => {
  const pagesFlat = pages.flat();
  const type = getDocumentType(pagesFlat);
  let activity;
  switch (type) {
    case 'Dividend': {
      activity = parseDividend(pagesFlat, type);
      break;
    }
    case 'TransactionLog': {
      const activities = parseTransactionLog(pagesFlat);
      if (activities !== undefined) {
        return {
          activities,
          status: 0,
        };
      }
      break;
    }
    case 'DepotStatus': {
      const activities = parseDepotStatus(pagesFlat);
      if (activities !== undefined) {
        return {
          activities,
          status: 0,
        };
      }
      break;
    }
    case 'Unsupported':
      return {
        activities: undefined,
        status: 7,
      };
    // Valid Document but no parsing could happen
    default:
      return {
        activities: undefined,
        status: 5,
      };
  }
  return {
    activities: [validateActivity(activity)],
    status: 0,
  };
};
