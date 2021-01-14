export const buySamples = [];

export const sellSamples = [];

export const dividendSamples = [
  require('./dividends/2020_agnc_invest.json'),
  require('./dividends/2020_johnson_johnson.json'),
];

export const unsupportedSamples = [
  require('./notSupported/2020_unparsable_buy_operation.json'),
];

export const allSamples = buySamples.concat(sellSamples, dividendSamples);
