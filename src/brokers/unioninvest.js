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

const parseBuy = (pdfPage, activityIdx, vortragIdx) => {
  const isinIdx = pdfPage.indexOf('ISIN:', activityIdx);
  const companyIdx = pdfPage.indexOf('Fonds:', activityIdx) + 1;

  // The documents from unioninvest didn't contains any order time
  const [parsedDate, parsedDateTime] = createActivityDateTime(
    pdfPage[vortragIdx + 4],
    undefined
  );

  return [
    validateActivity({
      broker: 'unioninvest',
      type: 'Buy',
      company:
        pdfPage[companyIdx] + pdfPage.slice(companyIdx + 1, isinIdx).join(' '),
      isin: pdfPage[isinIdx + 1],
      date: parsedDate,
      datetime: parsedDateTime,
      amount: parseGermanNum(
        pdfPage[vortragIdx + 10] + pdfPage[vortragIdx + 11]
      ),
      price: parseGermanNum(
        pdfPage[vortragIdx + 14] + pdfPage[vortragIdx + 15]
      ),
      shares: parseGermanNum(
        pdfPage[vortragIdx + 16] + pdfPage[vortragIdx + 17]
      ),
      tax: 0,
      fee: 0,
    }),
  ];
};

const parseDividend = (pdfPage, activityIdx, vortragIdx) => {
  let activities = [];
  // The curchTaxIdx is an important index to parse information
  const churchTaxIdx = pdfPage.indexOf('abgeführte Kirchensteuer', activityIdx);
  const isinIdx = pdfPage.indexOf('ISIN:', activityIdx);
  const companyIdx = pdfPage.indexOf('Fonds:', activityIdx) + 1;
  const company =
    pdfPage[companyIdx] + pdfPage.slice(companyIdx + 1, isinIdx).join(' ');
  const date = findPayoutDate(pdfPage, churchTaxIdx);
  const isin = pdfPage[isinIdx + 1];
  const amount = parseGermanNum(
    pdfPage[vortragIdx + 7] + pdfPage[vortragIdx + 8]
  );
  const shares = parseGermanNum(
    pdfPage[vortragIdx + 2] + pdfPage[vortragIdx + 3]
  );

  // The documents from unioninvest didn't contains any order time
  const [parsedDate, parsedDateTime] = createActivityDateTime(date, undefined);

  activities.push(
    validateActivity({
      broker: 'unioninvest',
      type: 'Dividend',
      company,
      isin,
      date: parsedDate,
      datetime: parsedDateTime,
      // Thee amount of the payout per share is not explicitely given, thus it has to be calculated
      amount,
      shares,
      price: +Big(amount).div(shares),
      tax: findPayoutTax(pdfPage, activityIdx, churchTaxIdx),
      fee: 0,
    })
  );

  // The dividend was automatically reinvested, thus we need another buy
  // operation.

  const reinvestIdx = pdfPage.indexOf('Wiederanlage', churchTaxIdx);
  if (reinvestIdx - churchTaxIdx < 6) {
    activities.push(
      validateActivity({
        broker: 'unioninvest',
        type: 'Buy',
        company,
        isin,
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

const findPayoutDate = (pdfPage, churchTaxIdx) => {
  return pdfPage[churchTaxIdx + 2].includes(',')
    ? pdfPage[churchTaxIdx + 4]
    : pdfPage[churchTaxIdx + 2];
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

const parsePage = pdfPage => {
  let activityIdx = -1;
  let activities = [];
  while (activityIdx <= pdfPage.length) {
    // Every position has its own sub-depot, new buys are listed there
    activityIdx = pdfPage.indexOf('Unterdepot-Nr.:', activityIdx + 1);
    if (activityIdx < 0) {
      return activities;
    }
    if (activityIdx >= 0) {
      let currentActivities;
      const vortragIdx = pdfPage.indexOf('Vortrag', activityIdx);

      // Good old buy activity
      if (vortragIdx >= 0 && pdfPage[vortragIdx + 8] === 'Kauf') {
        currentActivities = parseBuy(pdfPage, activityIdx, vortragIdx);
      }

      // Dividend activity
      else if (vortragIdx >= 0 && pdfPage[vortragIdx + 4] === 'Ausschüttung') {
        currentActivities = parseDividend(pdfPage, activityIdx, vortragIdx);
      }
      activities = activities.concat(currentActivities);
    }
  }
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
