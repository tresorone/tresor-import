import Big from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
  timeRegex,
} from '@/helper';

/**
 *
 * @param {string[]} textArr
 * @param {number} startLineNumber
 * @param {any} key
 * @param {number} groupIndex
 * @returns {any}
 */
const getTableValueByKey = (textArr, startLineNumber, key, groupIndex = 1) => {
  const finding = textArr.find(
    t =>
      textArr.indexOf(t, startLineNumber - 1) > startLineNumber &&
      t.match(key + '[\\s+:]+\\s+')
  );

  const result = finding
    ? finding.match(new RegExp('^.*' + key + '[\\s+:]+\\s+(.+?)\\s+(.+)$'))
    : null;

  return result ? result[groupIndex] : null;
};

/**
 *
 * @param {string[]} textArr
 * @param {number} startLineNumber
 * @param {any} key
 * @returns {any}
 */
const getHeaderValueByKey = (textArr, startLineNumber, key) => {
  const result = textArr.find(
    t => textArr.indexOf(t) >= startLineNumber && t.includes(key + ' ')
  );
  return result ? result.match(new RegExp(key + '\\s\\s+(.+)'))[1] : null;
};

/**
 *
 * @param {string[]} textArr
 * @returns {number}
 */
const findTableIndexes = textArr => {
  let lineNumbers = [];
  textArr.forEach((line, lineNumber) => {
    if (!/Nr.\d+(\/\d)?/.test(line)) {
      return;
    }
    lineNumbers.push(lineNumber);
  });

  return lineNumbers;
};

/**
 *
 * @param {string[]} textArr
 * @param {number} tableIndex
 * @returns {string|null}
 */
const findISIN = (textArr, tableIndex) => {
  const isinStr = textArr[tableIndex].trim();
  const isinMatch = isinStr.match(/([A-Z]{2})((?![A-Z]{10})[A-Z0-9]{10})/);
  return isinMatch ? isinMatch[0] : null;
};

/**
 *
 * @param {string[]} textArr
 * @param {number} tableIndex
 * @returns {string|undefined}
 */
const findCompany = (textArr, tableIndex) => {
  const companyStr = textArr[tableIndex].trim();
  const companyMatch = companyStr.match(
    /Nr.\d+(\/\d)?\s+(Kauf|Verkauf)?(.*)\s+\(/
  );
  return companyMatch
    ? companyMatch[3].trim().replace(/ +(?= )/g, '')
    : undefined;
};

/**
 *
 * @param {string[]} textArr
 * @param {number} startLineNumber
 * @returns {Date|undefined}
 */
const findDateBuySell = (textArr, startLineNumber) => {
  if (getTableValueByKey(textArr, startLineNumber, 'Schlusstag')) {
    // Standard stock
    return getTableValueByKey(textArr, startLineNumber, 'Schlusstag').split(
      ','
    )[0];
  }

  if (getHeaderValueByKey(textArr, 0, 'Handelstag')) {
    // ETF
    return getHeaderValueByKey(textArr, 0, 'Handelstag');
  }

  // Old format has the date above the transactions
  let lineNumber = textArr.findIndex(line => line.startsWith('Schlusstag'));
  if (lineNumber < 0) {
    lineNumber = textArr.findIndex(line => line.startsWith('Handelstag'));
  }

  if (lineNumber < 0) {
    return undefined;
  }

  return textArr[lineNumber].split(/\s+/)[1];
};

/**
 *
 * @param {string[]} textArr
 * @param {number} startLineNumber
 * @returns {string}
 */
const findOrderTime = (textArr, startLineNumber) => {
  const lineWithOrderTime = getTableValueByKey(
    textArr,
    startLineNumber,
    'Schlusstag',
    2
  );

  if (lineWithOrderTime !== null && timeRegex(false).test(lineWithOrderTime)) {
    return lineWithOrderTime.split(' ')[0].trim();
  }

  const lineWithExecutionTime = getHeaderValueByKey(
    textArr,
    0,
    'Ausführungszeit'
  );

  if (
    lineWithExecutionTime === null ||
    !timeRegex(false).test(lineWithExecutionTime)
  ) {
    return undefined;
  }

  return lineWithExecutionTime.split(' ')[0];
};

/**
 *
 * @param {string[]} textArr
 * @param {number} startLineNumber
 * @returns {Big}
 */
const findShares = (textArr, startLineNumber) => {
  const partialExecution = getTableValueByKey(
    textArr,
    startLineNumber,
    'davon ausgef.'
  );
  if (partialExecution) {
    return parseGermanNum(partialExecution);
  }

  const numberOrder = getTableValueByKey(
    textArr,
    startLineNumber,
    'Ordervolumen'
  );
  if (numberOrder) {
    return parseGermanNum(numberOrder);
  }

  // ETFs
  const executed = getTableValueByKey(textArr, startLineNumber, 'Ausgeführt');
  if (executed) {
    return parseGermanNum(executed);
  }

  // Dividends
  let numberDividends = getTableValueByKey(textArr, startLineNumber, 'St.');
  if (numberDividends === null || numberDividends.trim().length === 0) {
    // For old documents (e.g. from 2015) we need to get the number of shares from group 2
    numberDividends = getTableValueByKey(textArr, startLineNumber, 'St.', 2);
  }

  if (numberDividends) {
    return parseGermanNum(numberDividends);
  }
};

/**
 *
 * @param {string[]} content
 * @param {number} startLineNumber
 * @returns {Big}
 */
const findPrice = (content, startLineNumber) => {
  const lineValue = getTableValueByKey(content, startLineNumber, 'Kurs');
  if (!lineValue) {
    return undefined;
  }

  return Big(parseGermanNum(lineValue));
};

/**
 *
 * @param {string[]} content
 * @param {number} startLineNumber
 * @returns {string|undefined}
 */
const findPriceCurrency = (content, startLineNumber) => {
  const lineValue = getTableValueByKey(content, startLineNumber, 'Kurs', 2);
  if (!lineValue) {
    return undefined;
  }

  const currency = lineValue.split(/\s+/)[0];
  if (!/[A-Z]{3}/.test(currency)) {
    // This can't be the ISO currency code. Better safe than sorry...
    return undefined;
  }

  return currency;
};

/**
 *
 * @param {string[]} textArr
 * @param {number} startLineNumber
 * @returns
 */
const findAmount = (textArr, startLineNumber) =>
  parseGermanNum(
    findTableValueByKeyWithDocumentFormat(textArr, startLineNumber, 'Kurswert')
  );

/**
 *
 * @param {string[]} content
 * @param {number} startLineNumber
 * @param {any} term
 * @returns {string}
 */
const findTableValueByKeyWithDocumentFormat = (
  content,
  startLineNumber,
  term
) => {
  // New document format has the following content 'Kurswert      :             207,83 EUR'
  // In the old format from 2018 the line contains 'Kurswert       EUR                62,50'
  let value = getTableValueByKey(content, startLineNumber, term, 1);

  if (/[A-Z]{3}/.test(value)) {
    value = getTableValueByKey(content, startLineNumber, term, 2);
  }

  return value;
};

/**
 *
 * @param {string[]} textArr
 * @param {number} startLineNumber
 * @returns {Big}
 */
const findFee = (textArr, startLineNumber) => {
  const provision = findTableValueByKeyWithDocumentFormat(
    textArr,
    startLineNumber,
    'Provision'
  )
    ? parseGermanNum(
        findTableValueByKeyWithDocumentFormat(
          textArr,
          startLineNumber,
          'Provision'
        ).split(' ')[0]
      )
    : 0;
  const ownExpenses = findTableValueByKeyWithDocumentFormat(
    textArr,
    startLineNumber,
    'Eigene Spesen'
  )
    ? parseGermanNum(
        findTableValueByKeyWithDocumentFormat(
          textArr,
          startLineNumber,
          'Eigene Spesen'
        ).split(' ')[0]
      )
    : 0;
  const foreignExpenses = findTableValueByKeyWithDocumentFormat(
    textArr,
    startLineNumber,
    'Fremde Spesen'
  )
    ? parseGermanNum(
        findTableValueByKeyWithDocumentFormat(
          textArr,
          startLineNumber,
          'Fremde Spesen'
        ).split(' ')[0]
      )
    : 0;

  return +Big(provision).plus(Big(ownExpenses)).plus(Big(foreignExpenses));
};

/**
 *
 * @param {string[]} textArr
 * @param {number} startLineNumber
 * @returns {Big}
 */
const findTax = (textArr, startLineNumber) => {
  let totalTax = Big(0);

  const tax = findTableValueByKeyWithDocumentFormat(
    textArr,
    startLineNumber,
    'Einbeh. Steuer'
  );
  if (tax) {
    totalTax = totalTax.plus(parseGermanNum(tax));
  }

  const kest = findTableValueByKeyWithDocumentFormat(
    textArr,
    startLineNumber,
    'Einbeh. KESt'
  );
  if (kest) {
    totalTax = totalTax.plus(parseGermanNum(kest));
  }

  return +totalTax;
};

/**
 *
 * @param {string[]} content
 * @param {number} startLineNumber
 * @returns {number}
 */
const findNetPayout = (content, startLineNumber) =>
  parseGermanNum(getTableValueByKey(content, startLineNumber, 'Endbetrag', 1));

/**
 *
 * @param {string[]} textArr
 * @param {number} startLineNumber
 * @returns {Date}
 */
const findDateDividend = (textArr, startLineNumber) => {
  const date = getTableValueByKey(textArr, startLineNumber, 'Valuta', 1);
  if (/\d{2}.\d{2}.\d{4}/.test(date)) {
    return date;
  }

  return getTableValueByKey(textArr, startLineNumber, 'Valuta', 2);
};

/**
 * Find the correct amout of Payout. if a foreignCurrency is defined payout is converted with fxRate
 * @param {string[]} textArr
 * @param {number} startLineNumber
 * @param {string} fxRate
 * @param {string|undefined} foreignCurrency
 * @returns {Big}
 */
const findPayout = (textArr, startLineNumber, fxRate, foreignCurrency) => {
  const payoutAmount = Big(
    // Use groupIndex 1 for the amount.
    parseGermanNum(grossValueByGroupIndex(textArr, startLineNumber, 1))
  );

  if (foreignCurrency === undefined) {
    // When no foreign currency is set no conversion is required.
    return payoutAmount;
  }

  // Use groupIndex 2 for the currency.
  const payoutCurrency = grossValueByGroupIndex(textArr, startLineNumber, 2);
  if (foreignCurrency !== payoutCurrency) {
    // The payout currency (e.g. USD) is unequal to the fxRate currency (e.g. CAD). No conversion is required.
    throw new Error(
      'Unable to convert the payout currency ' +
        payoutCurrency +
        ' with the fx rate of currency ' +
        foreignCurrency
    );
  }

  return payoutAmount.div(fxRate);
};

/**
 * GroupIndex = 1: amount, GroupIndex = 2: currency
 * @param {string[]} content
 * @param {number} startLineNumber
 * @param {number} groupIndex
 * @returns {number|undefined}
 */
const grossValueByGroupIndex = (content, startLineNumber, groupIndex) => {
  let amount = getTableValueByKey(
    content,
    startLineNumber,
    'Bruttodividende',
    groupIndex
  );
  if (amount) {
    return amount;
  }

  amount = getTableValueByKey(
    content,
    startLineNumber,
    'Bruttoausschüttung',
    groupIndex
  );
  if (amount) {
    return amount;
  }

  amount = getTableValueByKey(
    content,
    startLineNumber,
    'grundlage',
    groupIndex
  );
  if (amount) {
    return amount;
  }

  return undefined;
};

/**
 * This function returns an array with: fxRate, foreignCurrency, baseCurrency (or undefined).
 * @param {*} content
 * @param {*} startLineNumber
 * @returns {object[]} [fxRate, foreignCurrency, baseCurrency ]
 */
const findForeignInformation = (content, startLineNumber) => {
  let fxRate = getTableValueByKey(content, startLineNumber, 'Devisenkurs', 1);

  if (fxRate != null && fxRate.trim().length === 0) {
    // In some formats we need to match the second group, when only the `Devisenkurs` is in the line:
    // Devisenkurs     :        1,113700
    // insead of
    // Devisenkurs     :    1,157900         *Einbeh. Steuer     :         0,00 EUR
    fxRate = getTableValueByKey(content, startLineNumber, 'Devisenkurs', 2);
  }

  if (fxRate === null || !/\d+,\d+/.test(fxRate)) {
    // When no fxRate applies some documets have the field without a value, so we need to check if the value is a valid number:
    // Devisenkurs                            Provision      EUR                 5,00
    // or
    // Devisenkurs                            Eigene Spesen
    return [undefined, undefined, undefined];
  }

  const baseCurrency = getTableValueByKey(
    content,
    startLineNumber,
    'Endbetrag',
    2
  );

  // Use groupIndex 2 for the currency.
  let foreignCurrency = grossValueByGroupIndex(content, startLineNumber, 2);
  if (foreignCurrency === undefined || foreignCurrency === baseCurrency) {
    foreignCurrency = findPriceCurrency(content, startLineNumber);
  }

  return [Big(parseGermanNum(fxRate)), foreignCurrency, baseCurrency];
};

/**
 *
 * @param {string[]} textArr
 * @param {number} lineNumber
 * @param {any} value
 * @returns
 */
const lineContains = (textArr, lineNumber, value) =>
  textArr[lineNumber].includes(value);

/**
 *
 * @param {string[]} content
 * @returns
 */
const detectedButIgnoredDocument = content => {
  return (
    // When the document contains one of the following lines, we want to ignore these document.
    content.some(line => line.toLowerCase().includes('auftragsbestätigung')) ||
    content.some(line => line.toLowerCase().includes('einrichtung sparplan nr'))
  );
};

/**
 *
 * @param {string[]} textArr
 * @param {number} startLineNumber
 * @returns
 */
const parsePage = (textArr, startLineNumber) => {
  let type,
    date,
    datetime,
    time,
    isin = findISIN(textArr, startLineNumber),
    company = findCompany(textArr, startLineNumber),
    shares = findShares(textArr, startLineNumber),
    price = findPrice(textArr, startLineNumber),
    priceCurrency = findPriceCurrency(textArr, startLineNumber),
    amount,
    fee,
    tax,
    fxRate,
    foreignCurrency,
    baseCurrency;

  [fxRate, foreignCurrency, baseCurrency] = findForeignInformation(
    textArr,
    startLineNumber
  );

  if (lineContains(textArr, startLineNumber, 'Kauf')) {
    type = 'Buy';
    date = findDateBuySell(textArr, startLineNumber);
    time = findOrderTime(textArr, startLineNumber);
    amount = findAmount(textArr, startLineNumber);
    fee = findFee(textArr, startLineNumber);
    tax = 0;
  } else if (lineContains(textArr, startLineNumber, 'Verkauf')) {
    type = 'Sell';
    date = findDateBuySell(textArr, startLineNumber);
    time = findOrderTime(textArr, startLineNumber);
    amount = findAmount(textArr, startLineNumber);
    fee = findFee(textArr, startLineNumber);
    tax = findTax(textArr, startLineNumber);
  } else if (
    lineContains(textArr, startLineNumber - 3, 'Dividendengutschrift') ||
    lineContains(textArr, startLineNumber - 3, 'Ertragsmitteilung')
  ) {
    const grossPayout = findPayout(
      textArr,
      startLineNumber,
      fxRate,
      foreignCurrency
    );
    const netPayout = findNetPayout(textArr, startLineNumber);
    const taxAmount = +grossPayout.minus(netPayout);

    type = 'Dividend';
    date = findDateDividend(textArr, startLineNumber);
    amount = +grossPayout;
    price = grossPayout.div(shares);
    fee = 0;

    // A possible tax amount lower than 0.00 should be ignored because this can be a number ceiling issue with fxrate conversion
    tax = Math.abs(taxAmount) < 0.01 ? 0 : taxAmount;
  }

  const canConvertCurrency =
    fxRate !== undefined &&
    foreignCurrency !== undefined &&
    foreignCurrency != baseCurrency;
  if (
    priceCurrency !== undefined &&
    canConvertCurrency &&
    (type === 'Buy' || type === 'Sell')
  ) {
    // For buy and sell documents we need to convert the currency to the base currency (when possible).
    price = price.div(fxRate);
  }

  [date, datetime] = createActivityDateTime(date, time);

  const activity = {
    broker: 'flatex',
    type,
    date,
    datetime,
    isin,
    company,
    shares,
    price: +price,
    amount,
    fee,
    tax,
  };

  if (canConvertCurrency) {
    activity.fxRate = +fxRate;
    activity.foreignCurrency = foreignCurrency;
  }

  return validateActivity(activity);
};

/**
 * Implementation to detect and parse CSV content
 */
class FlatexCSV {
  /**
   * Maps the parsed CSV file to an activity and transforms items to the expected type/format
   * @param {object[]} content -> parsed CSV file
   * @returns {activities[]} mapped content of an array of objects to an array of activities
   */
  parseCSV(content) {
    let data = content.splice(1);
    return data.map(row => {
      let type = this.parseAction(row['Buchungsinformationen']),
        date = row['Buchtag'],
        datetime = row['Valuta'],
        isin = row['ISIN'],
        company = row['Bezeichnung'],
        shares = row['Nominal'],
        price = parseGermanNum(row['Kurs']) * parseGermanNum(row['Nominal']),
        amount = row['Kurs'],
        fee = 0,
        tax = 0;

      return {
        broker: 'flatex',
        type,
        date,
        datetime,
        isin,
        company,
        shares,
        price,
        amount,
        fee,
        tax,
      };
    });
  }

  /**
   * Checks for certain key words (Kauf,Verkauf,WP-Eingang) which maps to actions
   * @param {string} type
   * @returns {'BUY'|'SELL|'TransfertIn'|'UNKOWN'}
   */
  parseAction(type) {
    if (type.includes('Kauf')) return 'BUY';
    if (type.includes('Verkauf')) return 'SELL';
    if (type.includes('WP-Eingang')) return 'TransfertIn';

    return 'UNKOWN';
  }

  /**
   * Check if the header row of the csv file maps to the expected header row.
   * @param {string} content
   * @returns {boolean}
   */
  static detectCSVDocumentFromText(content) {
    //Currently i do not know how to detect a csv other than looking for its header row
    let result = content.includes(
      'Nummer;Buchtag;Valuta;ISIN;Bezeichnung;Nominal;;Buchungsinformationen;TA-Nr.;Kurs;'
    );

    return result;
  }

  /**
   * Checks if a object contains certain fields which the expected CSV File contains as well.
   * @param {object} content
   * @returns {boolean}
   */
  static detectCSVDocumentFromObject(content) {
    try {
      return (
        'Bezeichnung' in content && 'Buchtag' in content && 'ISIN' in content
      );
    } catch (e) {
      return false;
    }
  }
}

/**
 * Checks PDF content
 * @param {string[]} firstPageContent
 * @returns {boolean}
 */
const detectPDFDocument = firstPageContent => {
  return (
    firstPageContent.some(
      line =>
        line.includes('flatex Bank AG') ||
        line.includes('flatexDEGIRO Bank AG') ||
        line.includes('FinTech Group Bank AG') ||
        line.includes('biw AG')
    ) &&
    (firstPageContent.some(line => line.includes('Kauf')) ||
      firstPageContent.some(line => line.includes('Verkauf')) ||
      firstPageContent.some(line => line.includes('Dividendengutschrift')) ||
      firstPageContent.some(line => line.includes('Ertragsmitteilung')) ||
      detectedButIgnoredDocument(firstPageContent))
  );
};

export const canParseDocument = (pages, extension) => {
  const firstPageContent = pages[0];
  switch (extension) {
    case 'csv':
      return FlatexCSV.detectCSVDocumentFromText(firstPageContent[0]);
    case 'pdf': {
      return detectPDFDocument(firstPageContent);
    }
  }
};

export const parsePages = contents => {
  let activities = [];

  let text = contents.flat()[0];
  //CSV
  if (FlatexCSV.detectCSVDocumentFromObject(text)) {
    let parser = new FlatexCSV();
    activities = parser.parseCSV(contents);
    return {
      activities,
      status: 0,
    };
  }

  if (detectedButIgnoredDocument(contents.flat())) {
    // We know this type and we don't want to support it.
    return {
      activities,
      status: 7,
    };
  }

  for (let content of contents) {
    findTableIndexes(content).forEach(index => {
      let activity = parsePage(content, index);
      if (activity === undefined) {
        return;
      }

      activities.push(activity);
    });
  }

  return {
    activities,
    status: 0,
  };
};
