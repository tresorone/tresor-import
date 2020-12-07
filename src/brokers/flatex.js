import Big from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
  timeRegex,
} from '@/helper';

const getTableValueByKey = (textArr, startLineNumber, key) => {
  const finding = textArr.find(
    t =>
      textArr.indexOf(t, startLineNumber - 1) > startLineNumber &&
      t.match(new RegExp(key + '\\s*:\\s+'))
  );
  const result = finding
    ? finding.match(new RegExp(key + '\\s*:\\s+((\\s?\\S+\\s?\\S*)+)\\s*'))
    : null;
  return result ? result[1] : null;
};

const getHeaderValueByKey = (textArr, startLineNumber, key) => {
  const result = textArr.find(
    t => textArr.indexOf(t) >= startLineNumber && t.includes(key + ' ')
  );
  return result ? result.match(new RegExp(key + '\\s\\s+(.+)'))[1] : null;
};

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

const findISIN = (textArr, tableIndex) => {
  const isinStr = textArr[tableIndex].trim();
  const isinMatch = isinStr.match(/([A-Z]{2})((?![A-Z]{10})[A-Z0-9]{10})/);
  return isinMatch ? isinMatch[0] : null;
};

const findCompany = (textArr, tableIndex) => {
  const companyStr = textArr[tableIndex].trim();
  const companyMatch = companyStr.match(
    /Nr.\d+(\/\d)?\s+(Kauf|Verkauf)?(.*)\s+\(/
  );
  return companyMatch
    ? companyMatch[3].trim().replace(/ +(?= )/g, '')
    : undefined;
};

const findDateBuySell = (textArr, startLineNumber) =>
  getTableValueByKey(textArr, startLineNumber, 'Schlusstag')
    ? getTableValueByKey(textArr, startLineNumber, 'Schlusstag').split(', ')[0] // standard stock
    : getHeaderValueByKey(textArr, 0, 'Handelstag'); // etf

const findOrderTime = (textArr, startLineNumber) => {
  const lineWithOrderTime = getTableValueByKey(
    textArr,
    startLineNumber,
    'Schlusstag'
  );

  if (lineWithOrderTime !== null && timeRegex(false).test(lineWithOrderTime)) {
    return lineWithOrderTime.split(' ')[1].trim();
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

const findShares = (textArr, startLineNumber) =>
  parseGermanNum(
    getTableValueByKey(textArr, startLineNumber, 'Ordervolumen')
      ? getTableValueByKey(textArr, startLineNumber, 'Ordervolumen').split(
          ' '
        )[0] // stock
      : getTableValueByKey(textArr, startLineNumber, 'Ausgeführt')
      ? getTableValueByKey(textArr, startLineNumber, 'Ausgeführt').split(' ')[0] // etf
      : getTableValueByKey(textArr, startLineNumber, 'St.').split(' ')[0] // dividend
  );

const findPrice = (textArr, startLineNumber) =>
  parseGermanNum(
    getTableValueByKey(textArr, startLineNumber, 'Kurs').split(' ')[0]
  );

const findAmount = (textArr, startLineNumber) =>
  parseGermanNum(
    getTableValueByKey(textArr, startLineNumber, 'Kurswert').split(' ')[0]
  );

const findFee = (textArr, startLineNumber) => {
  const provision = getTableValueByKey(textArr, startLineNumber, 'Provision')
    ? parseGermanNum(
        getTableValueByKey(textArr, startLineNumber, 'Provision').split(' ')[0]
      )
    : 0;
  const ownExpenses = getTableValueByKey(
    textArr,
    startLineNumber,
    'Eigene Spesen'
  )
    ? parseGermanNum(
        getTableValueByKey(textArr, startLineNumber, 'Eigene Spesen').split(
          ' '
        )[0]
      )
    : 0;
  const foreignExpenses = getTableValueByKey(
    textArr,
    startLineNumber,
    'Fremde Spesen'
  )
    ? parseGermanNum(
        getTableValueByKey(textArr, startLineNumber, 'Fremde Spesen').split(
          ' '
        )[0]
      )
    : 0;

  return +Big(provision).plus(Big(ownExpenses)).plus(Big(foreignExpenses));
};

const findTax = (textArr, startLineNumber) =>
  getTableValueByKey(textArr, startLineNumber, 'Einbeh. Steuer')
    ? parseGermanNum(
        getTableValueByKey(textArr, startLineNumber, 'Einbeh. Steuer').split(
          ' '
        )[0]
      )
    : getTableValueByKey(textArr, startLineNumber, 'Einbeh. KESt')
    ? parseGermanNum(
        getTableValueByKey(textArr, startLineNumber, 'Einbeh. KESt').split(
          ' '
        )[0]
      )
    : 0;

const findDividendTax = (textArr, startLineNumber) => {
  const assessmentBasis = getTableValueByKey(
    textArr,
    startLineNumber,
    'grundlage'
  )
    ? parseGermanNum(
        getTableValueByKey(textArr, startLineNumber, 'grundlage').split(' ')[0]
      )
    : 0; // Bemessungsgrundlage
  const netDividend = getTableValueByKey(textArr, startLineNumber, 'Endbetrag')
    ? parseGermanNum(
        getTableValueByKey(textArr, startLineNumber, 'Endbetrag').split(' ')[0]
      )
    : 0;

  return assessmentBasis > 0
    ? +Big(assessmentBasis).minus(Big(netDividend))
    : 0;
};

const findDateDividend = (textArr, startLineNumber) =>
  getTableValueByKey(textArr, startLineNumber, 'Valuta');

const findPayout = (textArr, startLineNumber) => {
  const assessmentBasis = getTableValueByKey(
    textArr,
    startLineNumber,
    'grundlage'
  )
    ? parseGermanNum(
        getTableValueByKey(textArr, startLineNumber, 'grundlage').split(' ')[0]
      )
    : 0; // Bemessungsgrundlage

  if (assessmentBasis <= 0) {
    const payoutForeign = getTableValueByKey(
      textArr,
      startLineNumber,
      'Bruttodividende'
    ).split(' ')[0];
    const conversionRate = getTableValueByKey(
      textArr,
      startLineNumber,
      'Devisenkurs'
    ).split(' ')[0];
    return +Big(parseGermanNum(payoutForeign)).div(
      parseGermanNum(conversionRate)
    );
  }
  return assessmentBasis;
};

const lineContains = (textArr, lineNumber, value) =>
  textArr[lineNumber].includes(value);

export const canParsePage = (content, extension) =>
  extension === 'pdf' &&
  content.some(
    line =>
      line.includes('flatex Bank AG') || line.includes('FinTech Group Bank AG')
  ) &&
  (content.some(line => line.includes('Kauf')) ||
    content.some(line => line.includes('Verkauf')) ||
    content.some(line => line.includes('Dividendengutschrift')) ||
    content.some(line => line.includes('Ertragsmitteilung')));

const parsePage = (textArr, startLineNumber) => {
  let type,
    date,
    datetime,
    time,
    isin,
    company,
    shares,
    price,
    amount,
    fee,
    tax;

  if (lineContains(textArr, startLineNumber, 'Kauf')) {
    type = 'Buy';
    isin = findISIN(textArr, startLineNumber);
    company = findCompany(textArr, startLineNumber);
    date = findDateBuySell(textArr, startLineNumber);
    time = findOrderTime(textArr, startLineNumber);
    shares = findShares(textArr, startLineNumber);
    amount = findAmount(textArr, startLineNumber);
    price = findPrice(textArr, startLineNumber);
    fee = findFee(textArr, startLineNumber);
    tax = 0;
  } else if (lineContains(textArr, startLineNumber, 'Verkauf')) {
    type = 'Sell';
    isin = findISIN(textArr, startLineNumber);
    company = findCompany(textArr, startLineNumber);
    date = findDateBuySell(textArr, startLineNumber);
    time = findOrderTime(textArr, startLineNumber);
    shares = findShares(textArr, startLineNumber);
    amount = findAmount(textArr, startLineNumber);
    price = findPrice(textArr, startLineNumber);
    fee = findFee(textArr, startLineNumber);
    tax = findTax(textArr, startLineNumber);
  } else if (
    lineContains(textArr, startLineNumber - 3, 'Dividendengutschrift') ||
    lineContains(textArr, startLineNumber - 3, 'Ertragsmitteilung')
  ) {
    type = 'Dividend';
    isin = findISIN(textArr, startLineNumber);
    company = findCompany(textArr, startLineNumber);
    date = findDateDividend(textArr, startLineNumber);
    shares = findShares(textArr, startLineNumber);
    amount = findPayout(textArr, startLineNumber);
    price = amount / shares;
    fee = 0;
    tax = findDividendTax(textArr, startLineNumber);
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
    price,
    amount,
    fee,
    tax,
  };
  return validateActivity(activity);
};

export const parsePages = contents => {
  let activities = [];
  for (let content of contents) {
    try {
      findTableIndexes(content).forEach(index => {
        let activity = parsePage(content, index);
        if (activity === undefined) {
          return;
        }
        activities.push(activity);
      });
    } catch (exception) {
      console.error('Error while parsing page (flatex)', exception, content);
    }
  }

  return {
    activities,
    status: 0,
  };
};
