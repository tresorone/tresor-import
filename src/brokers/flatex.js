import Big from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
  timeRegex,
} from '@/helper';

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

const findShares = (textArr, startLineNumber) => {
  return parseGermanNum(
    getTableValueByKey(textArr, startLineNumber, 'Ordervolumen')
      ? getTableValueByKey(textArr, startLineNumber, 'Ordervolumen').split(
          ' '
        )[0] // stock
      : getTableValueByKey(textArr, startLineNumber, 'Ausgeführt')
      ? getTableValueByKey(textArr, startLineNumber, 'Ausgeführt').split(' ')[0] // etf
      : getTableValueByKey(textArr, startLineNumber, 'St.').split(' ')[0] // dividend
  );
};

const findPrice = (textArr, startLineNumber) =>
  parseGermanNum(
    getTableValueByKey(textArr, startLineNumber, 'Kurs').split(' ')[0]
  );

const findAmount = (textArr, startLineNumber) =>
  parseGermanNum(
    findTableValueByKeyWithDocumentFormat(textArr, startLineNumber, 'Kurswert')
  );

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

const findDateDividend = (textArr, startLineNumber) => {
  const date = getTableValueByKey(textArr, startLineNumber, 'Valuta', 1);
  if (/\d{2}.\d{2}.\d{4}/.test(date)) {
    return date;
  }

  return getTableValueByKey(textArr, startLineNumber, 'Valuta', 2);
};

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
    let payoutForeign = getTableValueByKey(
      textArr,
      startLineNumber,
      'Bruttodividende'
    );

    if (payoutForeign === null) {
      payoutForeign = getTableValueByKey(
        textArr,
        startLineNumber,
        'Bruttoausschüttung'
      );
    }

    if (payoutForeign !== null) {
      let conversionRate = getTableValueByKey(
        textArr,
        startLineNumber,
        'Devisenkurs',
        1
      );

      if (conversionRate != null && conversionRate.trim().length === 0) {
        // In some formats we need to match the second group, when only the `Devisenkurs` is in the line:
        // Devisenkurs     :        1,113700
        // insead of
        // Devisenkurs     :    1,157900         *Einbeh. Steuer     :         0,00 EUR
        conversionRate = getTableValueByKey(
          textArr,
          startLineNumber,
          'Devisenkurs',
          2
        );
      }

      if (conversionRate === null) {
        return parseGermanNum(payoutForeign.split(' ')[0]);
      }

      return +Big(parseGermanNum(payoutForeign.split(' ')[0])).div(
        parseGermanNum(conversionRate.split(' ')[0])
      );
    }
  }

  return assessmentBasis;
};

const lineContains = (textArr, lineNumber, value) =>
  textArr[lineNumber].includes(value);

export const canParseFirstPage = (content, extension) =>
  extension === 'pdf' &&
  content.some(
    line =>
      line.includes('flatex Bank AG') ||
      line.includes('FinTech Group Bank AG') ||
      line.includes('biw AG')
  ) &&
  (content.some(line => line.includes('Kauf')) ||
    content.some(line => line.includes('Verkauf')) ||
    content.some(line => line.includes('Dividendengutschrift')) ||
    content.some(line => line.includes('Ertragsmitteilung')));

const detectedButIgnoredDocument = content => {
  return (
    // When the document contains one of the following lines, we want to ignore these document.
    content.some(line => line.toLowerCase().includes('auftragsbestätigung'))
  );
};

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

  if (detectedButIgnoredDocument(contents.flat())) {
    // We know this type and we don't want to support it.
    return {
      activities,
      status: 7,
    };
  }

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
