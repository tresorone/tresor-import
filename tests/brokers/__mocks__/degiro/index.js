export const transactionLog = [
  require('./transactionLog/buy_only_transcations.json'),
  require('./transactionLog/buy_sell_and_call_transactions.json'),
  require('./transactionLog/mixed_transaction_log_1.json'),
  require('./transactionLog/mixed_transaction_log_2.json'),
  require('./transactionLog/2021_transaction_log_1.json'),
  require('./transactionLog/2021_transaction_log_2.json'),
  require('./transactionLog/2020_transaction_log_1.json'),
];

export const depotOverview = [
  require('./depotOverview/2021_depot_statement.json'),
];

export const allSamples = transactionLog.concat(depotOverview);
