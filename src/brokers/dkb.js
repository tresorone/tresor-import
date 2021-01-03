import { Big } from 'big.js';
import {
  createActivityDateTime,
  findFirstIsinIndexInArray,
  parseGermanNum,
  timeRegex,
  validateActivity,
} from '@/helper';

const getValueByPreviousElement = (textArr, prev) => {
  const index = textArr.findIndex(t => t.includes(prev));
  if (index < 0) {
    return '';
  }

  return textArr[index + 1];
};

const findShares = (textArr, pieceIdx) => {
  return parseGermanNum(textArr[pieceIdx].split(' ')[1]);
};

const findISINIdx = (textArr, pieceIdx) => {
  return pieceIdx + findFirstIsinIndexInArray(textArr.slice(pieceIdx));
};

const findCompany = (textArr, pieceIdx, isinIdx) =>
  textArr
    .slice(pieceIdx + 1, isinIdx)
    .join(' ')
    .trim();

const findDateBuySell = content => {
  // Use normaly the closing date for market orders.
  let dateLine = getValueByPreviousElement(content, 'Schlusstag');

  if (dateLine === '') {
    // Sometimes a currency fx rate has a givven date:
    // Devisenkursdatum
    // 10.03.2016
    dateLine = getValueByPreviousElement(content, 'Devisenkursdatum');
  }

  if (dateLine === '') {
    // Sometimes a date is set in the currency fx rate line:
    // Devisenkurs (EUR/CAD) 1,5268 vom 14.04.2020
    const lineIndex = content.findIndex(line => line.includes('Devisenkurs '));
    const regex = /(\d{2}\.\d{2}\.\d{4})/;
    if (lineIndex > 0 && regex.test(content[lineIndex])) {
      dateLine = regex.exec(content[lineIndex])[0];
    }
  }

  if (dateLine === '') {
    // Last one: Get the date of the document. This is not the real order date but it's better than nothing.
    dateLine = getValueByPreviousElement(content, 'Datum');
  }

  return dateLine.split(' ')[0];
};

const findTimeBuySell = content => {
  const lineContent = getValueByPreviousElement(content, '-Zeit');
  if (lineContent === '' || !timeRegex(true).test(lineContent)) {
    return undefined;
  }

  return lineContent.split(' ')[1].trim();
};

const findPrinceLine = content => {
  let priceLine = getValueByPreviousElement(content, 'Ausführungskurs');

  if (priceLine === '') {
    priceLine = getValueByPreviousElement(content, 'Abrech.-Preis');
  }

  return priceLine;
};

const findPrice = content =>
  parseGermanNum(findPrinceLine(content).split(' ')[0]);

const findPriceCurrency = content =>
  parseGermanNum(findPrinceLine(content).split(' ')[1]);

const findAmount = textArr =>
  parseGermanNum(getValueByPreviousElement(textArr, 'Kurswert').trim());

const findFee = pages => {
  let totalFee = Big(0);

  pages.forEach(page => {
    const provisionValue = getValueByPreviousElement(page, 'Provision');
    if (provisionValue !== '') {
      totalFee = totalFee.plus(
        Big(parseGermanNum(provisionValue.split(' ')[0].trim()))
      );
    }

    const abwicklungskostenValue = getValueByPreviousElement(
      page,
      'Abwicklungskosten Börse'
    );
    if (abwicklungskostenValue !== '') {
      totalFee = totalFee.plus(Big(parseGermanNum(abwicklungskostenValue)));
    }

    const transactionValue = getValueByPreviousElement(
      page,
      'Transaktionsentgelt Börse'
    );
    if (transactionValue !== '') {
      totalFee = totalFee.plus(Big(parseGermanNum(transactionValue)));
    }

    const transferValue = getValueByPreviousElement(
      page,
      'Übertragungs-/Liefergebühr'
    );
    if (transferValue !== '') {
      totalFee = totalFee.plus(Big(parseGermanNum(transferValue)));
    }
  });

  return +totalFee;
};

const findDateDividend = textArr =>
  getValueByPreviousElement(textArr, 'Zahlbarkeitstag').split(' ')[0];

const findPayout = (content, baseCurrency) => {
  let payoutLineIndex = content.indexOf('Ausschüttung');
  if (payoutLineIndex < 0) {
    // Some documents have the payout amount after the last:
    // Dividendengutschrift
    payoutLineIndex = content.lastIndexOf('Dividendengutschrift');
  }

  if (payoutLineIndex < 0) {
    // Some documents have the payout amount after:
    // Dividendengutschrift nach § 27 KStG
    payoutLineIndex = content.findIndex(line =>
      line.includes('Dividendengutschrift')
    );
  }

  const currencyLine = content[payoutLineIndex + 2];
  const payout =
    currencyLine === baseCurrency
      ? content[payoutLineIndex + 1]
      : content[payoutLineIndex + 3];

  return Big(parseGermanNum(payout.split(/\s+/)[0]));
};

const findTax = pages => {
  let totalTax = Big(0);

  pages.forEach(page => {
    let withholdingTaxIndex = page.findIndex(
      line =>
        line.startsWith('Anrechenbare Quellensteuer') && line.endsWith('EUR')
    );

    let withholdingTax = 0;
    if (page[withholdingTaxIndex + 2] === 'EUR') {
      // Its possible that there is a withholding tax but this has no effect to this statement. Se the following example:
      // Anrechenbare Quellensteuer 4,29- EUR
      // Verrechnete anrechenbare Quellensteuer
      // 17,16-
      // EUR
      withholdingTax =
        withholdingTaxIndex >= 0
          ? parseGermanNum(page[withholdingTaxIndex + 1])
          : 0;
    }

    const kap = parseGermanNum(
      // We want to geht the line `Kapitalertragsteuer 25 % auf 3,15 EUR` and not `Berechnungsgrundlage für
      // die Kapitalertragsteuer` so we need to match `Kapitalertragsteuer ` with a space at the End.
      getValueByPreviousElement(page, 'Kapitalertragsteuer ').split(' ')[0]
    );
    const soli = parseGermanNum(
      getValueByPreviousElement(page, 'Solidaritätszuschlag').split(' ')[0]
    );
    const churchTax = parseGermanNum(
      getValueByPreviousElement(page, 'Kirchensteuer').split(' ')[0]
    );

    totalTax = totalTax
      .plus(kap)
      .plus(soli)
      .plus(churchTax)
      .plus(withholdingTax);
  });

  return +totalTax;
};

// This function returns an array with: fxRate, foreignCurrency, baseCurrency (or undefined).
const findForeignInformation = content => {
  let fxRate, foreignCurrency, baseCurrency;

  let fxRateLineIndex = content.findIndex(line => line === 'Devisenkurs');
  if (fxRateLineIndex > 0) {
    // Get the fxRate and the currency from:
    // Devisenkurs
    // EUR / USD
    // 1,1011
    fxRate = content[fxRateLineIndex + 2];
    foreignCurrency = content[fxRateLineIndex + 1].split('/')[1].trim();
  } else {
    fxRateLineIndex = content.findIndex(line => line.includes('Devisenkurs '));
    if (fxRateLineIndex > 0) {
      // Match the fxRate and the currency from:
      // Devisenkurs (EUR/CAD) 1,5268 vom 14.04.2020
      const lineContent = content[fxRateLineIndex];
      fxRate = lineContent.split(/\s+/)[2];
      foreignCurrency = lineContent.split('/')[1].substring(0, 3);
    }
  }

  const baseCurrencyLineIndex = content.findIndex(
    line => line === 'Ausmachender Betrag'
  );
  if (baseCurrencyLineIndex) {
    baseCurrency = content[baseCurrencyLineIndex + 2];
  }

  return [Big(parseGermanNum(fxRate)), foreignCurrency, baseCurrency];
};

const isBuy = textArr =>
  textArr.some(
    t =>
      t.includes('Wertpapier Abrechnung Kauf') ||
      t.includes('Wertpapier Abrechnung Ausgabe Investmentfonds')
  );

const isSell = textArr =>
  textArr.some(
    t =>
      t.includes('Wertpapier Abrechnung Verkauf') ||
      t.includes('Wertpapier Abrechnung Rücknahme')
  );

const isDividend = textArr =>
  textArr.some(
    t =>
      t.includes('Dividendengutschrift') ||
      t.includes('Ausschüttung Investmentfonds')
  );

const detectedButIgnoredDocument = content => {
  return (
    // When the document contains one of the following lines, we want to ignore these document.
    content.some(line => line.includes('Auftragsbestätigung')) ||
    content.some(line => line.includes('Streichungsbestätigung')) ||
    content.some(line => line.includes('Ausführungsanzeige'))
  );
};

export const canParseDocument = (pages, extension) => {
  const allPages = pages.flat();
  return (
    extension === 'pdf' &&
    (allPages.some(line => line.includes('BIC BYLADEM1001')) ||
      allPages[0] === '10919 Berlin') &&
    (isBuy(allPages) ||
      isSell(allPages) ||
      isDividend(allPages) ||
      detectedButIgnoredDocument(allPages))
  );
};

export const parsePages = pages => {
  const allPages = pages.flat();

  if (detectedButIgnoredDocument(pages.flat())) {
    // We know this type and we don't want to support it.
    return {
      activities: [],
      status: 7,
    };
  }

  let type,
    amount,
    price,
    priceCurrency,
    date,
    time,
    fxRate,
    foreignCurrency,
    baseCurrency;

  const pieceIdx = allPages.findIndex(t => t.includes('Stück'));
  const isinIdx = findISINIdx(allPages, pieceIdx);
  const isin = allPages[isinIdx];
  const company = findCompany(allPages, pieceIdx, isinIdx);
  const shares = findShares(allPages, pieceIdx);
  const fee = findFee(pages);
  const tax = findTax(pages);

  [fxRate, foreignCurrency, baseCurrency] = findForeignInformation(allPages);

  const canConvertCurrency =
    fxRate !== undefined &&
    foreignCurrency !== undefined &&
    foreignCurrency != baseCurrency;

  if (isBuy(allPages)) {
    type = 'Buy';
    amount = findAmount(allPages);
    price = findPrice(allPages);
    priceCurrency = findPriceCurrency(allPages);
    date = findDateBuySell(allPages);
    time = findTimeBuySell(allPages);
  } else if (isSell(allPages)) {
    type = 'Sell';
    amount = findAmount(allPages);
    price = findPrice(allPages);
    priceCurrency = findPriceCurrency(allPages);
    date = findDateBuySell(allPages);
    time = findTimeBuySell(allPages);
  } else if (isDividend(allPages)) {
    const payout = findPayout(allPages, baseCurrency);
    type = 'Dividend';
    amount = +payout;
    price = +payout.div(shares);
    date = findDateDividend(allPages);
  }

  const [parsedDate, parsedDateTime] = createActivityDateTime(
    date,
    time,
    'dd.MM.yyyy',
    'dd.MM.yyyy HH:mm:ss'
  );

  if (
    priceCurrency !== undefined &&
    canConvertCurrency &&
    (type === 'Buy' || type === 'Sell')
  ) {
    // For buy and sell documents we need to convert the currency to the base currency (when possible).
    price = +Big(price).div(fxRate);
  }

  const activity = {
    broker: 'dkb',
    type,
    date: parsedDate,
    datetime: parsedDateTime,
    isin,
    company,
    shares,
    price,
    amount,
    fee,
    tax,
  };

  if (canConvertCurrency) {
    activity.fxRate = +fxRate;
    activity.foreignCurrency = foreignCurrency;
  }

  return {
    activities: [validateActivity(activity)],
    status: 0,
  };
};
