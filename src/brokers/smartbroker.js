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

const findPriceDividend = ( content ) => {
  let priceIdx = content.indexOf('Dividenden-Betrag pro Stück');
  if ( priceIdx < 0 ) {
    priceIdx = content.indexOf('Ausschüttungsbetrag pro Stück');
  }
  if ( priceIdx >= 0 ) {
    return parseGermanNum(content[priceIdx + 1].split(/\s+/)[1]);
  }
}

const findOrderTime = content => {
  // Extract the time after the line with Handelszeit which contains "17:33*"
  const searchTerm = 'Handelszeit';
  const lineNumber = content.findIndex(t => t.includes(searchTerm));

  if (lineNumber < 0) {
    return undefined;
  }

  return content[lineNumber + 1].trim().substr(0, 5);
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
    canParsePage(firstPageContent)
  );
};

const parseData = textArr => {
  const broker = 'smartbroker';
  const shares = onvista.findShares(textArr);
  const isin = onvista.findISIN(textArr);
  const company = onvista.findCompany(textArr);
  let type, amount, date, time, price, fxRate, foreignCurrency;
  let tax = 0;
  let fee = 0;

  [fxRate, foreignCurrency] = findFxRateAndForeignCurrency(textArr);

  if (onvista.isBuy(textArr)) {
    type = 'Buy';
    amount = onvista.findAmount(textArr);
    date = onvista.findDateBuySell(textArr);
    time = findOrderTime(textArr);
    price = onvista.findPrice(textArr);
    fee = onvista.findFee(textArr);
  } else if (onvista.isSell(textArr)) {
    type = 'Sell';
    amount = onvista.findAmount(textArr);
    date = onvista.findDateBuySell(textArr);
    time = findOrderTime(textArr);
    price = onvista.findPrice(textArr);
    tax = findTax(textArr, fxRate);
  } else if (onvista.isDividend(textArr)) {
    type = 'Dividend';
    tax = findTax(textArr, fxRate);
    price = fxRate === undefined ? findPriceDividend(textArr) : +Big(findPriceDividend(textArr)).div(fxRate);
    amount = +Big(price).times(shares);
    date = onvista.findDateDividend(textArr);
  }

  const [parsedDate, parsedDateTime] = createActivityDateTime(date, time);

  let activity = {
    broker,
    type,
    shares,
    date: parsedDate,
    datetime: parsedDateTime,
    isin,
    company,
    price,
    amount,
    tax,
    fee,
  };

  if (fxRate !== undefined) {
    activity.fxRate = fxRate;
  }

  if (foreignCurrency !== undefined) {
    activity.foreignCurrency = foreignCurrency;
  }
  return validateActivity(activity);
};

export const parsePages = contents => {
  const activities = [];
  for (let content of contents) {
    if (canParsePage(content)) {
      activities.push(parseData(content));
    }
  }

  return {
    activities,
    status: 0,
  };
};
