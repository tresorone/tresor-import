export const buySamples = [
  require('./buy/2019_multi_buy_single_page_1.json'),
  require('./buy/2019_multi_buy_single_page_2.json'),
  require('./buy/2019_multi_buy_single_page_3.json'),
  require('./buy/2019_multi_buy_single_page_4.json'),
  require('./buy/2020_multi_buy_single_page_1.json'),
  require('./buy/2016_single_buy_single_page_1.json'),
  require('./buy/2020_single_buy_1.json'),
];

export const sellSamples = [require('./sell/2016_multi_sell_1.json')];

export const dividendSamples = [
  require('./dividend/2019_payout_reinvest_1.json'),
  require('./dividend/2020_payout_reinvest_1.json'),
];

export const redistribution = [
  require('./redistribute/2020_single_redistribution.json'),
];

export const mixedTransactions = [
  require('./mixed/2016_multi_buy_no_charge.json'),
];

export const allSamples = buySamples.concat(
  sellSamples,
  dividendSamples,
  redistribution
);
