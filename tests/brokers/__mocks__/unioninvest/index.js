export const buySamples = [
  require('./buy/2019_multi_buy_single_page_1.json'),
  require('./buy/2019_multi_buy_single_page_2.json'),
  require('./buy/2019_multi_buy_single_page_3.json'),
  require('./buy/2019_multi_buy_single_page_4.json'),
  require('./buy/2020_multi_buy_single_page_1.json'),
  require('./buy/2016_single_buy_single_page_1.json'),
  require('./buy/2020_single_buy_1.json'),
  require('./buy/2018_tax_refund_reinvest.json'),
];

export const sellSamples = [require('./sell/2016_multi_sell_1.json')];

export const dividendSamples = [
  require('./dividend/2019_payout_reinvest_1.json'),
  require('./dividend/2020_payout_reinvest_1.json'),
  require('./dividend/2016_multi_reinvests.json'),
  require('./dividend/2017_single_reinvest_1.json'),
  require('./dividend/2018_single_reinvest_1.json'),
  require('./dividend/2019_multi_payout_reinvest_1.json'),
];

export const redistribution = [
  require('./redeployment/2020_single_redeployment.json'),
  require('./redeployment/2020_single_reverse_deployment.json'),
];

export const allSamples = buySamples.concat(
  sellSamples,
  dividendSamples,
  redistribution
);
