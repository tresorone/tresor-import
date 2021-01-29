export const buySamples = [
  require('./buy/buy1.json'),
  require('./buy/buy2.json'),
  require('./buy/buy3.json'),
  require('./buy/buy4.json'),
  require('./buy/buyOld.json'),
  require('./buy/buy_2015_ishs.json'),
  require('./buy/2020_limit_buy.json'),
  require('./buy/2020_fund.json'),
  require('./buy/2020_fund_without_issue.json'),
  require('./buy/2020_buy_apple_inc_1.json'),
  require('./buy/2003_buy_acatis.json'),
  require('./buy/2021_allianz_strategy_fond.json'),
  require('./buy/2021_janus_henderson_capital_funds.json'),
  require('./buy/2021_put_citi_gl.json'),
  require('./buy/2021_usd_churchill_cap_iv.json'),
  require('./buy/2019_cloudflare.json'),
];

export const sellSamples = [
  require('./sell/sell1.json'),
  require('./sell/sell2.json'),
];

export const dividendsSamples = [
  require('./dividends/ertrag_alerian_mlp_etf_1.json'),
  require('./dividends/ertrag_global_x_superdividend_etf.json'),
  require('./dividends/dividend_vanguard ftse_etf.json'),
  require('./dividends/ertrag_alerian_mlp_etf_2.json'),
  require('./dividends/dividend_volkswagen_ag.json'),
  require('./dividends/dividend_diageo.json'),
  require('./dividends/dividend_cisco_system_inc.json'),
  require('./dividends/dividend_pepsico.json'),
  require('./dividends/dividend_illinois_tool_works.json'),
  require('./dividends/dividend_realty_income.json'),
  require('./dividends/dividend_agnc_investment_corp.json'),
  require('./dividends/dividend_2015_total_sa.json'),
  require('./dividends/dividend_2016_bmw.json'),
  require('./dividends/dividend_2018_total_sa.json'),
  require('./dividends/dividend_2018_deutsche_post.json'),
  require('./dividends/2015_ishare_stoxx.json'),
];

export const ignoredSamples = [
  require('./ignored/2020_cost_information.json'),
  require('./ignored/2020_stock_split.json'),
  require('./ignored/2021_advance_flat_rate.json'),
];

export const allSamples = buySamples
  .concat(sellSamples)
  .concat(dividendsSamples)
  .concat(ignoredSamples);
