import { Big } from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
} from '@/helper';
import * as onvista from './onvista';

const findTax = (textArr, fxRate) => {
  let completeTax = Big(0);
  let witholdingTax = 0;

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
    witholdingTax = +amount;
  }

  return [+completeTax, witholdingTax];
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

const findPayout = content => {
  let payoutIndex = content.indexOf('Steuerpflichtiger Ausschüttungsbetrag');
  if (payoutIndex < 0) {
    payoutIndex = content.indexOf('ausländische Dividende');
  }

  return parseGermanNum(content[payoutIndex + 2]);
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

export const canParsePage = (content, extension) =>
  extension === 'pdf' &&
  content.some(line =>
    line.includes(onvista.smartbrokerIdentificationString)
  ) &&
  (onvista.isBuy(content) ||
    onvista.isSell(content) ||
    onvista.isDividend(content));

const parseData = textArr => {
  const broker = 'smartbroker';
  const shares = onvista.findShares(textArr);
  const isin = onvista.findISIN(textArr);
  const company = onvista.findCompany(textArr);
  let type, amount, date, time, price, fxRate, foreignCurrency;
  let tax = 0;
  let witholdingTax = 0;
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
    [tax, witholdingTax] = findTax(textArr, fxRate);
  } else if (onvista.isDividend(textArr)) {
    type = 'Dividend';
    [tax, witholdingTax] = findTax(textArr, fxRate);
    // Add the witholding tax to the amount to get the total gross value
    amount = +Big(findPayout(textArr)).plus(witholdingTax);
    date = onvista.findDateDividend(textArr);
    price = +Big(amount).div(shares);
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
    try {
      activities.push(parseData(content));
    } catch (error) {
      console.error('Error while parsing page (smartbroker)', error, content);
    }
  }

  return {
    activities,
    status: 0,
  };
};
