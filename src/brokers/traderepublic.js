import Big from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
} from '@/helper';

const findISIN = text => {
  if (text.some(t => t.includes('ISIN:'))) {
    // Newer PDFs from traderepublic do contain an explicit "ISIN" string
    const isinLine = text[text.findIndex(t => t.includes('ISIN:'))];
    return isinLine.substr(isinLine.length - 12);
  } else {
    // Older PDFs from traderepublic do not contain an explicit "ISIN" string, here we look up the
    // ISIN value by referencing it from the "shares" index.
    return text[text.findIndex(t => t.includes('Stk.')) - 1];
  }
};

const findCompany = text => {
  return text[text.findIndex(t => t.includes('BETRAG')) + 1];
};

const findDateSingleBuy = textArr => {
  // Extract the date from a string like this: "Market-Order Kauf am 04.02.2020, um 14:02 Uhr an der Lang & Schwarz Exchange."
  const searchTerm = 'Kauf am ';
  const dateLine = textArr[textArr.findIndex(t => t.includes(searchTerm))];
  return dateLine.split(searchTerm)[1].trim().substr(0, 10);
};

const findOrderTime = content => {
  // Extract the time from a string like this: "Market-Order Kauf am 04.02.2020, um 14:02 Uhr an der Lang & Schwarz Exchange."
  const searchTerm = ', um ';
  const lineNumber = content.findIndex(t => t.includes(searchTerm));

  if (lineNumber < 0) {
    return undefined;
  }

  return content[lineNumber].split(searchTerm)[1].trim().substr(0, 5);
};

const findDateBuySavingsPlan = textArr => {
  // Extract the date from a string like this: "Sparplanausführung am 16.01.2020 an der Lang & Schwarz Exchange."
  const searchTerm = 'Sparplanausführung am ';
  const dateLine = textArr[textArr.findIndex(t => t.includes(searchTerm))];
  return dateLine.split(searchTerm)[1].trim().substr(0, 10);
};

const findDateSell = textArr => {
  // Extract the date from a string like this: "Market-Order Verkauf am 04.02.2020, um 14:02 Uhr an der Lang & Schwarz Exchange."
  const searchTerm = 'Verkauf am ';
  const dateLine = textArr[textArr.findIndex(t => t.includes(searchTerm))];
  return dateLine.split(searchTerm)[1].trim().substr(0, 10);
};

const findDateDividend = textArr => {
  const searchTerm = 'VALUTA';
  return textArr[textArr.indexOf(searchTerm) + 3];
};

const findShares = textArr => {
  const searchTerm = ' Stk.';
  const sharesLine = textArr[textArr.findIndex(t => t.includes(searchTerm))];
  const shares = sharesLine.split(searchTerm)[0];
  return parseGermanNum(shares);
};

const findPriceOfShare = textArr => {
  const lineWithValue =
    textArr[textArr.findIndex(t => t.includes(' Stk.')) + 1];
  return +findAndConvertNumber(lineWithValue, textArr);
};

const findAmount = textArr => {
  const searchTerm = 'GESAMT';
  const totalAmountLine = textArr[textArr.indexOf(searchTerm) + 1];
  const totalAmount = totalAmountLine.split(' ')[0].trim();
  return Big(parseGermanNum(totalAmount));
};

const findDividendNetPayout = textArr => {
  const searchTerm = 'GESAMT';
  const totalAmountLine = textArr[textArr.lastIndexOf(searchTerm) + 1];
  const totalAmount = totalAmountLine.split(' ')[0].trim();
  return Big(parseGermanNum(totalAmount));
};

const findExchangeRate = (textArr, currency) => {
  // Find the value of "1,1869 EUR/USD" by searching for "EUR/USD"
  const searchTerm = 'EUR/' + currency;
  const totalExchangeRateLine =
    textArr[textArr.findIndex(line => line.includes(searchTerm))];
  const exchangeRateValue = totalExchangeRateLine.split(' ')[0].trim();
  return Big(parseGermanNum(exchangeRateValue));
};

const findAndConvertNumber = (valueWithCurrency, textArr) => {
  // Find a value and convert it to EUR using the rate given in the document.
  const lineElements = valueWithCurrency.split(' ');
  const value = Big(Math.abs(parseGermanNum(lineElements[0])));
  if (lineElements[1] === 'EUR') {
    // No currency conversion is required.
    return value;
  }

  // Convert the number with the exchange rate from document.
  return value.div(findExchangeRate(textArr, lineElements[1]));
};

const findFee = textArr => {
  let totalFee = Big(0);

  const searchTerm = 'Fremdkostenzuschlag';
  if (textArr.indexOf(searchTerm) > -1) {
    const feeLine = textArr[textArr.indexOf(searchTerm) + 1];
    const feeNumberString = feeLine.split(' EUR')[0];

    totalFee = totalFee.plus(Big(Math.abs(parseGermanNum(feeNumberString))));
  }

  const searchTermThirdPartyExpenses = 'Fremde Spesen';
  if (textArr.indexOf(searchTermThirdPartyExpenses) > -1) {
    const lineWithValue =
      textArr[textArr.indexOf(searchTermThirdPartyExpenses) + 1];
    totalFee = totalFee.plus(findAndConvertNumber(lineWithValue, textArr));
  }

  return totalFee;
};

const findTax = textArr => {
  let totalTax = Big(0);

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
    // A positive tax amount in the json indicates tax return and a negative tax amount indicates a paid tax
    // TresorOne handles this the other way around
    const lineParsedAmount = -parseGermanNum(lineContent);
    totalTax = totalTax.plus(Big(lineParsedAmount));
  }

  // Find Withholding Tax in foreign currency
  const searchTermWithholdingTax = 'Quellensteuer';
  const withholdingTaxLine = textArr.findIndex(line =>
    line.includes(searchTermWithholdingTax)
  );
  if (
    withholdingTaxLine > -1 &&
    !textArr[withholdingTaxLine + 1].includes('EUR')
  ) {
    const lineWithValue = textArr[withholdingTaxLine + 1];
    totalTax = totalTax.plus(findAndConvertNumber(lineWithValue, textArr));
  }
  return totalTax;
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

export const canParsePage = (content, extension) =>
  extension === 'pdf' &&
  content.some(line => line.includes('TRADE REPUBLIC BANK GMBH')) &&
  (isBuySingle(content) ||
    isBuySavingsPlan(content) ||
    isSell(content) ||
    isDividend(content) ||
    isOverviewStatement(content));

const parsePositionAsActivity = (content, startLineNumber) => {
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
  let toalAmount = parseGermanNum(content[lineOfDate + 1]);

  if (lineNumberOfISIN - startLineNumber > 5) {
    // Edge-case: On a pages change, the total amount are located under the company name.
    toalAmount = parseGermanNum(content[startLineNumber + 3]);
  }

  const [parsedDate, parsedDateTime] = createActivityDateTime(
    content[lineOfDate],
    undefined
  );

  return validateActivity({
    broker: 'traderepublic',
    type: 'Buy',
    date: parsedDate,
    datetime: parsedDateTime,
    isin: content[lineNumberOfISIN].split(' ')[1],
    company: content[startLineNumber + 1],
    shares: numberOfShares,
    // We need to calculate the buy-price per share because in the overview is only the current price per share available.
    price: +Big(toalAmount).div(Big(numberOfShares)),
    amount: toalAmount,
    fee: 0,
    tax: 0,
  });
};

const parseOrderOrDividend = textArr => {
  let type, date, time, isin, company, shares, price, amount, tax, fee;

  if (isBuySingle(textArr) || isBuySavingsPlan(textArr)) {
    type = 'Buy';
    company = findCompany(textArr);
    date = isBuySavingsPlan(textArr)
      ? findDateBuySavingsPlan(textArr)
      : findDateSingleBuy(textArr);
    time = findOrderTime(textArr);
    amount = +findAmount(textArr);
    fee = +findFee(textArr);
    tax = +findTax(textArr);
  } else if (isSell(textArr)) {
    type = 'Sell';
    company = findCompany(textArr);
    date = findDateSell(textArr);
    time = findOrderTime(textArr);
    amount = +findAmount(textArr);
    fee = +findFee(textArr);
    tax = +findTax(textArr);
  } else if (isDividend(textArr)) {
    type = 'Dividend';
    company = findCompany(textArr);
    date = findDateDividend(textArr);
    tax = +findTax(textArr);
    fee = +findFee(textArr);
    amount = +findDividendNetPayout(textArr).plus(tax).plus(fee);
  }

  isin = findISIN(textArr);
  shares = findShares(textArr);
  price = findPriceOfShare(textArr);

  const [parsedDate, parsedDateTime] = createActivityDateTime(date, time);

  return validateActivity({
    broker: 'traderepublic',
    type,
    date: parsedDate,
    datetime: parsedDateTime,
    isin,
    company,
    shares,
    price,
    amount,
    tax,
    fee,
  });
};

const parseOverviewStatement = content => {
  const foundActivities = [];

  for (let lineNumber = 0; lineNumber < content.length; lineNumber++) {
    if (!content[lineNumber].includes(' Stk.')) {
      continue;
    }

    foundActivities.push(parsePositionAsActivity(content, lineNumber));
  }

  return foundActivities;
};

export const parsePages = contents => {
  let activities = [];

  if (isOverviewStatement(contents[0])) {
    const content = contents.flat();

    try {
      parseOverviewStatement(content).forEach(activity => {
        activities.push(activity);
      });
    } catch (exception) {
      console.error(
        'Error while parsing over statement (trade republic)',
        exception,
        content
      );
    }
  } else {
    for (let content of contents) {
      try {
        activities.push(parseOrderOrDividend(content));
      } catch (exception) {
        console.error(
          'Error while parsing page (trade republic)',
          exception,
          content
        );
      }
    }
  }

  return {
    activities,
    status: 0,
  };
};
