export const buySamples = [
  require('./buy/saving_plan.json'),
  require('./buy/purchase_eur_reduction.json'),
  require('./buy/purchase_usd_reduction.json'),
  require('./buy/purchase_eur_leifheit_ag.json'),
  require('./buy/purchase_eur_BYD_co_ltd.json'),
  require('./buy/purchase_usd_lordstown_motors_usd.json'),
  require('./buy/purchase_eur_alibaba_group.json'),
  require('./buy/2020_usd_epr_properties.json'),
  require('./buy/2004_fidelity_fds_europ.json'),
  require('./buy/2003_jenoptik.json'),
];

export const sellSamples = [
  require('./sell/2020_eur_stock_biontech.json'),
  require('./sell/2020_usd_arcimoto.json'),
  require('./sell/2020_eur_stock_wirecard.json'),
  require('./sell/2020_eur_sauren_global_balanced.json'),
  require('./sell/2020_eur_sma_solar_technology.json'),
];

export const dividendSamples = [
  require('./dividend/currency_usd.json'),
  require('./dividend/currency_eur.json'),
  require('./dividend/dividend_usd_stryker_corp.json'),
];

export const taxInfoDividendSamples = [
  require('./taxInfo/dividend/2020_eur_foreign_etf_payout_ishsii_jpm.json'),
  require('./taxInfo/dividend/2020_eur_domestic_stock_dividend_basf.json'),
  require('./taxInfo/dividend/2020_eur_domestic_stock_dividend_bayer_ag.json'),
  require('./taxInfo/dividend/2020_eur_domestic_stock_dividend_daimler.json'),
  require('./taxInfo/dividend/2020_eur_domestic_stock_dividend_freenet_ag.json'),
  require('./taxInfo/dividend/2020_eur_domestic_stock_dividend_fresenius.json'),
  require('./taxInfo/dividend/2013_eur_foreign_etf_payout_all_finanzplan.json'),
  require('./taxInfo/dividend/2018_eur_foreign_stock_dividend_mondelez.json'),
  require('./taxInfo/dividend/2019_eur_foreign_stock_dividend_garmin.json'),
  require('./taxInfo/dividend/2020_foreign_dividend_church_dwight.json'),
  require('./taxInfo/dividend/2020_foreign_dividend_starbucks.json'),
  require('./taxInfo/dividend/2020_foreign_dividend_visa.json'),
  require('./taxInfo/dividend/2020_foreign_payout_ishsii_jpm.json'),
];

export const ignoredSamples = [require('./ignored/2020_cost_information.json')];

export const allSamples = buySamples.concat(
  sellSamples,
  dividendSamples,
  taxInfoDividendSamples,
  ignoredSamples
);
