import { Big } from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
  timeRegex,
} from '@/helper';

const offsets = {
  shares: 0,
  companyName: 1,
  isin: 3,
};

const getValueByPreviousElement = (textArr, prev) => {
  const index = textArr.findIndex(t => t.includes(prev));
  if (index < 0) {
    return '';
  }

  return textArr[index + 1];
};

const findTableIndex = textArr => textArr.findIndex(t => t.includes('Stück'));

const findShares = textArr =>
  parseGermanNum(
    textArr[findTableIndex(textArr) + offsets.shares].split(' ')[1]
  );

const findISIN = textArr => {
  const isin = textArr[findTableIndex(textArr) + offsets.isin].trim();
  return /^([A-Z]{2})((?![A-Z]{10})[A-Z0-9]{10})$/.test(isin) ? isin : null;
};

const findCompany = textArr =>
  textArr[findTableIndex(textArr) + offsets.companyName].trim();

const findDateBuySell = textArr =>
  getValueByPreviousElement(textArr, 'Schlusstag').split(' ')[0];

const findOrderTime = content => {
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
    const withholdingTaxIndex = page.findIndex(
      t => t.startsWith('Anrechenbare Quellensteuer') && t.endsWith('EUR')
    );
    const withholdingTax =
      withholdingTaxIndex >= 0
        ? parseGermanNum(page[withholdingTaxIndex + 1])
        : 0;

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

export const canParsePage = (content, extension) =>
  extension === 'pdf' &&
  content.some(line => line.includes('BIC BYLADEM1001')) &&
  (isBuy(content) || isSell(content) || isDividend(content));

export const parsePages = pages => {
  let type, date, time, isin, company, shares, price, amount, fee, tax;
  const firstPage = pages[0];

  if (isBuy(firstPage)) {
    type = 'Buy';
    isin = findISIN(firstPage);
    company = findCompany(firstPage);
    date = findDateBuySell(firstPage);
    time = findOrderTime(firstPage);
    shares = findShares(firstPage);
    amount = findAmount(firstPage);
    price = findPrice(firstPage);
    fee = findFee(pages);
    tax = findTax(pages);
  } else if (isSell(firstPage)) {
    type = 'Sell';
    isin = findISIN(firstPage);
    company = findCompany(firstPage);
    date = findDateBuySell(firstPage);
    time = findOrderTime(firstPage);
    shares = findShares(firstPage);
    amount = findAmount(firstPage);
    price = findPrice(firstPage);
    fee = findFee(pages);
    tax = findTax(pages);
  } else if (isDividend(firstPage)) {
    type = 'Dividend';
    isin = findISIN(firstPage);
    company = findCompany(firstPage);
    date = findDateDividend(firstPage);
    shares = findShares(firstPage);
    amount = findPayout(firstPage);
    price = amount / shares;
    fee = findFee(pages);
    tax = findTax(pages);
  }

  const [parsedDate, parsedDateTime] = createActivityDateTime(
    date,
    time,
    'dd.MM.yyyy',
    'dd.MM.yyyy HH:mm:ss'
  );

  return {
    activities: [
      validateActivity({
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
      }),
    ],
    status: 0,
  };
};
