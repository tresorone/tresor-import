export const buySamples = [
  require('./buy/buy_stock_US0028241000.json'),
  require('./buy/2021_advanced_blockchain.json'),
];

export const sellSamples = [
  require('./sell/sell_comission_vanguard.json'),
  require('./sell/2021_turbo_knockout.json'),
  require('./sell/2020_goldman_sachs_bayer.json'),
  require('./sell/2020_tax_repayment_societe_generale_tui_turbo.json'),
];

export const dividendSamples = [
  require('./dividend/dividend_etf_usd.json'),
  require('./dividend/dividend_stock_usd.json'),
  require('./dividend/dividend_stock_usd_2.json'),
  require('./dividend/2020_pan_american_silver.json'),
  require('./dividend/2020_ishares_global_clean_energy.json'),
  require('./dividend/2021_ish_eo_st.json'),
  require('./dividend/2021_wp_carey_inc.json'),
  require('./dividend/2020_realty_income.json'),
];

export const transferInSamples = [
  require('./transferIn/2020_ado_properties.json'),
  require('./transferIn/2020_caterpillar_transferIn_revsion.json'),
];

export const ignoredSamples = [
  require('./ignored/2020_ex_ante_cost.json'),
  require('./ignored/2021_portfolio_overview.json'),
];

export const allSamples = buySamples.concat(
  sellSamples,
  dividendSamples,
  transferInSamples,
  ignoredSamples
);
