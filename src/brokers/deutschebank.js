import { Big } from 'big.js';
import {
  createActivityDateTime,
  findFirstIsinIndexInArray,
  parseGermanNum,
  validateActivity,
} from '@/helper';

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
  }
};

export const canParseDocument = (document, extension) => {
  const documentFlat = document.flat();
  // It seems the pdf for Deutsche Bank Buy transactions can't be parsed by pdfjs (_itte überprüfen)
  return (
    (extension === 'pdf' &&
      documentFlat.includes('www.deutsche-bank.de') &&
      getDocumentType(documentFlat) !== undefined) ||
    documentFlat.includes('_itte überprüfen')
  );
};

export const parsePages = pages => {
  const allPages = pages.flat();
  let activity = {
    broker: 'deutschebank',
    type: getDocumentType(allPages),
  };
  switch (activity.type) {
    case 'Unsupported':
      return {
        activity: undefined,
        status: 7,
      };
    case 'Dividend': {
      const [foreignCurrency, fxRate] = findDividendForeignInformation(
        allPages
      );
      if (foreignCurrency !== undefined && fxRate !== undefined) {
        activity.foreignCurrency = foreignCurrency;
        activity.fxRate = fxRate;
      }
      activity.isin = findDividendIsin(allPages);
      activity.wkn = findDividendWKN(allPages);
      activity.company = findDividendCompany(allPages);
      [activity.date, activity.datetime] = createActivityDateTime(
        findDividendDate(allPages)
      );
      activity.shares = findDividendShares(allPages);
      activity.amount = findDividendAmount(allPages, activity.fxRate);
      activity.price = +Big(activity.amount).div(activity.shares);
      activity.fee = 0;
      activity.tax = findDividendTax(allPages, activity.fxRate);
      break;
    }
    default:
      return {
        activity: undefined,
        status: 5,
      };
  }
  return {
    activities: [validateActivity(activity)],
    status: 0,
  };
};
