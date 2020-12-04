import Big from 'big.js';
import {
  validateActivity,
  parseGermanNum,
  createActivityDateTime,
} from '../helper';

export const canParsePage = (pdfPage, extension) => {
  return (
    extension === 'pdf' &&
    pdfPage.some(line =>
      line.includes(
        'Union Investment Service Bank AG · 60621 Frankfurt am Main'
      )
    )
  );
};

// Find the first company that occurs BEFORE the id idx. Also requires the idx
// of the date of a transaction
const transactionFindCompany = (pdfPage, idx, dateIdx) => {
  const companyIdx = findPriorRegexMatch(pdfPage, idx) + 1;
  let company;
  // Either the company name is in the subdepot header. This is the case if
  // there is only one kind of stock in the same subdepot (my guess at least)
  if (/,[0-9]{2,}/.test(pdfPage[dateIdx - 1])) {
    const isinIdx = findPriorIdx(pdfPage, idx, ['ISIN:']);
    const companyStartIdx = findPriorIdx(pdfPage, isinIdx, ['Unterdepot-Nr.:']);
    const companyStartIdx2 = findPriorIdx(pdfPage, isinIdx, ['a.']);
    // If multiple companies are listed, the first company is preceeded by
    // 'Unterdepot-Nr.:, otherwise 'a.'
    if (companyStartIdx > companyStartIdx2) {
      company =
        pdfPage[companyStartIdx + 4] +
        pdfPage.slice(companyStartIdx + 5, isinIdx).join(' ');
    } else {
      company =
        pdfPage[companyStartIdx2 + 1] +
        pdfPage.slice(companyStartIdx2 + 2, isinIdx).join(' ');
    }
  }
  // Or it part of the transaction (If the subdepot contains multiple stocks)
  else {
    company =
      pdfPage[companyIdx] + pdfPage.slice(companyIdx + 1, dateIdx).join(' ');
  }
  return company;
};

const findPriorIdx = (arr, idx, keyArr = ['STK', '/ Sperre']) => {
  let bckwrdIdx = 1;
  while (idx - bckwrdIdx >= 0) {
    if (keyArr.includes(arr[idx - bckwrdIdx])) {
      return idx - bckwrdIdx;
    }
    bckwrdIdx += 1;
  }
  return -1;
};

const findPriorRegexMatch = (arr, idx, regex = /,[0-9]{2,}/) => {
  let bckwrdIdx = 1;
  while (idx - bckwrdIdx >= 0) {
    if (regex.test(arr[idx - bckwrdIdx])) {
      return idx - bckwrdIdx;
    }
    bckwrdIdx += 1;
  }
  return -1;
};

// Isins are only listed atop of the file for some unioninvest documents.
// Later on, only the company/fond name is used. Thus we need to generate them first of all.
const createCompanyIsinDict = pdfPage => {
  let companyIsinDict = {};
  let isinIdx = pdfPage.indexOf('ISIN:');
  let lastIsinIdx = -1;
  // in all following cases the company name is preceeded by the a. from "p. a."

  while (isinIdx < pdfPage.length && isinIdx >= 0) {
    // In case its the first ISIN of a sub-depot
    let company;
    let companyStartIdx = findPriorIdx(pdfPage, isinIdx, ['Unterdepot-Nr.:']);
    let companyStartIdx2 = findPriorIdx(pdfPage, isinIdx, ['a.']);
    if (companyStartIdx >= lastIsinIdx) {
      company =
        pdfPage[companyStartIdx + 4] +
        pdfPage.slice(companyStartIdx + 5, isinIdx).join(' ');
    } else if (companyStartIdx2 >= lastIsinIdx) {
      company =
        pdfPage[companyStartIdx2 + 1] +
        pdfPage.slice(companyStartIdx2 + 2, isinIdx).join(' ');
    } else {
      // In this case another ISIN was found but no company name could be parsed
      console.error(
        'ISIN without company name found, bug in parsers encountered'
      );
    }
    companyIsinDict[company] = pdfPage[isinIdx + 1];
    lastIsinIdx = isinIdx;
    isinIdx += 1;
    isinIdx = pdfPage.indexOf('ISIN:', isinIdx);
  }
  return companyIsinDict;
};

const findPayoutTax = (pdfPage, activityIdx, churchTaxIdx) => {
  let tax = Big(0);
  const capitalTaxIdx = pdfPage.indexOf(
    'abgeführte Kapitalertragsteuer',
    activityIdx
  );
  if (pdfPage[capitalTaxIdx + 2].includes(',')) {
    tax = tax.plus(
      parseGermanNum(pdfPage[capitalTaxIdx + 1] + pdfPage[capitalTaxIdx + 2])
    );
  }
  const solidarityTaxIdx = pdfPage.indexOf(
    'inklusive Solidaritätszuschlag',
    activityIdx
  );
  if (pdfPage[solidarityTaxIdx + 2].includes(',')) {
    tax = tax.plus(
      parseGermanNum(
        pdfPage[solidarityTaxIdx + 1] + pdfPage[solidarityTaxIdx + 2]
      )
    );
  }
  if (pdfPage[churchTaxIdx + 2].includes(',')) {
    tax = tax.plus(
      parseGermanNum(pdfPage[churchTaxIdx + 1] + pdfPage[churchTaxIdx + 2])
    );
  }
  return +tax.abs();
};

const parseBuy = (pdfPage, activityIdx, companyIsinDict) => {
  const dateIdx =
    findPriorRegexMatch(pdfPage, activityIdx, /[0-9]{2}\.[0-9]{2}\.[0-9]{4}/) -
    1;
  const company = transactionFindCompany(pdfPage, activityIdx, dateIdx);

  // The documents from unioninvest didn't contains any order time
  const [parsedDate, parsedDateTime] = createActivityDateTime(
    pdfPage[dateIdx],
    undefined
  );

  const activity = {
    broker: 'unioninvest',
    type: 'Buy',
    company,
    isin: companyIsinDict[company],
    date: parsedDate,
    datetime: parsedDateTime,
    amount: parseGermanNum(pdfPage[activityIdx + 1] + pdfPage[activityIdx + 2]),
    price: parseGermanNum(pdfPage[activityIdx + 5] + pdfPage[activityIdx + 6]),
    shares: parseGermanNum(pdfPage[activityIdx + 7] + pdfPage[activityIdx + 8]),
    tax: 0,
    fee: 0,
  };
  return [validateActivity(activity)];
};

const parseDividend = (pdfPage, activityIdx, companyIsinDict) => {
  let activities = [];
  // The curchTaxIdx is an important index to parse information
  const churchTaxIdx = pdfPage.indexOf('abgeführte Kirchensteuer', activityIdx);
  const dateIdx = pdfPage[churchTaxIdx + 2].includes(',')
    ? churchTaxIdx + 3
    : churchTaxIdx + 1;
  const date = pdfPage[dateIdx];
  const company = transactionFindCompany(pdfPage, activityIdx, dateIdx);
  const amount = parseGermanNum(
    pdfPage[activityIdx + 3] + pdfPage[activityIdx + 4]
  );
  const shares = parseGermanNum(
    pdfPage[activityIdx - 2] + pdfPage[activityIdx - 1]
  );

  // The documents from unioninvest didn't contains any order time
  const [parsedDate, parsedDateTime] = createActivityDateTime(date, undefined);

  const activity = {
    broker: 'unioninvest',
    type: 'Dividend',
    company,
    isin: companyIsinDict[company],
    date: parsedDate,
    datetime: parsedDateTime,
    // Thee amount of the payout per share is not explicitely given, thus it has to be calculated
    amount,
    shares,
    price: +Big(amount).div(shares),
    tax: findPayoutTax(pdfPage, activityIdx, churchTaxIdx),
    fee: 0,
  };
  activities.push(validateActivity(activity));

  // The dividend was automatically reinvested, thus we need another buy
  // operation.

  const reinvestIdx = pdfPage.indexOf('Wiederanlage', churchTaxIdx);
  if (reinvestIdx - churchTaxIdx < 6) {
    activities.push(
      validateActivity({
        broker: 'unioninvest',
        type: 'Buy',
        company,
        isin: companyIsinDict[company],
        date: parsedDate,
        datetime: parsedDateTime,
        amount: parseGermanNum(
          pdfPage[reinvestIdx + 1] + pdfPage[reinvestIdx + 2]
        ),
        price: parseGermanNum(
          pdfPage[reinvestIdx + 5] + pdfPage[reinvestIdx + 6]
        ),
        shares: parseGermanNum(
          pdfPage[reinvestIdx + 7] + pdfPage[reinvestIdx + 8]
        ),
        tax: 0,
        fee: 0,
      })
    );
  }
  return activities;
};

const parsePage = pdfPage => {
  const possibleActivities = ['Anlage', 'Ausschüttung'];
  const companyIsinDict = createCompanyIsinDict(pdfPage);
  let activities = [];
  let slicedArray = pdfPage;
  let activityIdx = slicedArray.findIndex(line =>
    possibleActivities.includes(line)
  );
  while (activityIdx <= slicedArray.length && activityIdx > 0) {
    if (slicedArray[activityIdx] === 'Anlage') {
      activities = activities.concat(
        parseBuy(slicedArray, activityIdx, companyIsinDict)
      );
    } else if (
      slicedArray[activityIdx] === 'Ausschüttung' &&
      slicedArray[activityIdx + 1] !== 'sind'
    ) {
      activities = activities.concat(
        parseDividend(slicedArray, activityIdx, companyIsinDict)
      );
    }
    slicedArray = slicedArray.slice(activityIdx + 1);
    activityIdx = slicedArray.findIndex(line =>
      possibleActivities.includes(line)
    );
  }
  return activities;
};

export const parsePages = pdfPages => {
  let activities = [];
  for (const pdfPage of pdfPages) {
    activities = activities.concat(parsePage(pdfPage));
  }

  return {
    activities,
    status: 0,
  };
};
