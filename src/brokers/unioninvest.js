import Big from 'big.js';
import {
  validateActivity,
  parseGermanNum,
  createActivityDateTime,
} from '../helper';
const dateRegex = /[0-9]{2}\.[0-9]{2}\.[0-9]{4}/;
const commaNumberRegex = /,[0-9]{2,}/;
const possibleActivities = [
  'Anlage',
  'Verkauf',
  'Ausschüttung',
  'Gesamtausschüttung',
  'Umschichtung',
  'Rückumschichtung',
  'Steuererstattung',
];

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

const findPriorRegexMatch = (arr, idx, regex = commaNumberRegex) => {
  let bckwrdIdx = 1;
  while (idx - bckwrdIdx >= 0) {
    if (regex.test(arr[idx - bckwrdIdx])) {
      return idx - bckwrdIdx;
    }
    bckwrdIdx += 1;
  }
  return -1;
};

// Find the first company that occurs BEFORE the id idx. Also requires the idx
// of the date of a transaction
const findCompany = (pdfPage, idx, dateIdx) => {
  // Its certainly a payout; payouts have to be treated differently sometimes
  if (dateIdx > idx && !/,[0-9]{2,}/.test(pdfPage[idx - 1])) {
    const companyIdx =
      findPriorRegexMatch(
        pdfPage,
        idx,
        /,[0-9]{2,}|Kauf ohne Ausgabeaufschlag/
      ) + 1;
    return pdfPage[companyIdx] + pdfPage.slice(companyIdx + 1, idx).join(' ');
  }
  //  The company name is in the subdepot header:
  else if (/(,[0-9]{2,})/.test(pdfPage[dateIdx - 1])) {
    const isinIdx = findPriorIdx(pdfPage, idx, ['ISIN:']);
    const companyStartIdx = findPriorIdx(pdfPage, isinIdx, ['Unterdepot-Nr.:']);
    const companyStartIdx2 = findPriorIdx(pdfPage, isinIdx, ['a.']);
    // If multiple companies are listed, the first company is preceeded by
    // 'Unterdepot-Nr.:, otherwise 'a.'
    if (companyStartIdx > companyStartIdx2) {
      return (
        pdfPage[companyStartIdx + 4] +
        pdfPage.slice(companyStartIdx + 5, isinIdx).join(' ')
      );
    } else {
      return (
        pdfPage[companyStartIdx2 + 1] +
        pdfPage.slice(companyStartIdx2 + 2, isinIdx).join(' ')
      );
    }
  }
  // Or it part of the transaction (If the subdepot contains multiple stocks)
  else {
    const companyIdx = findPriorRegexMatch(
      pdfPage,
      dateIdx,
      /^(,[0-9]{2,}|Mehrwertsteuer|UPR|\*1)$/
    );
    return (
      pdfPage[companyIdx + 1] + pdfPage.slice(companyIdx + 2, dateIdx).join(' ')
    );
  }
};

// Isins are only listed atop of the file for some unioninvest documents.
// Later on, only the company/fond name is used. Thus we need to create a dict
// storing these information
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

// For some dividends, the amount of shares in the depot for the company
// is only listed in the header above. So we have to make another dict, similar
// to the ISIN case
const createCompanySharesDict = (pdfPage, activityIdx) => {
  let companyAmountDict = {};
  let companyIdx = findPriorIdx(pdfPage, activityIdx, ['aufschlag %']) + 2;
  while (companyIdx > 0) {
    const companyEndIdx =
      pdfPage
        .slice(companyIdx)
        .findIndex(l => /vom [0-9]{2}\.[0-9]{2}\.[0-9]{4}/.test(l)) +
      companyIdx;
    const company =
      pdfPage[companyIdx] +
      pdfPage.slice(companyIdx + 1, companyEndIdx).join(' ');
    companyAmountDict[company] = parseGermanNum(
      pdfPage[companyEndIdx + 1] + pdfPage[companyEndIdx + 2]
    );
    const newCompanyIdx = pdfPage
      .slice(companyIdx)
      .findIndex(l => l === 'Vortrag');
    if (newCompanyIdx === -1 || newCompanyIdx - companyIdx > 10) {
      companyIdx = -1;
    } else {
      companyIdx = companyIdx + newCompanyIdx + 1;
    }
  }
  return companyAmountDict;
};

const findPayoutTax = (pdfPage, activityIdx) => {
  let tax = Big(0);
  const capitalTaxIdx = pdfPage.indexOf(
    'abgeführte Kapitalertragsteuer',
    activityIdx
  );
  if (capitalTaxIdx > -1 && pdfPage[capitalTaxIdx + 2].includes(',')) {
    tax = tax.plus(
      parseGermanNum(pdfPage[capitalTaxIdx + 1] + pdfPage[capitalTaxIdx + 2])
    );
  }
  const solidarityTaxIdx = pdfPage.indexOf(
    'inklusive Solidaritätszuschlag',
    activityIdx
  );
  if (solidarityTaxIdx > -1 && pdfPage[solidarityTaxIdx + 2].includes(',')) {
    tax = tax.plus(
      parseGermanNum(
        pdfPage[solidarityTaxIdx + 1] + pdfPage[solidarityTaxIdx + 2]
      )
    );
  }
  const churchTaxIdx = pdfPage.indexOf('abgeführte Kirchensteuer', activityIdx);
  if (churchTaxIdx > -1 && pdfPage[churchTaxIdx + 2].includes(',')) {
    tax = tax.plus(
      parseGermanNum(pdfPage[churchTaxIdx + 1] + pdfPage[churchTaxIdx + 2])
    );
  }
  return +tax.abs();
};

const parseBuySell = (
  pdfPage,
  activityIdx,
  type,
  isRedistribution = false,
  taxReinvest = false
) => {
  const dateIdx = findPriorRegexMatch(pdfPage, activityIdx, dateRegex) - 1;
  const companyIsinDict = createCompanyIsinDict(pdfPage);

  const [parsedDate, parsedDateTime] = createActivityDateTime(
    pdfPage[dateIdx],
    undefined
  );
  let infoOffset = type === 'Buy' ? 5 : -4;
  let amountOffset = isRedistribution ? -8 : 1;
  if (isRedistribution) {
    infoOffset = -4;
  }
  let activity = {
    broker: 'unioninvest',
    type: type,
    company: findCompany(pdfPage, activityIdx, dateIdx),
    date: parsedDate,
    datetime: parsedDateTime,
    amount: Math.abs(
      parseGermanNum(
        pdfPage[activityIdx + amountOffset] +
          pdfPage[activityIdx + amountOffset + 1]
      )
    ),
    price: parseGermanNum(
      pdfPage[activityIdx + infoOffset] + pdfPage[activityIdx + infoOffset + 1]
    ),
    shares: Math.abs(
      parseGermanNum(
        pdfPage[activityIdx + infoOffset + 2] +
          pdfPage[activityIdx + infoOffset + 3]
      )
    ),
    tax: 0,
    fee: 0,
  };

  if (taxReinvest) {
    activity.tax = +Big(activity.amount).times(-1);
  }
  activity.isin = companyIsinDict[activity.company];
  return [validateActivity(activity)];
};

const parseDiv = (pdfPage, activityIdx, dateIdx) => {
  const companySharesDict = createCompanySharesDict(pdfPage, activityIdx);
  const companyIsinDict = createCompanyIsinDict(pdfPage);

  // The documents from unioninvest didn't contains any order time
  const [date, datetime] = createActivityDateTime(pdfPage[dateIdx], undefined);

  let activity = {
    broker: 'unioninvest',
    type: 'Dividend',
    company: findCompany(pdfPage, activityIdx, dateIdx),
    date,
    datetime,
    amount: parseGermanNum(pdfPage[activityIdx + 3] + pdfPage[activityIdx + 4]),
    tax: findPayoutTax(pdfPage, activityIdx),
    fee: 0,
  };
  activity.shares = companySharesDict[activity.company];
  // Sometimes the #shares is handled differently for no apparent reason
  if (activity.shares === undefined) {
    activity.shares = parseGermanNum(
      pdfPage[activityIdx - 2] + pdfPage[activityIdx - 1]
    );
  }
  activity.isin = companyIsinDict[activity.company];
  activity.price = +Big(activity.amount).div(activity.shares);
  return activity;
};

const parseDivRebuy = (pdfPage, reinvestIdx, dividend) => {
  // We do this because otherwise the object would not be deep copied.
  let rebuy = JSON.parse(JSON.stringify(dividend));
  rebuy.type = 'Buy';
  rebuy.tax = 0;
  rebuy.fee = 0;
  rebuy.amount = parseGermanNum(
    pdfPage[reinvestIdx + 1] + pdfPage[reinvestIdx + 2]
  );
  rebuy.price = parseGermanNum(
    pdfPage[reinvestIdx + 5] + pdfPage[reinvestIdx + 6]
  );
  rebuy.shares = parseGermanNum(
    pdfPage[reinvestIdx + 7] + pdfPage[reinvestIdx + 8]
  );
  return rebuy;
};

const parseDividend = (pdfPage, activityIdx) => {
  let activities = [];
  const companyIsinDict = createCompanyIsinDict(pdfPage);
  const dateIdx =
    pdfPage.slice(activityIdx).findIndex(t => dateRegex.test(t)) + activityIdx;
  const dividend = parseDiv(pdfPage, activityIdx, dateIdx, companyIsinDict);
  activities.push(validateActivity(dividend));

  // The dividend was automatically reinvested, thus we need another buy
  if (pdfPage[dateIdx + 2] === 'Wiederanlage') {
    const rebuy = parseDivRebuy(pdfPage, dateIdx + 2, dividend);
    activities.push(validateActivity(rebuy));
  }
  return activities;
};

const parsePage = pdfPage => {
  let activities = [];
  let activityIdx = pdfPage.findIndex(line =>
    possibleActivities.includes(line)
  );
  let offsetNextActivity = 0;

  while (offsetNextActivity >= 0) {
    switch (pdfPage[activityIdx]) {
      // Buy Operation
      case possibleActivities[0]:
        activities = activities.concat(
          parseBuySell(pdfPage, activityIdx, 'Buy')
        );
        break;

      // Sell Operation
      case possibleActivities[1]:
        activities = activities.concat(
          parseBuySell(pdfPage, activityIdx, 'Sell')
        );
        break;

      // Dividend Transaction
      case possibleActivities[2]:
      case possibleActivities[3]:
        if (pdfPage[activityIdx + 1] !== 'sind') {
          activities = activities.concat(parseDividend(pdfPage, activityIdx));
        }
        break;

      // Redeployment Transaction
      case possibleActivities[4]:
      // Reverse redeployment with exactly the same logic as above
      // eslint-disable-next-line no-fallthrough
      case possibleActivities[5]:
        if (commaNumberRegex.test(pdfPage[activityIdx - 1])) {
          // Check if the number of shares is negative (Sell) or positive (Buy).
          // cant use parseGermanNum due to '-0'
          if (pdfPage[activityIdx - 2].startsWith('-')) {
            activities = activities.concat(
              parseBuySell(pdfPage, activityIdx, 'Sell', true)
            );
          } else {
            activities = activities.concat(
              parseBuySell(pdfPage, activityIdx, 'Buy', true)
            );
          }
        } else {
          console.error('(Reverse) Reeployment but no parsing was possible');
        }
        break;

      // Automatic Reinvest of a Tax Refund
      case possibleActivities[6]:
        if (pdfPage[activityIdx - 1] === 'Wiederanlage') {
          activities = activities.concat(
            parseBuySell(pdfPage, activityIdx, 'Buy', false, true)
          );
        }
        break;
    }
    offsetNextActivity = pdfPage
      .slice(activityIdx + 1)
      .findIndex(line => possibleActivities.includes(line));
    activityIdx = offsetNextActivity + activityIdx + 1;
  }
  return activities;
};

export const canParseDocument = (pages, extension) => {
  const firstPageContent = pages[0];
  return (
    extension === 'pdf' &&
    firstPageContent.some(line =>
      line.includes(
        'Union Investment Service Bank AG · 60621 Frankfurt am Main'
      )
    )
  );
};

export const parsePages = pdfPages => {
  let activities = [];
  for (const pdfPage of pdfPages) {
    // This is an explanatory pdf page which guides through the nomenclature
    // and contains no transactions.
    if (
      pdfPage[0].startsWith(
        'Sämtliche Umsätze in Ihrem UnionDepot dokumentieren'
      )
    ) {
      continue;
    }
    activities = activities.concat(parsePage(pdfPage));
  }
  return {
    activities,
    status: 0,
  };
};
