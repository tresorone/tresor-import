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

const findDateBuySell = textArr =>
  getValueByPreviousElement(textArr, 'Schlusstag').split(' ')[0];

const findTimeBuySell = content => {
  const lineContent = getValueByPreviousElement(content, '-Zeit');
  if (lineContent === '' || !timeRegex(true).test(lineContent)) {
    return undefined;
  }

  return lineContent.split(' ')[1].trim();
};

const findPrice = textArr =>
  parseGermanNum(
    getValueByPreviousElement(textArr, 'Ausführungskurs').split(' ')[0]
  );

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

const findPayout = textArr => {
  let index = textArr.indexOf('Ausschüttung');
  if (index < 0) index = textArr.lastIndexOf('Dividendengutschrift');
  const currency = textArr[index + 2];
  const eurAmount =
    currency === 'EUR' ? textArr[index + 1] : textArr[index + 3];
  return parseGermanNum(eurAmount.split(' ')[0]);
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

export const canParseDocument = (pages, extension) => {
  const allPages = pages.flat();
  return (
    extension === 'pdf' &&
    allPages.some(line => line.includes('BIC BYLADEM1001')) &&
    (isBuy(allPages) || isSell(allPages) || isDividend(allPages))
  );
};

export const parsePages = pages => {
  const allPages = pages.flat();

  let type, amount, price, date, time;
  const pieceIdx = allPages.findIndex(t => t.includes('Stück'));
  const isinIdx = findISINIdx(allPages, pieceIdx);
  const isin = allPages[isinIdx];
  const company = findCompany(allPages, pieceIdx, isinIdx);
  const shares = findShares(allPages, pieceIdx);
  const fee = findFee(pages);
  const tax = findTax(pages);

  if (isBuy(allPages)) {
    type = 'Buy';
    amount = findAmount(allPages);
    price = findPrice(allPages);
    date = findDateBuySell(allPages);
    time = findTimeBuySell(allPages);
  } else if (isSell(allPages)) {
    type = 'Sell';
    amount = findAmount(allPages);
    price = findPrice(allPages);
    date = findDateBuySell(allPages);
    time = findTimeBuySell(allPages);
  } else if (isDividend(allPages)) {
    type = 'Dividend';
    amount = findPayout(allPages);
    price = amount / shares;
    date = findDateDividend(allPages);
  }

  const [parsedDate, parsedDateTime] = createActivityDateTime(
    date,
    time,
    'dd.MM.yyyy',
    'dd.MM.yyyy HH:mm:ss'
  );

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

  return {
    activities: [validateActivity(activity)],
    status: 0,
  };
};
