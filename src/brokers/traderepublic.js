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

const findAmount = (textArr, fxRate) => {
  const searchTerm = 'GESAMT';
  let totalAmountLine = textArr[textArr.indexOf(searchTerm) + 1];
  const totalAmount = totalAmountLine.split(' ')[0].trim();
  if (fxRate !== undefined) {
    return +Big(parseGermanNum(totalAmount)).div(fxRate);
  }
  return parseGermanNum(totalAmount);
};

const findForeignInformation = textArr => {
  // Look for a line with the format 1,234 EUR/USD
  const foreignIdx = textArr.findIndex(line =>
    /[0-9]+(,[0-9]+)?\s[A-Z]{3}\/[A-Z]{3}/.test(line)
  );
  if (foreignIdx >= 0) {
    const foreignInfo = textArr[foreignIdx].split(/\s+/);
    return [parseGermanNum(foreignInfo[0]), foreignInfo[1].split('/')[1]];
  }
  return [undefined, undefined];
};

const findFee = (textArr, fxRate) => {
  let totalFee = Big(0);
  if (textArr.indexOf('Fremde Spesen') > -1) {
    const feeLine = textArr[textArr.indexOf('Fremde Spesen') + 1];
    const feeNumberString = feeLine.split(/\s+/)[0];
    totalFee = totalFee.minus(Big(parseGermanNum(feeNumberString)).div(fxRate));
  }
  if (textArr.indexOf('Fremdkostenzuschlag') > -1) {
    const feeLine = textArr[textArr.indexOf('Fremdkostenzuschlag') + 1];
    const feeNumberString = feeLine.split(/\s+/)[0];

    totalFee = totalFee.minus(parseGermanNum(feeNumberString));
  }

  return +totalFee;
};

const findTax = (textArr, fxRate) => {
  let totalTax = Big(0);
  const transactionTaxIdx = textArr.findIndex(line =>
    line.includes('Finanztransaktionssteuer')
  );
  if (transactionTaxIdx >= 0) {
    const transactionTax = parseGermanNum(
      textArr[transactionTaxIdx + 1].split(/\s+/)[0]
    );
    totalTax = totalTax.minus(transactionTax);
  }
  const withholdingTaxLine = textArr.findIndex(line =>
    line.startsWith('Quellensteuer')
  );
  if (withholdingTaxLine >= 0) {
    const foreignTax = parseGermanNum(
      textArr[withholdingTaxLine + 1].split(/\s+/)[0]
    );
    if (fxRate !== undefined) {
      totalTax = totalTax.minus(Big(foreignTax).div(fxRate));
    } else {
      totalTax = totalTax.minus(foreignTax);
    }
  }
  const capitalTaxIdx = textArr.findIndex(line =>
    line.includes('Kapitalertragssteuer')
  );
  if (capitalTaxIdx >= 0) {
    totalTax = totalTax.minus(
      parseGermanNum(textArr[capitalTaxIdx + 1].split(/\s+/)[0])
    );
  }
  const soliTaxIdx = textArr.findIndex(line =>
    line.includes('Solidaritätszuschlag')
  );
  if (soliTaxIdx >= 0) {
    totalTax = totalTax.minus(
      parseGermanNum(textArr[soliTaxIdx + 1].split(/\s+/)[0])
    );
  }
  const churchTaxIdx = textArr.findIndex(line =>
    line.includes('Kirchensteuer')
  );
  if (churchTaxIdx >= 0) {
    totalTax = totalTax.minus(
      parseGermanNum(textArr[churchTaxIdx + 1].split(/\s+/)[0])
    );
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

const detectedButIgnoredDocument = content => {
  return (
    // When the document contains one of the following lines, we want to ignore these document.
    content.some(line => line.includes('KOSTENINFORMATION')) ||
    content.some(line => line.includes('SPLIT')) ||
    content.some(line => line === 'SPARPLANAUSFÜHRUNG FEHLGESCHLAGEN')
  );
};

const isSupportedDocument = content => {
  return (
    isBuySingle(content) ||
    isBuySavingsPlan(content) ||
    isSell(content) ||
    isDividend(content) ||
    isOverviewStatement(content)
  );
};

export const canParsePage = (content, extension) =>
  extension === 'pdf' &&
  content.some(
    line =>
      line.includes('TRADE REPUBLIC BANK GMBH') &&
      (isSupportedDocument(content) || detectedButIgnoredDocument(content))
  );

// Functions to parse an overview Statement
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

// Individual transaction file
const parseTransaction = textArr => {
  const [fxRate, foreignCurrency] = findForeignInformation(textArr);
  let activity = {
    broker: 'traderepublic',
    isin: findISIN(textArr),
    company: findCompany(textArr),
    shares: findShares(textArr),
    tax: findTax(textArr, fxRate),
    fee: findFee(textArr, fxRate),
  };
  if (isBuySingle(textArr) || isBuySavingsPlan(textArr)) {
    activity.type = 'Buy';
    const date = isBuySavingsPlan(textArr)
      ? findDateBuySavingsPlan(textArr)
      : findDateSingleBuy(textArr);
    [activity.date, activity.datetime] = createActivityDateTime(
      date,
      findOrderTime(textArr)
    );
    activity.amount = findAmount(textArr, fxRate);
  } else if (isSell(textArr)) {
    activity.type = 'Sell';
    [activity.date, activity.datetime] = createActivityDateTime(
      findDateSell(textArr),
      findOrderTime(textArr)
    );
    activity.amount = +findAmount(textArr);
  } else if (isDividend(textArr)) {
    activity.type = 'Dividend';
    const dateFormat = findDateDividend(textArr).includes('-')
      ? 'yyyy-MM-dd'
      : 'dd.MM.yyyy';
    [activity.date, activity.datetime] = createActivityDateTime(
      findDateDividend(textArr),
      findOrderTime(textArr),
      dateFormat
    );
    activity.amount = +Big(findAmount(textArr, fxRate));
  }

  activity.price = +Big(activity.amount).div(activity.shares);
  if (fxRate !== undefined && foreignCurrency !== undefined) {
    activity.fxRate = fxRate;
    activity.foreignCurrency = foreignCurrency;
  }
  return validateActivity(activity);
};

export const parsePages = contents => {
  let activities = [];
  const allPagesFlat = contents.flat();

  if (detectedButIgnoredDocument(allPagesFlat)) {
    // We know this type and we don't want to support it.
    return {
      activities,
      status: 7,
    };
  }

  if (isOverviewStatement(contents[0])) {
    try {
      parseOverviewStatement(allPagesFlat).forEach(activity => {
        activities.push(activity);
      });
    } catch (exception) {
      console.error(
        'Error while parsing over statement (trade republic)',
        exception,
        allPagesFlat
      );
    }
  } else {
    for (let content of contents) {
      try {
        activities.push(parseTransaction(content));
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
