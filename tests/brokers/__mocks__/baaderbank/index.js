export const buySamples = [
  require('./buy/market_order.json'),
  require('./buy/saving_plan_vanguard_all_world.json'),
  require('./buy/saving_plan_comstage.json'),
  require('./buy/limit_order.json'),
  require('./buy/biontech_from_gratisbroker.json'),
  require('./buy/saving_plan_vanguard_from_Oskar.json'),
  require('./buy/market_order_from_Oskar.json'),
  require('./buy/2021_azioni_nom_italian_tax.json'),
];

export const sellSamples = [require('./sell/market_order.json')];

export const dividendSamples = [
  require('./dividend/etf110_without_taxes.json'),
  require('./dividend/dividend_USD_with_withholding_taxes.json'),
  require('./dividend/volkswagen_with_taxes_gratisbroker.json'),
];

export const accountSamples = [
  require('./accountStatement/2020_scalable_buy_dividend.json'),
];

export const allSamples = buySamples.concat(
  sellSamples,
  dividendSamples,
  accountSamples
);
