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
  require('./sell/limit_order_workhorse_group_tax_refund.json'),
];

export const dividendSamples = [
  require('./dividend/royal_dutch_shell_with_taxes.json'),
  require('./dividend/ishares_stoxx_europe_select_dividend_30_etf.json'),
  require('./dividend/ishares_euro_stoxx_select_dividend_30.json'),
  require('./dividend/ishares_developed_markets_property_yield.json'),
  require('./dividend/gazprom_third_party_expenses_and_withholding_tax.json'),
  require('./dividend/realty_income_with_other_withholding_tax_format.json'),
  require('./dividend/unilever_withholding_tax.json'),
  require('./dividend/2020_walgreens_boots_alliance.json'),
  require('./dividend/2020_exxon_mobile_corp.json'),
  require('./dividend/2020_schlumberger.json'),
  require('./dividend/2021_reinvest_main_street_capital.json'),
];

export const depotStatement = [
  require('./depotStatement/without_stocks.json'),
  require('./depotStatement/with_stocks.json'),
  require('./depotStatement/two_pages.json'),
  require('./depotStatement/2020_year_end_statement.json'),
  require('./depotStatement/2020_depotStatement_single_etf.json')
];

export const ignoredSamples = [
  require('./ignored/cost_information.json'),
  require('./ignored/reverse_split.json'),
  require('./ignored/saving_plan_failed.json'),
  require('./ignored/split.json'),
  require('./ignored/saving_plan_confirmation.json'),
  require('./ignored/saving_plan_change_confirmation.json'),
  require('./ignored/account_statement.json'),
];

export const allSamples = buySamples.concat(
  sellSamples,
  dividendSamples,
  depotStatement,
  ignoredSamples
);
