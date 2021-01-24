export const buySamples = [];

export const sellSamples = [];

export const dividendSamples = [
  require('./dividends/2020_agnc_invest.json'),
  require('./dividends/2020_johnson_johnson.json'),
];

export const depotStatusSamples = [
  require('./depotStatus/2021_depot_status_standard.json'),
];

export const transactionLogSamples = [
  require('./transactionLog/2020_buy_dividend_transaction_log.json'),
];

export const ignoredSamples = [
  require('./ignored/2020_unparsable_buy_operation.json'),
  require('./ignored/2020_unparsable_sell_operation.json'),
];

export const allSamples = buySamples.concat(
  sellSamples,
  dividendSamples,
  depotStatusSamples
);
