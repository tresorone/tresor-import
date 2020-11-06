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

//Takes a string that starts with a number that uses a comma instead of a .
//for decimal place division and followed by a single space and extracts that
//number as a float. e. G.: "388,29 EUR [...]" -> 388.29
const parseNumberBeforeSpace = input => {
  try {
    return +Big(parseGermanNum(input.split(' ')[0])).abs();
  } catch (e) {
    if (e.message === '[big.js] Invalid number') {
      return undefined;
    } else {
      throw e; // re-throw the error unchanged
    }
  }
};

function parseBaseAction(pdfArray, pdfOffset, actionType) {
  const activity = {
    broker: 'ebase',
    type: actionType,
    date: format(
      parse(pdfArray[pdfOffset + 6], 'dd.MM.yyyy', new Date()),
      'yyyy-MM-dd'
    ),
    isin: pdfArray[pdfOffset + 2],
    company: pdfArray[pdfOffset + 1],
    shares: parseShare(pdfArray[pdfOffset + 4]),
    price: parseNumberBeforeSpace(pdfArray[pdfOffset + 5]),
    amount: parseNumberBeforeSpace(pdfArray[pdfOffset + 7]),
    tax: 0,
    fee: 0,
  };
  return validateActivity(activity);
}

export const parseData = pdfPages => {
  // Action can be: Fondsertrag (Ausschüttung), Ansparplan, Wiederanlage Fondsertrag, Entgelt Verkauf
  let actions = [];
  for (const pdfPage of pdfPages) {
    let i = 0;

    while (i <= pdfPage.length) {
      if (pdfPage[i] === 'Ansparplan' || pdfPage[i] === 'Kauf') {
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
        i += 8; // A basic 'Verkauf' entry occupies 9 array entries in total
      } else if (pdfPage[i] === 'Vorabpauschale') {
        // This was always blank in the example files I had -> So no parsing could be done.
        i += 3;
      }
      i++;
    }
  }
  return actions;
};

export const canParsePage = (content, extension) =>
  extension === 'pdf' &&
  content.some(line => line.includes('ebase Depot')) &&
  content.some(line => line.includes('Fondsertrag / Vorabpauschale'));

export const parsePages = contents => {
  return {
    activities: parseData(contents),
    status: 0,
  };
};
