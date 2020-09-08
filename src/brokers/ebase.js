import format from 'date-fns/format';
import parse from 'date-fns/parse';
import every from 'lodash/every';
import values from 'lodash/values';

function verifyActivity(type, date, isin, company, shares, price, amount, fee) {
  const activity = {
    broker: 'ebase',
    type,
    date: format(parse(date, 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd'),
    isin,
    company,
    shares,
    price,
    amount,
    fee
  };
  const valid = every(values(activity), a => !!a || a === 0);
  if (!valid) {
    console.error('Error while parsing PDF', activity);
    return undefined;
  } else {
    return activity;
  }
}

function parseBuyAction(pdfArray, i) {
  const type = 'Buy';
  const company = pdfArray[i + 1];
  const isin = pdfArray[i + 2];
  const shares = parseFloat(pdfArray[i + 4].replace(/,/, '.'));
  const price = parseFloat(pdfArray[i + 5].split(' ')[0].replace(/,/, '.'));
  const date = pdfArray[i + 6];
  const amount = parseFloat(pdfArray[i + 7].split(' ')[0].replace(/,/, '.'));
  const fee = 0;
  return verifyActivity(type, date, isin, company, shares, price, amount, fee);
}

function parseSellAction(pdfArray, i) {
  const type = 'Sell';
  const company = pdfArray[i + 1];
  const isin = pdfArray[i + 2];
  const shares = Math.abs(parseFloat(pdfArray[i + 4].replace(/,/, '.')));
  const price = Math.abs(
    parseFloat(pdfArray[i + 5].split(' ')[0].replace(/,/, '.'))
  );
  const date = pdfArray[i + 6];
  const amount = Math.abs(
    parseFloat(pdfArray[i + 7].split(' ')[0].replace(/,/, '.'))
  );
  const fee = 0;
  return verifyActivity(type, date, isin, company, shares, price, amount, fee);
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
        const action = parseBuyAction(pdfPage, i);
        if (action === undefined) {
          return undefined;
        }
        actions.push(action);
        // An 'Ansparplan'/'Wiederanlage Fondsertrag' entry occupies 7 array entries.
        i += 6;
      } else if (pdfPage[i] === 'Wiederanlage Fondsertrag') {
        const action = parseBuyAction(pdfPage, i);
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
        const action = parseSellAction(pdfPage, i);
        if (action === undefined) {
          return undefined;
        }
        actions.push(action);
        i += 6; // An 'Entgelt Verkauf' entry occupies 7 array entries.
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

export const iAmEbase = test => {
  return test;
};
