import format from 'date-fns/format';
import parse from 'date-fns/parse';
import Big from 'big.js';

import {
  parseGermanNum,
  validateActivity,
  findFirstIsinIndexInArray,
} from '@/helper';

const findISIN = text => {
  return text[findFirstIsinIndexInArray(text)];
};

const findCompany = text => {
  // Sometimes a company name is split in two during JSONifying.
  const indexIsinString = text.findIndex(t => t === 'ISIN');
  const name_index_one = text[indexIsinString + 1];
  if (findFirstIsinIndexInArray(text.slice(indexIsinString)) > 3) {
    return name_index_one.concat(' ', text[indexIsinString + 2]);
  }
  return name_index_one;
};

const findDateBuySell = textArr => {
  const idx = textArr.findIndex(t => t.toLowerCase() === 'orderabrechnung');
  return textArr[idx + 2].substr(3, 10).trim();
};

const findDateDividend = textArr => {
  const keyword = 'valuta';
  const dateLine = textArr.find(t => t.toLowerCase().includes(keyword));
  return dateLine.substr(keyword.length).trim();
};

const findShares = textArr => {
  const idx = textArr.findIndex(t => t.toLowerCase() === 'umsatz');
  const shares = textArr[idx + 2];

  return parseGermanNum(shares);
};

const findDividendShares = textArr => {
  const idx = textArr.findIndex(t => t.toLowerCase() === 'bestand');
  const sharesLine = textArr[idx + 1];
  const shares = sharesLine.split(' ')[0];

  return parseGermanNum(shares);
};

const findAmount = textArr => {
  const idx = textArr.findIndex(t => t.toLowerCase() === 'kurswert');
  const amount = textArr[idx + 2];

  return parseGermanNum(amount);
};

const findPayout = textArr => {
  const idx = textArr.findIndex(t =>
    ['brutto in eur', 'brutto'].includes(t.toLowerCase())
  );
  const amount = textArr[idx + 1].split(' ')[0];

  return parseGermanNum(amount);
};

const findFee = textArr => {
  const brokerageIdx = textArr.findIndex(t => t.toLowerCase() === 'provision');
  const brokerage = brokerageIdx >= 0 ? textArr[brokerageIdx + 2] : null;
  const baseFeeIdx = textArr.findIndex(t => t.toLowerCase() === 'grundgebühr');
  const baseFee = baseFeeIdx >= 0 ? textArr[baseFeeIdx + 2] : null;

  const sum = +Big(parseGermanNum(brokerage)).plus(
    Big(parseGermanNum(baseFee))
  );

  return Math.abs(sum);
};

const findTax = textArr => {
  const kapstIdx = textArr.findIndex(t => t.toLowerCase() === 'kapst');
  const solzIdx = textArr.findIndex(t => t.toLowerCase() === 'solz');

  const kapst = kapstIdx >= 0 ? textArr[kapstIdx + 3] : null;
  const solz = solzIdx >= 0 ? textArr[solzIdx + 3] : null;
  const sum = +Big(parseGermanNum(kapst)).plus(Big(parseGermanNum(solz)));

  return Math.abs(sum);
};

const findDividendTax = textArr => {
  const sum = textArr.reduce((acc, t, i) => {
    // is addition (Zuschlag)
    const isAddition = t.toLowerCase().includes('zuschlag');

    // is withholding tax (Quellensteuer)
    const isWithholdingTax = t.toLowerCase().includes('quellensteuer');

    // is tax, excl. irrelevant withholding tax lines
    const isTax =
      t.toLowerCase().includes('steuer') &&
      !t.toLowerCase().includes('anrechenbare quellensteuer') &&
      !t.toLowerCase().includes('abzgl. quellensteuer');

    if (isTax || isAddition) {
      const offset = isWithholdingTax ? 1 : 3;
      const [amount, currency] = textArr[i + offset].split(' ');

      // ignore all USD taxes
      if (currency !== 'USD') {
        return acc.plus(Big(parseGermanNum(amount)));
      }
    }

    return acc;
  }, Big(0));

  return Math.abs(+sum);
};

const isBuy = textArr => {
  const idx = textArr.findIndex(t => t.toLowerCase() === 'orderabrechnung');
  return idx >= 0 && textArr[idx + 1].toLowerCase() === 'kauf';
};

const isSell = textArr => {
  const idx = textArr.findIndex(t => t.toLowerCase() === 'orderabrechnung');
  return idx >= 0 && textArr[idx + 1].toLowerCase() === 'verkauf';
};

const isDividend = textArr =>
  textArr.some(t =>
    ['ertragsgutschrift', 'dividendengutschrift'].includes(t.toLowerCase())
  );

export const canParsePage = (content, extension) => {
  if (extension !== 'pdf') {
    return false;
  }

  const isConsors = content.some(
    line => line.toLowerCase && line.toLowerCase().includes('consorsbank')
  );

  if (!isConsors) {
    return false;
  }

  const isSupportedType =
    isBuy(content) || isSell(content) || isDividend(content);

  const isOldFormat = content.some(
    line => line.includes('IBAN') && line !== 'IBAN'
  );

  return isSupportedType && !isOldFormat;
};

const parseData = textArr => {
  let type, date, isin, company, shares, price, amount, fee, tax;

  if (isBuy(textArr)) {
    type = 'Buy';
    isin = findISIN(textArr);
    company = findCompany(textArr);
    date = findDateBuySell(textArr);
    shares = findShares(textArr);
    amount = findAmount(textArr);
    price = +Big(amount).div(Big(shares));
    fee = findFee(textArr);
    tax = 0;
  } else if (isSell(textArr)) {
    type = 'Sell';
    isin = findISIN(textArr);
    company = findCompany(textArr);
    date = findDateBuySell(textArr);
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
    shares = findDividendShares(textArr);
    amount = findPayout(textArr);
    price = +Big(amount).div(Big(shares));
    fee = 0;
    tax = findDividendTax(textArr);
  }
  return validateActivity({
    broker: 'consorsbank',
    type,
    date: format(parse(date, 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd'),
    isin,
    company,
    shares,
    price,
    amount,
    fee,
    tax,
  });
};

export const parsePages = contents => {
  const activities = [parseData(contents[0])];

  return {
    activities,
    status: 0,
  };
};
