import { Big } from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
} from '@/helper';
import * as onvista from './onvista';

const findTax = (textArr, fxRate) => {
  let completeTax = Big(0);

  const capitalTaxIndex = textArr.findIndex(t =>
    t.includes('Kapitalertragsteuer')
  );
  if (capitalTaxIndex > 0) {
    completeTax = completeTax.plus(
      parseGermanNum(textArr[capitalTaxIndex + 2])
    );
  }

  const solidarityTaxIndex = textArr.findIndex(t =>
    t.includes('Solidaritätszuschlag')
  );
  if (solidarityTaxIndex > 0) {
    completeTax = completeTax.plus(
      parseGermanNum(textArr[solidarityTaxIndex + 2])
    );
  }

  const churchTaxIndex = textArr.findIndex(
    line =>
      line.includes('Kirchensteuer') && !line.includes('Kapitalertragsteuer')
  );
  if (churchTaxIndex > 0) {
    completeTax = completeTax.plus(parseGermanNum(textArr[churchTaxIndex + 2]));
  }

  const witholdingTaxIndex = textArr.findIndex(
    line =>
      line.includes('-Quellensteuer') ||
      line.includes('ausländische Quellensteuer')
  );

  if (witholdingTaxIndex > 0) {
    const taxLine = textArr[witholdingTaxIndex + 2];
    let amount = Big(parseGermanNum(taxLine));
    if (fxRate !== undefined) {
      amount = amount.div(fxRate);
    }

    completeTax = completeTax.plus(amount);
  }

  return +completeTax;
};

const findFxRateAndForeignCurrency = content => {
  const fxRateLineNumber = content.findIndex(line =>
    line.includes('Devisenkurs')
  );

  if (fxRateLineNumber <= 0) {
    return [undefined, undefined];
  }

  const regex = /[A-Z]\/([A-Z]{3}) ([0-9,]+)/;
  const lineContent = content[fxRateLineNumber];

  let regexMatch;
  if (!lineContent.includes(' ')) {
    // Handle format no. 1:
    // Devisenkurs
    // EUR/USD 1,1821
    regexMatch = regex.exec(content[fxRateLineNumber + 1]);
  } else {
    // Handle fromat no. 2:
    // Devisenkurs: EUR/USD 1,1906
    regexMatch = regex.exec(lineContent);
  }

  if (regexMatch === null) {
    return [undefined, undefined];
  }

  return [parseGermanNum(regexMatch[2]), regexMatch[1]];
};

const findPriceDividend = content => {
  let priceIdx = content.indexOf('Dividenden-Betrag pro Stück');
  if (priceIdx < 0) {
    priceIdx = content.indexOf('Ausschüttungsbetrag pro Stück');
  }
  if (priceIdx >= 0) {
    return parseGermanNum(content[priceIdx + 1].split(/\s+/)[1]);
  }
};

const findOrderTime = content => {
  // Extract the time after the line with Handelszeit which contains "17:33*"
  const searchTerm = 'Handelszeit';
  const lineNumber = content.findIndex(t => t.includes(searchTerm));

  if (lineNumber < 0) {
    return undefined;
  }

  return content[lineNumber + 1].trim().substr(0, 5);
};

const detectedButIgnoredDocument = content => {
  return content.includes('Kostendarstellung');
};

const canParsePage = content =>
  onvista.isBuy(content) ||
  onvista.isSell(content) ||
  onvista.isDividend(content);

export const canParseDocument = (pages, extension) => {
  const firstPageContent = pages[0];
  return (
    extension === 'pdf' &&
    firstPageContent.some(line =>
      line.includes(onvista.smartbrokerIdentificationString)
    ) &&
    (canParsePage(firstPageContent) ||
      detectedButIgnoredDocument(firstPageContent))
  );
};

const parseBuySellDividend = pdfPages => {
  const textArr = pdfPages.flat();
  let activity = {
    broker: 'smartbroker',
    shares: onvista.findShares(textArr),
    isin: onvista.findISIN(textArr),
    company: onvista.findCompany(textArr),
    tax: 0,
    fee: 0,
  };
  const [fxRate, foreignCurrency] = findFxRateAndForeignCurrency(textArr);
  let date, time;

  if (onvista.isBuy(textArr)) {
    activity.type = 'Buy';
    activity.amount = onvista.findAmount(textArr);
    activity.price = onvista.findPrice(textArr);
    activity.fee = onvista.findFee(textArr);

    date = onvista.findDateBuySell(textArr);
    time = findOrderTime(textArr);
  } else if (onvista.isSell(textArr)) {
    activity.type = 'Sell';
    activity.amount = onvista.findAmount(textArr);
    activity.price = onvista.findPrice(textArr);
    activity.tax = findTax(textArr, fxRate);

    date = onvista.findDateBuySell(textArr);
    time = findOrderTime(textArr);
  } else if (onvista.isDividend(textArr)) {
    activity.type = 'Dividend';
    activity.tax = findTax(textArr, fxRate);
    activity.price =
      fxRate === undefined
        ? findPriceDividend(textArr)
        : +Big(findPriceDividend(textArr)).div(fxRate);
    activity.amount = +Big(activity.price).times(activity.shares);

    date = onvista.findDateDividend(textArr);
  }

  [activity.date, activity.datetime] = createActivityDateTime(date, time);

  if (fxRate !== undefined) {
    activity.fxRate = fxRate;
  }

  if (foreignCurrency !== undefined) {
    activity.foreignCurrency = foreignCurrency;
  }
  return [validateActivity(activity)];
};

export const parsePages = pdfPages => {
  if (detectedButIgnoredDocument(pdfPages[0])) {
    return {
      activities: undefined,
      status: 7,
    };
  }
  const activities = parseBuySellDividend(pdfPages);
  if (activities !== undefined) {
    return {
      activities,
      status: 0,
    };
  }
  return {
    activities: undefined,
    status: 5,
  };
};
