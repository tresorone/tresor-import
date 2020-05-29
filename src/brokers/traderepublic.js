import format from 'date-fns/format';
import parse from 'date-fns/parse';
import every from 'lodash/every';
import values from 'lodash/values';
import Big from 'big.js';

const parseGermanNum = n => {
  return parseFloat(n.replace(/\./g, '').replace(',', '.'));
};

const findISIN = text => {
  if (text.some(t => t.includes('ISIN:'))) {
    // Newer PDFs from traderepublic do contain an explicit "ISIN" string
    const isinLine = text[text.findIndex(t => t.includes('ISIN:'))];
    const isin = isinLine.substr(isinLine.length - 12);
    return isin;
  } else {
    // Older PDFs from traderepublic do not contain an explicit "ISIN" string, here we look up the
    // ISIN value by referencing it from the "shares" index.
    const isinLine = text[text.findIndex(t => t.includes('Stk.')) - 1];
    return isinLine;
  }
};

const findCompany = text => {
  const companyLine = text[text.findIndex(t => t.includes('BETRAG')) + 1];
  return companyLine;
};

const findDateSingleBuy = textArr => {
  // Extract the date from a string like this: "Market-Order Kauf am 04.02.2020, um 14:02 Uhr an der Lang & Schwarz Exchange."
  const searchTerm = 'Kauf am ';
  const dateLine = textArr[textArr.findIndex(t => t.includes(searchTerm))];
  const date = dateLine.split(searchTerm)[1].trim().substr(0, 10);
  return date;
};

const findDateBuySavingsPlan = textArr => {
  // Extract the date from a string like this: "Sparplanausführung am 16.01.2020 an der Lang & Schwarz Exchange."
  const searchTerm = 'Sparplanausführung am ';
  const dateLine = textArr[textArr.findIndex(t => t.includes(searchTerm))];
  const date = dateLine.split(searchTerm)[1].trim().substr(0, 10);
  return date;
};

const findDateSell = textArr => {
  // Extract the date from a string like this: "Market-Order Verkauf am 04.02.2020, um 14:02 Uhr an der Lang & Schwarz Exchange."
  const searchTerm = 'Verkauf am ';
  const dateLine = textArr[textArr.findIndex(t => t.includes(searchTerm))];
  const date = dateLine.split(searchTerm)[1].trim().substr(0, 10);
  return date;
};

const findDateDividend = textArr => {
  const searchTerm = 'VALUTA';
  const dateLine = textArr[textArr.indexOf(searchTerm) + 3];
  const date = dateLine;
  return date;
};

const findShares = textArr => {
  const searchTerm = ' Stk.';
  const sharesLine = textArr[textArr.findIndex(t => t.includes(searchTerm))];
  const shares = sharesLine.split(searchTerm)[0];
  return parseGermanNum(shares);
};

const findAmountBuy = textArr => {
  const searchTerm = 'GESAMT';
  const totalAmountLine = textArr[textArr.indexOf(searchTerm) + 1];
  const totalAmount = totalAmountLine.split(' ')[0].trim();
  return parseGermanNum(totalAmount);
};

const findAmountSell = textArr => {
  const searchTerm = 'GESAMT';
  const totalAmountLine = textArr[textArr.lastIndexOf(searchTerm) + 1];
  const totalAmount = totalAmountLine.split(' ')[0].trim();
  return parseGermanNum(totalAmount);
};

const findPayout = textArr => {
  const searchTerm = 'GESAMT';
  const totalAmountLine = textArr[textArr.lastIndexOf(searchTerm) + 1];
  const totalAmount = totalAmountLine.split(' ')[0].trim();
  return parseGermanNum(totalAmount);
};

const findFee = textArr => {
  const searchTerm = 'Fremdkostenzuschlag';
  if (textArr.indexOf(searchTerm) > -1) {
    const feeLine = textArr[textArr.indexOf(searchTerm) + 1];
    const feeNumberString = feeLine.split(' EUR')[0];
    return Math.abs(parseGermanNum(feeNumberString));
  } else {
    return 0;
  }
};

const findTax = textArr => {
  var totalTax = Big(0);

  if (textArr.lastIndexOf('Kapitalertragssteuer') != -1) {
    const taxPositionLine =
      textArr[textArr.lastIndexOf('Kapitalertragssteuer') + 1];
    const taxPositionString = taxPositionLine.split(' EUR')[0];
    const taxPositionAmount = Math.abs(parseGermanNum(taxPositionString));
    totalTax = totalTax.plus(Big(taxPositionAmount));
  }

  if (textArr.lastIndexOf('Solidaritätszuschlag') != -1) {
    const taxPositionLine =
      textArr[textArr.lastIndexOf('Solidaritätszuschlag') + 1];
    const taxPositionString = taxPositionLine.split(' EUR')[0];
    const taxPositionAmount = Math.abs(parseGermanNum(taxPositionString));
    totalTax = totalTax.plus(Big(taxPositionAmount));
  }

  if (textArr.lastIndexOf('Kirchensteuer') != -1) {
    const taxPositionLine = textArr[textArr.lastIndexOf('Kirchensteuer') + 1];
    const taxPositionString = taxPositionLine.split(' EUR')[0];
    const taxPositionAmount = Math.abs(parseGermanNum(taxPositionString));
    totalTax = totalTax.plus(Big(taxPositionAmount));
  }
  return +totalTax;
};

const isBuySingle = textArr => textArr.some(t => t.includes('Kauf am'));

const isBuySavingsPlan = textArr =>
  textArr.some(t => t.includes('Sparplanausführung am'));

const isSell = textArr => textArr.some(t => t.includes('Verkauf am'));

const isDividend = textArr => textArr.some(t => t.includes('mit dem Ex-Tag'));

export const canParseData = textArr =>
  textArr.some(t => t.includes('TRADE REPUBLIC BANK GMBH')) &&
  (isBuySingle(textArr) ||
    isBuySavingsPlan(textArr) ||
    isSell(textArr) ||
    isDividend(textArr));

export const parseData = textArr => {
  let type, date, isin, company, shares, price, amount, fee, tax;

  if (isBuySingle(textArr) || isBuySavingsPlan(textArr)) {
    type = 'Buy';
    isin = findISIN(textArr);
    company = findCompany(textArr);
    date = isBuySavingsPlan(textArr)
      ? findDateBuySavingsPlan(textArr)
      : findDateSingleBuy(textArr);
    shares = findShares(textArr);
    amount = findAmountBuy(textArr);
    price = +Big(amount).div(Big(shares));
    fee = findFee(textArr);
    tax = 0;
  } else if (isSell(textArr)) {
    type = 'Sell';
    isin = findISIN(textArr);
    company = findCompany(textArr);
    date = findDateSell(textArr);
    shares = findShares(textArr);
    amount = findAmountSell(textArr);
    price = +Big(amount).div(Big(shares));
    fee = findFee(textArr);
    tax = findTax(textArr);
  } else if (isDividend(textArr)) {
    type = 'Dividend';
    isin = findISIN(textArr);
    company = findCompany(textArr);
    date = findDateDividend(textArr);
    shares = findShares(textArr);
    amount = findPayout(textArr);
    price = +Big(amount).div(Big(shares));
    fee = 0;
    tax = findTax(textArr);
  } else {
    console.error('unable to detect order');
  }

  const activity = {
    broker: 'traderepublic',
    type,
    date: format(parse(date, 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd'),
    isin,
    company,
    shares,
    price,
    amount,
    fee,
    tax,
  };

  const valid = every(values(activity), a => !!a || a === 0);

  if (!valid) {
    console.error('Error while parsing PDF', activity);
    return undefined;
  } else {
    return activity;
  }
};

export const parsePages = contents => {
  // trade republic only has one-page PDFs
  const activity = parseData(contents[0]);
  return [activity];
};
