import format from 'date-fns/format';
import parse from 'date-fns/parse';
import Big from 'big.js';

import {
  parseGermanNum,
  validateActivity,
  findFirstIsinIndexInArray,
} from '@/helper';

const findISIN = textArr => {
  return textArr[findFirstIsinIndexInArray(textArr)];
};

const findWKN = textArr => {
  // for older dividend files
  const wknIndexOld = textArr.findIndex(line => line.includes('WKN: '));
  if (wknIndexOld >= 0) {
    return textArr[wknIndexOld].split(/\s+/)[3];
  }
  // for newer dividend files
  const wknStringIndex = textArr.findIndex(line => line === 'WKN');
  if (wknStringIndex >= 0) {
    const wknIndexOffset = findFirstIsinIndexInArray(
      textArr.slice(wknStringIndex)
    );
    return textArr[wknStringIndex + wknIndexOffset - 1];
  }
  return undefined;
};

const findCompany = textArr => {
  let indexIsinWkn = textArr.findIndex(line => line === 'ISIN');
  // For older documents there is only a wkn
  if (indexIsinWkn < 0) {
    indexIsinWkn = textArr.findIndex(line => line.includes('WKN: '));
  }
  const name_index_one = textArr[indexIsinWkn + 1];
  // Sometimes a company name is split in two during JSONifying. Only
  // happens in newer documents that have an isin
  if (findFirstIsinIndexInArray(textArr.slice(indexIsinWkn)) > 3) {
    return name_index_one.concat(' ', textArr[indexIsinWkn + 2]);
  }
  return name_index_one;
};

const findDateBuySell = textArr => {
  // Before 12/2015 the headline is 'Wertpapierabrechnung'
  const idx = textArr.findIndex(
    t =>
      t.toLowerCase() === 'orderabrechnung' ||
      t.toLowerCase() === 'wertpapierabrechnung'
  );
  return textArr[idx + 2].substr(3, 10).trim();
};

const findDateDividend = textArr => {
  const keyword = 'valuta';
  const dateLine = textArr.find(t => t.toLowerCase().includes(keyword));
  if (dateLine !== undefined) {
    return dateLine.substr(keyword.length).trim();
  }

  const keywordOld = 'EX-TAG';
  const dateLineOld = textArr.find(t => t.includes(keywordOld));
  if (dateLineOld !== undefined) {
    return dateLineOld.substr(keywordOld.length).trim();
  }
};

const findShares = textArr => {
  const idx = textArr.findIndex(t => t.toLowerCase() === 'umsatz');
  const shares = textArr[idx + 2];

  return parseGermanNum(shares);
};

const findDividendShares = textArr => {
  const idx = textArr.findIndex(line => line.toLowerCase() === 'bestand');
  // For newer files:
  if (idx >= 0) {
    return parseGermanNum(textArr[idx + 1].split(' ')[0]);
  }
  // For older files:
  else {
    const idxOld = textArr.findIndex(line => line === 'DIVIDENDENGUTSCHRIFT');
    if (idxOld >= 0) {
      return parseGermanNum(textArr[idxOld + 1].split(/\s+/)[1]);
    }
  }
};

const findAmount = (textArr, type) => {
  let amount, idx;

  if (type === 'Buy' || type === 'Sell') {
    idx = textArr.indexOf('Kurswert');
    // Documents before 12/2015 have an empty line after 'Kurswert'
    const hasEmptyLineAfterAmountLabel = textArr[idx + 1] === '';
    amount = hasEmptyLineAfterAmountLabel ? textArr[idx + 3] : textArr[idx + 2];
  } else if (type === 'Dividend') {
    const oldDividendFile = textArr.some(
      line => line.includes('IBAN') && line !== 'IBAN'
    );
    if (!oldDividendFile) {
      // "Brutto in EUR" is only present if the dividend is paid in a foreign currency, otherwise its just "Brutto"
      idx = textArr.indexOf('Brutto in EUR');
      if (idx < 0) {
        idx = textArr.indexOf('Brutto');
      }
      if (idx >= 0) {
        amount = textArr[idx + 1].split(' ')[0];
      }
    } else {
      idx = textArr.findIndex(line => line.includes('BRUTTO'));
      if (idx >= 0) {
        amount = textArr[idx].split(/\s+/)[2];
      }
    }
  }
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

const findDividendTax = (textArr, amount) => {
  // For older dividend files:
  const netAmountIndex = textArr.findIndex(line => line.includes('WERT'));
  if (netAmountIndex >= 0) {
    const netAmount = parseGermanNum(textArr[netAmountIndex].split(/\s+/)[3]);
    return +Big(amount).minus(netAmount);
  }

  // For newer dividend files
  const netAmountIndexNew = textArr.findIndex(
    line => line === 'Netto zugunsten' || line === 'Netto zulasten'
  );
  if (netAmountIndexNew >= 0) {
    const netAmount = parseGermanNum(
      textArr[netAmountIndexNew + 4].split(/\s+/)[0]
    );
    return +Big(amount).minus(netAmount);
  }
};

const findForeignInformation = textArr => {
  const foreignInfo = textArr.findIndex(line => line.includes('Devisenkurs'));
  if (foreignInfo >= 0) {
    const foreignInfoLine = textArr[foreignInfo+1].split(/\s+/)
    return [parseGermanNum(foreignInfoLine[0]), foreignInfoLine[1]]
  }
  return [undefined, undefined]

};

const isBuy = textArr => {
  // Before 12/2015 the headline is 'Wertpapierabrechnung'
  const idx = textArr.findIndex(
    t =>
      t.toLowerCase() === 'orderabrechnung' ||
      t.toLowerCase() === 'wertpapierabrechnung'
  );
  return idx >= 0 && textArr[idx + 1].toLowerCase() === 'kauf';
};

const isSell = textArr => {
  // Before 12/2015 the headline is 'Wertpapierabrechnung'
  const idx = textArr.findIndex(
    t =>
      t.toLowerCase() === 'orderabrechnung' ||
      t.toLowerCase() === 'wertpapierabrechnung'
  );
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

  return isBuy(content) || isSell(content) || isDividend(content);
};

const parseData = textArr => {
  let type, date, shares, amount, fee, tax, fxRate, foreignCurrency;

  const isin = findISIN(textArr);
  const company = findCompany(textArr);
  const wkn = findWKN(textArr);
  if (isBuy(textArr)) {
    type = 'Buy';
    date = findDateBuySell(textArr);
    shares = findShares(textArr);
    amount = findAmount(textArr, 'Buy');
    fee = findFee(textArr);
    tax = 0;
  } else if (isSell(textArr)) {
    type = 'Sell';
    date = findDateBuySell(textArr);
    shares = findShares(textArr);
    amount = findAmount(textArr, 'Sell');
    fee = findFee(textArr);
    tax = findTax(textArr);
  } else if (isDividend(textArr)) {
    type = 'Dividend';
    date = findDateDividend(textArr);
    shares = findDividendShares(textArr);
    amount = findAmount(textArr, 'Dividend');
    fee = 0;
    tax = findDividendTax(textArr, amount);
    [fxRate, foreignCurrency] = findForeignInformation(textArr);
  }
  let activity = {
    broker: 'consorsbank',
    type,
    date: format(parse(date, 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd'),
    company,
    shares,
    price: +Big(amount).div(Big(shares)),
    amount,
    fee,
    tax,
  };
  if (wkn !== undefined) {
    activity.wkn = wkn;
  }
  if (isin !== undefined) {
    activity.isin = isin;
  }
  if (fxRate !== undefined) {
    activity.fxRate = fxRate;
  }
  if (foreignCurrency !== undefined) {
    activity.foreignCurrency = foreignCurrency;
  }
  return validateActivity(activity);
};

export const parsePages = contents => {
  const activities = [parseData(contents[0])];

  return {
    activities,
    status: 0,
  };
};
