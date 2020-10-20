import { Big } from 'big.js';
import { parseGermanNum, validateActivity } from '@/helper';
import * as onvista from './onvista'

export const smartbrokerIdentificationString = 'Landsberger Straße 300';

const findPayout = textArr => {
  let payoutIndex = textArr.indexOf('Steuerpflichtiger Ausschüttungsbetrag');
  if (payoutIndex < 0) {
    payoutIndex = textArr.indexOf('ausländische Dividende');
  }
  return parseGermanNum(textArr[payoutIndex+2]);
}

export const canParsePage = (content, extension) =>
  extension === 'pdf' && content.some(line => line.includes(smartbrokerIdentificationString)) && (onvista.isBuy(content) || onvista.isDividend(content));


const parseData = textArr => {

  let activity;
  const broker = 'smartbroker'
  const shares = onvista.findShares(textArr);
  const isin = onvista.findISIN(textArr);
  const company = onvista.findCompany(textArr);
  let type, amount, date, price;
  let tax = 0;
  let fee = 0;

  if (onvista.isBuy(textArr)) {
    type = 'Buy';
    amount = onvista.findAmount(textArr);
    date = onvista.findDateBuySell(textArr);
    price = onvista.findPrice(textArr);
    fee = onvista.findFee(textArr);

  }
  else if (onvista.isSell(textArr)) {
    type = 'Buy';
    amount = onvista.findAmount(textArr);
    date = onvista.findDateBuySell(textArr);
    price = onvista.findPrice(textArr);
    tax = onvista.findTax(textArr);
    fee = onvista.findFee(textArr);

  }
  else if (onvista.isDividend(textArr)) {
    type = 'Dividend'
    amount = findPayout(textArr);
    date = onvista.findDateDividend(textArr);
    price = +Big(amount).div(shares)
    tax = onvista.findTax(textArr);
  }

  activity = {
    broker: broker,
    type: type,
    shares: shares,
    date: date,
    isin: isin,
    company: company,
    price: price,
    amount: amount,
    tax: tax,
    fee: fee,

  }
  return validateActivity(activity);
};

export const parsePages = contents => {
  // parse first page has activity data
  const activities = [parseData(contents[0])];

  return {
    activities,
    status: 0,
  };
};
