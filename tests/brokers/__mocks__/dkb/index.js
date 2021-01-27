export const buySamples = [
  require('./buy/buy_stock_eur_provision_1.json'),
  require('./buy/buy_stock_eur_provision_2.json'),
  require('./buy/buy_stock_eur_provision_bonification.json'),
  require('./buy/limit_market_order_eur_mcdonalds.json'),
];

export const sellSamples = [
  require('./sell/sell_etf_LU1861132840.json'),
  require('./sell/sell_stop_market_order_invesco_msci_world.json'),
  require('./sell/sell_etf_IE00B4L5Y983.json'),
  require('./sell/redemption_etf.json'),
  require('./sell/2020_etf_tecdax.json'),
  require('./sell/2020_msci_world.json'),
  require('./sell/2020_data_deposit_box.json'),
  require('./sell/2020_vapiano.json'),
];

export const dividendsSamples = [
  require('./dividend/dividend_taxed_usd_1.json'),
  require('./dividend/dividend_taxed_usd_2.json'),
  require('./dividend/dividend_taxed_usd_3.json'),
  require('./dividend/dividend_taxed_usd_4.json'),
  require('./dividend/2020_deutsche_telekom.json'),
];

export const savingsplanSamples = [
  require('./savingsplan/2019_half_yearly_savings_plan_summary.json'),
  require('./savingsplan/2020_half_yearly_savings_plan_summary.json'),
];

export const ignoredSamples = [
  require('./ignore/order_confirmation.json'),
  require('./ignore/order_cancelation.json'),
  require('./ignore/execution_information.json'),
];

export const allSamples = buySamples.concat(
  sellSamples,
  dividendsSamples,
  savingsplanSamples,
  ignoredSamples
);
