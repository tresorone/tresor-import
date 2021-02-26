export const buySamples = [
  require('./buy/ansparplan_single_pdfpage.json'),
  require('./buy/ansparplan_multi_pdfpage.json'),
  require('./buy/buy_single_pdfpage.json'),
  require('./buy/finvesto_buy_multi_pdfpage.json'),
  require('./buy/buy_reinvest_multi_pdfpage.json'),
  require('./buy/capital_accumulation_benefit_multipage.json'),
];

export const sellSamples = [
  require('./sell/entgelt_verkauf_single_pdfpage.json'),
  require('./sell/verkauf_single_pdfpage.json'),
];

export const transactionLogSamples = [
  require('./transactionLog/mixed_transactions_multi_pdfpage.json'),
  require('./transactionLog/finvesto_mixed_transactions_multi_pdfpage.json'),
  require('./transactionLog/ebase_multiple_transactions_single_pdfpage.json'),
  require('./transactionLog/ebase_fond_redeployment.json'),
  require('./transactionLog/ebase_recalculation_of_buy_multi_pdfpage.json'),
  require('./transactionLog/2021_transaction_log_1.json'),
];

export const ignoredSamples = [
  require('./ignored/2021_account_statement.json'),
];

export const allSamples = buySamples.concat(
  sellSamples,
  transactionLogSamples,
  ignoredSamples
);
