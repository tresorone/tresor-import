import format from 'date-fns/format';
import parse from 'date-fns/parse';
import Big from 'big.js';

import { parseGermanNum, validateActivity } from '@/helper';

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

const findAmount = textArr => {
  const searchTerm = 'GESAMT';
  const totalAmountLine = textArr[textArr.indexOf(searchTerm) + 1];
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

  // There are three `BETRAG` values in each document. After the second, there are the taxes located.
  const searchTerm = 'BETRAG';
  let startTaxLineNumber = textArr.indexOf(
    searchTerm,
    textArr.indexOf(searchTerm) + 1
  );

  // The taxes end with the second `GESAMT` value, after which the total amount is displayed.
  const searchTermEnd = 'GESAMT';
  const endTaxLineNumber = textArr.lastIndexOf(searchTermEnd);

  // Skip the field `Fremdkostenzuschlag` after `BETRAG` to get the first tax.
  let skipLineCounter = 4;

  if (isDividend(textArr)) {
    // The dividend documents needs quite other logic...
    // For dividends in other currencies we need to search the last field `Zwischensumme` and skip all lines which contains `EUR` to find the first tax field.
    const searchTermSubtotal = 'Zwischensumme';
    const subtotalLineNumber = textArr.lastIndexOf(searchTermSubtotal);
    if (subtotalLineNumber > -1) {
      skipLineCounter = 0;
      while (
        textArr[subtotalLineNumber + skipLineCounter + 1].includes('EUR')
      ) {
        skipLineCounter++;
      }

      startTaxLineNumber = subtotalLineNumber + 2;
    } else {
      // This dividend is payed in `EUR`. We don't need the fancy logic above and can set the `skipLineCounter` to zero, because there is no `Fremdkostenzuschlag` field for dividends.
      skipLineCounter = 2;
    }
  }

  // Parse all taxes in the range of relevant line numbers
  for (
    let lineNumber = startTaxLineNumber + skipLineCounter;
    lineNumber < endTaxLineNumber;
    lineNumber += 2
  ) {
    const lineContent = textArr[lineNumber].split(' EUR')[0];
    const lineParsedAmount = Math.abs(parseGermanNum(lineContent));

    totalTax = totalTax.plus(Big(lineParsedAmount));
  }

  return +totalTax;
};

const isBuySingle = textArr => textArr.some(t => t.includes('Kauf am'));

const isBuySavingsPlan = textArr =>
  textArr.some(t => t.includes('Sparplanausführung am'));

const isSell = textArr => textArr.some(t => t.includes('Verkauf am'));

const isDividend = textArr => textArr.some(t => t.includes('mit dem Ex-Tag'));

const isOverviewStatement = content =>
  content.some(
    line =>
      line.includes('DEPOTAUSZUG') || line.includes('JAHRESDEPOTABSTIMMUNG')
  );

export const canParseData = textArr =>
  textArr.some(t => t.includes('TRADE REPUBLIC BANK GMBH')) &&
  (isBuySingle(textArr) ||
    isBuySavingsPlan(textArr) ||
    isSell(textArr) ||
    isDividend(textArr) ||
    isOverviewStatement(textArr));

export const parsePositionAsActivity = (content, startLineNumber) => {
  // Find the line with ISIN and the next line with the date
  let lineNumberOfISIN;
  let lineOfDate;
  for (
    let lineNumber = startLineNumber;
    lineNumber < content.length;
    lineNumber++
  ) {
    const line = content[lineNumber];
    if (line.includes('ISIN:') && lineNumberOfISIN === undefined) {
      lineNumberOfISIN = lineNumber;
    }

    if (lineNumberOfISIN !== undefined && /^\d{2}\.\d{2}\.\d{4}$/.test(line)) {
      lineOfDate = lineNumber;
      break;
    }
  }

  const numberOfShares = parseGermanNum(content[startLineNumber].split(' ')[0]);
  const toalAmount = parseGermanNum(content[lineOfDate + 1]);

  return {
    broker: 'traderepublic',
    type: 'Buy',
    date: format(
      parse(content[lineOfDate], 'dd.MM.yyyy', new Date()),
      'yyyy-MM-dd'
    ),
    isin: content[lineNumberOfISIN].split(' ')[1],
    company: content[startLineNumber + 1],
    shares: numberOfShares,
    // We need to calculate the buy-price per share because in the overview is only the current price per share available.
    price: +Big(toalAmount).div(Big(numberOfShares)),
    amount: toalAmount,
    fee: 0,
    tax: 0,
  };
};

export const parseOrderOrDividend = textArr => {
  let type, date, isin, company, shares, price, amount, fee, tax;

  if (isBuySingle(textArr) || isBuySavingsPlan(textArr)) {
    type = 'Buy';
    isin = findISIN(textArr);
    company = findCompany(textArr);
    date = isBuySavingsPlan(textArr)
      ? findDateBuySavingsPlan(textArr)
      : findDateSingleBuy(textArr);
    shares = findShares(textArr);
    amount = findAmount(textArr);
    price = +Big(amount).div(Big(shares));
    fee = findFee(textArr);
    tax = findTax(textArr);
  } else if (isSell(textArr)) {
    type = 'Sell';
    isin = findISIN(textArr);
    company = findCompany(textArr);
    date = findDateSell(textArr);
    shares = findShares(textArr);
    amount = findAmount(textArr);
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
    fee = findFee(textArr);
    tax = findTax(textArr);
  }

  return {
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
};

export const parsePage = content => {
  let foundActivities = [];

  if (
    isBuySingle(content) ||
    isBuySavingsPlan(content) ||
    isSell(content) ||
    isDividend(content)
  ) {
    foundActivities.push(parseOrderOrDividend(content));
  } else if (isOverviewStatement(content)) {
    for (let lineNumber = 0; lineNumber < content.length; lineNumber++) {
      const line = content[lineNumber];
      if (!line.includes(' Stk.')) {
        continue;
      }

      foundActivities.push(parsePositionAsActivity(content, lineNumber));
    }
  }

  let validatedActivities = [];
  foundActivities.forEach(activity => {
    if (validateActivity(activity)) {
      validatedActivities.push(activity);
    }
  });

  return validatedActivities;
};

export const parsePages = contents => {
  let activities = [];

  for (let content of contents) {
    try {
      parsePage(content).forEach(activity => {
        activities.push(activity);
      });
    } catch (exception) {
      console.error(
        'Error while parsing page (trade republic)',
        exception,
        content
      );
    }
  }

  return activities;
};
