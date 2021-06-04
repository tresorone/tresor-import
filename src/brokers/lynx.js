import { validateActivity, createActivityDateTime } from '@/helper';

function parseOneTrade(trades) {
  let i = trades.pointer;

  if (trades.table[i] === 'Symbol') {
    const stockSection = trades.table.indexOf('Stocks', i);
    const cfdSection = trades.table.indexOf('CFDs', i);
    if (stockSection != -1 && stockSection < cfdSection) {
      trades.start = stockSection + 1;
      trades.pointer = i = trades.start + 1;
      console.log('Stocks starting at ', i, trades.start);
    } else if (cfdSection != -1) {
      trades.start = cfdSection + 1;
      trades.pointer = i = trades.start + 1;
      console.log('cfd starting at ', i, trades.start);
    }
  }

  console.log('eval table at ', i, trades.start, trades.table.slice(i));

  if (i + 11 > trades.table.length) {
    trades.pointer = i + 11;
    console.log(
      'Not enough data to read',
      i,
      trades.pointer,
      trades.table.length
    );
    return;
  }
  const currency = trades.table[trades.start]; // eslint-disable-line no-unused-vars
  const symbol = trades.table[i++];
  const date = trades.table[i].substr(0, trades.table[i++].length - 1);
  const time = trades.table[i++];
  const quantity = trades.table[i++].replace(',', '');
  const tprice = trades.table[i++].replace(',', ''); // eslint-disable-line no-unused-vars
  const cprice = trades.table[i++].replace(',', '');
  const proceeds = trades.table[i++].replace(',', '');
  const fee = trades.table[i++].replace(',', '');
  const basis = trades.table[i++].replace(',', ''); // eslint-disable-line no-unused-vars
  const realized = trades.table[i++].replace(',', ''); // eslint-disable-line no-unused-vars
  const code = trades.table[i++];
  i++;

  console.log('Converted date time', date, time);

  if (trades.table[i] === `Total ${symbol}`) {
    i += 7; // skip symbol summary
  }
  if (trades.table[i] === 'Total') {
    i += 6; // skip section summary
  }
  if (trades.table[i].startsWith('Total in ')) {
    i += 6;
  }
  if (trades.table[i] === 'Transfers') {
    i = trades.table.length; // end of trades section
  }

  trades.pointer = i;
  console.log('pointer moved to ', i, trades.table.slice(i));

  const activity = {
    broker: 'Lynx',
    type: code && code.toLowerCase() == 'o' ? 'Buy' : 'Sell',
    date: date,
    datetime: createActivityDateTime(
      date,
      time,
      'yyyy-MM-dd',
      'yyyy-MM-dd HH:mm:ss'
    ),
    // isin: ?,
    // wkn: ?, // if isin not known
    company: symbol,
    shares: Math.abs(parseFloat(quantity)),
    price: parseFloat(cprice),
    amount: Math.abs(parseFloat(proceeds)),
    fee: Math.abs(parseFloat(fee)),
    tax: 0,
    //fxRate: '',
    //foreignCurrency: currency,
  };
  console.log('Found activity', activity);
  if (validateActivity(activity) != undefined) {
    trades.activities.push(activity);
  }
}

export const canParseDocument = (pages, extension) => {
  const firstPageContent = pages[0];
  return (
    extension === 'pdf' &&
    firstPageContent.some(line => line.includes('Lynx b.v.')) &&
    firstPageContent.some(line => line.includes('Activity Statement'))
  );
};

export const parsePages = contents => {
  let activities = [];

  for (let table of contents) {
    let startOfTrades = table.indexOf('Trades');
    if (startOfTrades > 0) {
      const trades = {
        start: startOfTrades + 1,
        pointer: startOfTrades + 1,
        table,
        activities: [],
      };
      while (trades.pointer != -1 && trades.pointer < trades.table.length) {
        parseOneTrade(trades);
      }
    }
  }

  return {
    activities,
    status: 0,
  };
};
