export const buySamples = [
  require('./buy/2019_buy_apple.json'),
  require('./buy/2020_etf_buy_ishares_msci_wld.json'),
  require('./buy/2019_buy_microsoft.json'),
  require('./buy/2018_buy_netflix.json'),
  require('./buy/2018_buy_tesla.json'),
  require('./buy/2020_buy_byd_co_ltd.json'),
  require('./buy/multi_page_multi_buys.json'),
  require('./buy/2018_etf_ishares_tecdax.json'),
  require('./buy/2016_old_bank_name.json'),
];

export const sellSamples = [
  require('./sell/sell1.json'),
  require('./sell/sell2.json'),
];

export const dividendSamples = [
  require('./dividend/dividend1.json'),
  require('./dividend/dividend2.json'),
  require('./dividend/dividend3.json'),
  require('./dividend/2018_etf_001.json'),
  require('./dividend/2020_ishare_msci_eu.json'),
];

export const mixedPageSamples = [require('./mixed-pages/0.json')];

export const ignoredSamples = [
  require('./ignored/2020_order_confirmation.json'),
];

export const allSamples = buySamples.concat(
  sellSamples,
  dividendSamples,
  mixedPageSamples,
  ignoredSamples
);
