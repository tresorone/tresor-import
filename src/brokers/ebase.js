import format from 'date-fns/format';
import parse from 'date-fns/parse';
import Big from 'big.js';
import { parseGermanNum, validateActivity } from '@/helper';

const parseShare = shareString => {
  try {
    return +Big(parseGermanNum(shareString)).abs();
  } catch (e) {
    if (e.message === '[big.js] Invalid number') {
      return undefined;
    } else {
      throw e; // re-throw the error unchanged
    }
  }
};

const parsePrice = priceString => {
  try {
    return +Big(parseGermanNum(priceString.split(' ')[0])).abs();
  } catch (e) {
    if (e.message === '[big.js] Invalid number') {
      return undefined;
    } else {
      throw e; // re-throw the error unchanged
    }
  }
};

const parseAmount = amountString => {
  try {
    return +Big(parseGermanNum(amountString.split(' ')[0])).abs();
  } catch (e) {
    if (e.message === '[big.js] Invalid number') {
      return undefined;
    } else {
      throw e; // re-throw the error unchanged
    }
  }
};

function verifyActivity(
  type,
  date,
  isin,
  company,
  shares,
  price,
  amount,
  tax,
  fee
) {
  const activity = {
    broker: 'ebase',
    type,
    date: format(parse(date, 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd'),
    isin,
    company,
    shares,
    price,
    amount,
    tax,
    fee,
  };
  return validateActivity(activity);
}

function parseBaseAction(pdfArray, i, actionType) {
  const type = actionType;
  const company = pdfArray[i + 1];
  const isin = pdfArray[i + 2];
  const shares = parseShare(pdfArray[i + 4]);
  const price = parsePrice(pdfArray[i + 5]);
  const date = pdfArray[i + 6];
  const amount = parseAmount(pdfArray[i + 7]);
  const tax = 0;
  const fee = 0;
  return verifyActivity(
    type,
    date,
    isin,
    company,
    shares,
    price,
    amount,
    tax,
    fee
  );
}

export const canParseData = (
  textArr // textArr.flat(t => t.startsWith('ebase Depot flex standard'));
) => textArr.some(t => t.includes('Fondsertrag / Vorabpauschale'));

export const parseData = pdfPages => {
  // Action can be: Fondsertrag (Ausschüttung), Ansparplan, Wiederanlage Fondsertrag, Entgelt Verkauf
  let actions = [];
  for (const pdfPage of pdfPages) {
    let i = 0;

    while (i <= pdfPage.length) {
      if (pdfPage[i] === 'Ansparplan') {
        const action = parseBaseAction(pdfPage, i, 'Buy');
        if (action === undefined) {
          return undefined;
        }
        actions.push(action);
        // An 'Ansparplan'/'Wiederanlage Fondsertrag' entry occupies 7 array entries.
        i += 6;
      } else if (pdfPage[i] === 'Wiederanlage Fondsertrag') {
        const action = parseBaseAction(pdfPage, i, 'Sell');
        if (action === undefined) {
          return undefined;
        }
        actions.push(action);
        // An 'Ansparplan'/'Wiederanlage Fondsertrag' entry occupies 7 array entries.
        i += 6;
      } else if (pdfPage[i] === 'Fondsertrag (Ausschüttung)') {
        // This was always blank in the example files I had -> So no parsing could be done.
        i += 3;
      } else if (pdfPage[i] === 'Entgelt Verkauf') {
        const action = parseBaseAction(pdfPage, i, 'Sell');
        if (action === undefined) {
          return undefined;
        } // An 'Entgelt Verkauf' entry occupies 9 array entries.
        actions.push(action);
        i += 8;
      } else if (pdfPage[i] === 'Verkauf') {
        const action = parseBaseAction(pdfPage, i, 'Sell');
        if (action === undefined) {
          return undefined;
        }
        actions.push(action);
        i += 8 // A basic 'Verkauf' entry occupies 9 array entries in total
      } else if (pdfPage[i] === 'Vorabpauschale') {
        // This was always blank in the example files I had -> So no parsing could be done.
        i += 3;
      }
      i++;
    }
  }
  return actions;
};

export const parsePages = contents => {
  return parseData(contents);
};
