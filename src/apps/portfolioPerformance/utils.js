export const detectLocale = ([transaction]) => {
  const keys = Object.keys(transaction);

  if (keys.includes('Security Name')) return 'en';
  if (keys.includes('Wertpapiername')) return 'de';
};

export const getKeyMap = locale => {
  const common = {
    isin: 'ISIN',
    wkn: 'WKN',
  };

  const keys = {
    de: {
      ...common,
      type: 'Typ',
      company: 'Wertpapiername',
      symbol: 'Ticker-Symbol',
      date: 'Datum',
      shares: 'Stück',
      amount: 'Wert',
      grossAmount: 'Bruttobetrag',
      tax: 'Steuern',
      fee: 'Gebühren',
      currency: 'Buchungswährung',
      grossCurrency: 'Währung Bruttobetrag',
      exchangeRate: 'Wechselkurs',
    },
    en: {
      ...common,
      type: 'Type',
      company: 'Security Name',
      symbol: 'Ticker Symbol',
      date: 'Date',
      shares: 'Shares',
      amount: 'Value',
      grossAmount: 'Gross Amount',
      tax: 'Taxes',
      fee: 'Fees',
      currency: 'Transaction Currency',
      grossCurrency: 'Currency Gross Amount',
      exchangeRate: 'Exchange Rate',
    },
  };

  return keys[locale];
};

export const getTypeMap = locale => {
  const typeMap = {
    // source: https://github.com/buchen/portfolio/blob/bacb7eac2e7590dc2a2116b31ab816d68ba5bf13/name.abuchen.portfolio/src/name/abuchen/portfolio/model/labels_de.properties
    de: {
      Dividend: 'Dividende',
      Buy: 'Kauf',
      Sell: 'Verkauf',
      cashIn: 'Einlage',
      cashOut: 'Entnahme',
      transferIn: 'Einlieferung',
      transferOut: 'Auslieferung',
      bookIn: 'Umbuchung (Eingang)',
      bookOut: 'Umbuchung (Ausgang)',
    },
    // source: https://github.com/buchen/portfolio/blob/bacb7eac2e7590dc2a2116b31ab816d68ba5bf13/name.abuchen.portfolio/src/name/abuchen/portfolio/model/labels.properties
    en: {
      Dividend: 'Dividend',
      Buy: 'Buy',
      Sell: 'Sell',
      cashIn: 'Deposit',
      cashOut: 'Removal',
      transferIn: 'Delivery (Inbound)',
      transferOut: 'Delivery (Outbound)',
      bookIn: 'Transfer (Inbound)',
      bookOut: 'Transfer (Outbound)',
    },
  };
  return typeMap[locale];
};

export const keyNormalizer = keyMap => transaction =>
  Object.entries(keyMap).reduce(
    (prev, [key, name]) => ({
      ...prev,
      [key]: transaction[name],
    }),
    {}
  );
