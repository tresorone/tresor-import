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
  require('./buy/2020_dropbox.json'),
  require('./buy/2017_lion_e_mobility.json'),
];

export const sellSamples = [
  require('./sell/sell1.json'),
  require('./sell/sell2.json'),
  require('./sell/2018_ishares_global_corporate.json'),
];

export const dividendSamples = [
  require('./dividend/2020_apple.json'),
  require('./dividend/2019_microsoft.json'),
  require('./dividend/2018_msci_world.json'),
  require('./dividend/2018_etf_001.json'),
  require('./dividend/2020_ishare_msci_eu.json'),
  require('./dividend/2020_royal_dutch_shell.json'),
  require('./dividend/2015_williams.json'),
];

export const mixedPageSamples = [require('./mixed-pages/0.json')];

export const ignoredSamples = [
  require('./ignored/2020_order_confirmation.json'),
  require('./ignored/2020_saving_plan_confirmation.json'),
];

export const allSamples = buySamples.concat(
  sellSamples,
  dividendSamples,
  mixedPageSamples,
  ignoredSamples
);
