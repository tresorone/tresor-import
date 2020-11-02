export const buySamples = [
  require('./buy/ansparplan_single_pdfpage.json'),
  require('./buy/ansparplan_multi_pdfpage.json'),
];

export const sellSamples = [
  require('./sell/entgelt_verkauf_single_pdfpage.json'),
  require('./sell/verkauf_single_pdfpage.json'),
];

export const mixedSamples = [
  require('./mixed_transactions/mixed_transactions_multi_pdfpage.json'),
];

export const invalidSamples = [
  require('./invalid/entgelt_verkauf_nan_single_pdfpage.json'),
];

export const allValidSamples = [
  // buys
  require('./buy/ansparplan_single_pdfpage.json'),
  require('./buy/ansparplan_multi_pdfpage.json'),
  // sells
  require('./sell/entgelt_verkauf_single_pdfpage.json'),
  require('./sell/verkauf_single_pdfpage.json'),
  //mixed
  require('./mixed_transactions/mixed_transactions_multi_pdfpage.json'),
];
/*
As of yet no dividend containing samples can be implemented due to a lack of
pdfs containing them
*/
