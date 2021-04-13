export const transactionLog = [
  require('./transactionLog/buy_only_transcations.json'),
  require('./transactionLog/buy_sell_and_call_transactions.json'),
  require('./transactionLog/mixed_transaction_log_1.json'),
  require('./transactionLog/mixed_transaction_log_2.json'),
  require('./transactionLog/2021_transaction_log_1.json'),
  require('./transactionLog/2021_transaction_log_2.json'),
  require('./transactionLog/place_of_execution_empty.json'),
  require('./transactionLog/2020_transaction_log_1.json'),
  require('./transactionLog/buy_only_transactions_it.json'),
  require('./transactionLog/0000_transactions.json'),
];

export const depotOverview = [
  require('./depotOverview/2021_depot_statement.json'),
  require('./depotOverview/2021_italian.json'),
];

export const allSamples = transactionLog.concat(depotOverview);
