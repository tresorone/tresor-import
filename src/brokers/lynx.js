import { validateActivity, createActivityDateTime } from '@/helper';

const financialInstruments = [];

function parseOneTrade(trades) {
  let i = trades.pointer;

  if (trades.content[i] === 'Symbol') {
    const stockSection = trades.content.indexOf('Stocks', i);
    const cfdSection = trades.content.indexOf('CFDs', i);
    if (stockSection !== -1 && (stockSection < cfdSection || cfdSection === -1)) {
      trades.start = stockSection + 1;
      trades.pointer = i = trades.start + 1;
    } else if (cfdSection !== -1) {
      trades.start = cfdSection + 1;
      trades.pointer = i = trades.start + 1;
    }
  }

  if (i + 11 > trades.content.length) {
    trades.pointer = i + 11;
    console.warn(
      'Not enough data to read',
      i,
      trades.pointer,
      trades.content.length
    );
    return;
  }
  const currency = trades.content[trades.start]; // eslint-disable-line no-unused-vars
  const symbol = trades.content[i++];
  const date = trades.content[i].substr(0, trades.content[i++].length - 1);
  const time = trades.content[i++];
  const quantity = trades.content[i++].replace(',', '');
  const tprice = trades.content[i++].replace(',', '');
  const cprice = trades.content[i++].replace(',', ''); // eslint-disable-line no-unused-vars
  const proceeds = trades.content[i++].replace(',', '');
  const fee = trades.content[i++].replace(',', '');
  const basis = trades.content[i++].replace(',', ''); // eslint-disable-line no-unused-vars
  const realized = trades.content[i++].replace(',', ''); // eslint-disable-line no-unused-vars
  const marketToMarketPL = trades.content[i++]; // eslint-disable-line no-unused-vars
  const code = trades.content[i++];

  if (trades.content[i] === `Total ${symbol}`) {
    i += 7; // skip symbol summary
  }
  if (trades.content[i] === 'Total') {
    i += 6; // skip section summary
  }
  if (trades.content[i].startsWith('Total in ')) {
    i += 6;
  }
  if (trades.content[i] === 'Transfers') {
    i = trades.content.length; // end of trades section
  }

  trades.pointer = i;

  const instrumentInfo = financialInstruments.find(
    item => item.symbol === symbol
  );

  if (instrumentInfo == null) {
    console.warn(
      `Unable to lookup ISIN for symbol '${symbol}'. Is it a CFD? Lynx unfortunately doesn't expose the CFD's underlying ISIN.`
    );
  }

  const activity = {
    broker: 'Lynx',
    type: code && code.toLowerCase() === 'o' ? 'Buy' : 'Sell',
    date: date,
    datetime: createActivityDateTime(
      date,
      time,
      'yyyy-MM-dd',
      'yyyy-MM-dd HH:mm:ss'
    ),
    isin: instrumentInfo && instrumentInfo.isin,
    company: (instrumentInfo && instrumentInfo.description) || symbol,
    shares: Math.abs(parseFloat(quantity)),
    price: parseFloat(tprice),
    amount: Math.abs(parseFloat(proceeds)),
    fee: Math.abs(parseFloat(fee)),
    tax: 0,
    //fxRate: '',
    //foreignCurrency: currency,
  };

  if (validateActivity(activity) !== undefined) {
    trades.activities.push(activity);
  }
}

function loadFinancialInstrumentTable(content) {
  let startOfInstruments = content.indexOf('Financial Instrument Information');
  if (startOfInstruments === -1) {
    console.warn('No Financial Instrument Info Table found');
    return;
  }
  let i = content.indexOf('Stocks', startOfInstruments) + 1;

  while (
    content[i] !== 'Symbol' &&
    content[i] !== 'Codes' &&
    i < content.length
  ) {
    const symbol = content[i++];
    let description = '';
    while (!/^\d+$/.test(content[i])) {
      description += content[i++];
    }
    const conId = content[i++]; // eslint-disable-line no-unused-vars
    const isin = content[i++];

    financialInstruments.push({
      symbol,
      description,
      isin,
    });
    i += 3; // skip rest of the line
  }
}

export const canParseDocument = (pages, extension) => {
  const content = pages.flat();
  return (
    extension === 'pdf' &&
    content.some(line => line.includes('Lynx b.v.')) &&
    content.some(line => line.includes('Activity Statement')) &&
    content.some(line => line.includes('Trades')) &&
    content.some(line => line.includes('Financial Instrument Information'))
  );
};

export const parsePages = contents => {
  const activities = [];
  const content = contents.flat();

  loadFinancialInstrumentTable(content);

  let startOfTrades = content.indexOf('Trades');
  if (startOfTrades > 0) {
    const trades = {
      start: startOfTrades + 1,
      pointer: startOfTrades + 1,
      content,
      activities,
    };
    while (trades.pointer !== -1 && trades.pointer < trades.content.length) {
      parseOneTrade(trades);
    }
  }

  return {
    activities: activities,
    status: 0,
  };
};
