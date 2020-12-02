import { Big } from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
} from '@/helper';
import * as onvista from './onvista';

const findTax = textArr => {
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
  const churchTaxIndex = textArr.findIndex(t => t.includes('Kirchensteuer'));
  if (solidarityTaxIndex > 0) {
    completeTax = completeTax.plus(parseGermanNum(textArr[churchTaxIndex + 2]));
  }
  const witholdingTaxIndex = textArr.findIndex(t =>
    t.includes('-Quellensteuer')
  );
  if (witholdingTaxIndex > 0) {
    completeTax = completeTax.plus(
      parseGermanNum(textArr[witholdingTaxIndex + 5])
    );
  }
  return +completeTax;
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

const findPayout = textArr => {
  let payoutIndex = textArr.indexOf('Steuerpflichtiger Ausschüttungsbetrag');
  if (payoutIndex < 0) {
    payoutIndex = textArr.indexOf('ausländische Dividende');
  }
  return parseGermanNum(textArr[payoutIndex + 2]);
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
  let type, amount, date, time, price;
  let tax = 0;
  let fee = 0;

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
    tax = findTax(textArr);
  } else if (onvista.isDividend(textArr)) {
    type = 'Dividend';
    amount = findPayout(textArr);
    date = onvista.findDateDividend(textArr);
    price = +Big(amount).div(shares);
    tax = findTax(textArr);
  }

  const [parsedDate, parsedDateTime] = createActivityDateTime(date, time);

  return validateActivity({
    broker: broker,
    type: type,
    shares: shares,
    date: parsedDate,
    datetime: parsedDateTime,
    isin: isin,
    company: company,
    price: price,
    amount: amount,
    tax: tax,
    fee: fee,
  });
};

export const parsePages = contents => {
  const activities = [];
  for (let c of contents) {
    try {
      activities.push(parseData(c));
    } catch (e) {
      console.error('Error while parsing page (smartbroker)', e, c);
    }
  }

  return {
    activities,
    status: 0,
  };
};
