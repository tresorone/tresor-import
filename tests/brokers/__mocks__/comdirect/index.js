export const buySamples = [
  require('./buy/saving_plan.json'),
  require('./buy/purchase_eur_reduction.json'),
  require('./buy/purchase_usd_reduction.json'),
  require('./buy/purchase_eur_leifheit_ag.json'),
  require('./buy/purchase_eur_BYD_co_ltd.json'),
  require('./buy/purchase_usd_lordstown_motors_usd.json'),
  require('./buy/purchase_eur_alibaba_group.json'),
  require('./buy/2020_usd_epr_properties.json'),
];

export const sellSamples = [
  require('./sell/2020_eur_stock_biontech.json'),
  require('./sell/2020_usd_arcimoto.json'),
  require('./sell/2020_eur_stock_wirecard.json'),
  require('./sell/2020_eur_sauren_global_balanced.json'),
];

export const dividendSamples = [
  require('./dividend/currency_usd.json'),
  require('./dividend/currency_eur.json'),
  require('./dividend/dividend_usd_stryker_corp.json'),
];

export const taxInfoDividendSamples = [
  require('./taxInfo/dividend/2020_eur_etf_ishsii_jpm.json'),
  require('./taxInfo/dividend/2020_eur_stock_basf.json'),
  require('./taxInfo/dividend/2020_eur_stock_bayer_ag.json'),
  require('./taxInfo/dividend/2020_eur_stock_daimler.json'),
  require('./taxInfo/dividend/2020_eur_stock_freenet_ag.json'),
  require('./taxInfo/dividend/2020_eur_stock_fresenius.json'),
]

export const allSamples = buySamples.concat(sellSamples, dividendSamples, taxInfoDividendSamples);
