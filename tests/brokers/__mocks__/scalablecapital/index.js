export const allSamples = [
  // buys
  require('./buy/market_order.json'),
  require('./buy/saving_plan_vanguard.json'),
  require('./buy/saving_plan_comstage.json'),
  require('./buy/limit_order.json'),

  // sells
  require('./sell/market_order.json'),

  // dividends
  require('./dividend/etf110_without_taxes.json'),
  require('./dividend/dividend_USD_with_withholding_taxes.json'),
];

export const buySamples = [
  require('./buy/market_order.json'),
  require('./buy/saving_plan_vanguard.json'),
  require('./buy/saving_plan_comstage.json'),
  require('./buy/limit_order.json'),
];

export const sellSamples = [require('./sell/market_order.json')];

export const dividendSamples = [
  require('./dividend/etf110_without_taxes.json'),
  require('./dividend/dividend_USD_with_withholding_taxes.json'),
];
