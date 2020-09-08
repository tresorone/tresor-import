export const allSamples = [
  // buys
  require('./buy/limit_order.json'),
  require('./buy/market_order.json'),
  require('./buy/limit_order_financial_transaction_tax.json'),
  require('./buy/market_order_without_explicit_ISIN.json'),
  require('./buy/saving_plan.json'),

  // sells
  require('./sell/limit_order_tesla.json'),
  require('./sell/limit_order_stryker.json'),

  // dividends
  require('./dividend/royal_dutch_shell_with_taxes.json'),
  require('./dividend/ishares_stoxx_europe_select_dividend_30_etf.json'),
  require('./dividend/ishares_euro_stoxx_select_dividend_30.json'),
  require('./dividend/ishares_developed_markets_property_yield.json'),
];

export const buySamples = [
  require('./buy/limit_order.json'),
  require('./buy/market_order.json'),
  require('./buy/limit_order_financial_transaction_tax.json'),
  require('./buy/market_order_without_explicit_ISIN.json'),
  require('./buy/saving_plan.json'),
];

export const sellSamples = [
  require('./sell/limit_order_tesla.json'),
  require('./sell/limit_order_stryker.json'),
];

export const dividendSamples = [
  require('./dividend/royal_dutch_shell_with_taxes.json'),
  require('./dividend/ishares_stoxx_europe_select_dividend_30_etf.json'),
  require('./dividend/ishares_euro_stoxx_select_dividend_30.json'),
  require('./dividend/ishares_developed_markets_property_yield.json'),
];
