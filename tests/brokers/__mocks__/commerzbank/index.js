export const buySamples = [
  require('./buy/buy_A1T8FV_1.json'),
  require('./buy/buy_mixed_A1JX51_1.json'),
  require('./buy/buy_mixed_A1JX51_2.json'),
  require('./buy/buy_mixed_A1JX52_1.json'),
  require('./buy/buy_mixed_A1JX52_2.json'),
  require('./buy/buy_mixed_A1T8FV_1.json'),
  require('./buy/buy_mixed_comstage_msci_world.json'),
  require('./buy/savings_plan_eur_2020_agif_all.json'),
];

export const sellSamples = [
  require('./sell/2021-DWS_Inv.json'),
  require('./sell/sell_NL0000235190_1.json'),
];

export const dividendSamples = [
  require('./dividend/dividend_IE00B3RBWM25_1.json'),
  require('./dividend/dividend_IE00B3RBWM25_2.json'),
  require('./dividend/dividend_IE00B3VVMM84_1.json'),
  require('./dividend/dividend_IE00B3VVMM84_2.json'),
  require('./dividend/dividend_IE00B8GKDB10_1.json'),
  require('./dividend/dividend_IE00B8GKDB10_2.json'),
  require('./dividend/dividend_foreign_currency_IE00B3RBWM25_1.json'),
  require('./dividend/dividend_foreign_currency_IE00B3RBWM25_2.json'),
  require('./dividend/dividend_foreign_currency_IE00B3VVMM84_1.json'),
  require('./dividend/dividend_foreign_currency_IE00B3VVMM84_2.json'),
  require('./dividend/dividend_foreign_currency_IE00B8GKDB10_1.json'),
  require('./dividend/dividend_foreign_currency_IE00B8GKDB10_2.json'),
  require('./dividend/dividend_foreign_currency_US5949181045_1.json'),
  require('./dividend/dividend_DE0009848119_1.json'),
  require('./dividend/dividend_DE000BASF111.json'),
];

export const transactionReport = [
  require('./transactionReport/transaction_report_shortened_1.json'),
];

export const ignoredSamples = [require('./ignored/umsatzdetails.json')];

export const allSamples = buySamples.concat(
  sellSamples,
  dividendSamples,
  transactionReport,
  ignoredSamples
);
