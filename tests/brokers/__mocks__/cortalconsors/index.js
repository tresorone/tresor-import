export const buySamples = [
  require('./buy/2014_allianz.json'),
  require('./buy/2014_ishares_etf_with_commission.json'),
];

export const sellSamples = [require('./sell/2014_allianz.json')];

export const dividendSamples = [
  require('./dividend/2014_allianz.json'),
  require('./dividend/2014_etf_x-tracke.json'),
];

export const allSamples = buySamples.concat(sellSamples, dividendSamples);
