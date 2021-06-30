export const buySamples = [
  require('./buy/2019_ComSta._MSCI_Em.Mkts.json'),
  require('./buy/2020_Vanguard_FTSE_All_World.json'),
  require('./buy/2018_ComSta._MSCI_World.json'),
  require('./buy/2010_Muenchener_Rueckvers.json'),
  require('./buy/2021_iShsIII-CoreMSCI.json'),
];

export const sellSamples = [
  require('./sell/2020_large.json'),
  require('./sell/2018_Deutsche_Beteiligungs_AG.json'),
  require('./sell/2018_iShsII-J.P.M..json'),
  require('./sell/2018_Deutsche_EuroShop_AG.json'),
  require('./sell/2021_usd_epam_systems.json'),
];

export const multiPageSamples = [require('./multipage/multi-page.json')];

export const dividendsSamples = [
  require('./dividend/2020_Vanguard_FTSE_All_World.json'),
  require('./dividend/2019_iShare.NASDAQ-100.json'),
  require('./dividend/2019_ComSta._MSCI_Em.Mkts.json'),
  require('./dividend/2019_iSh.EO_ST.Sel.Div.30.json'),
  require('./dividend/2019_MetLife.json'),
  require('./dividend/2021_iShare-NASDAQ.json'),
  require('./dividend/2021_Nintendo.json'),
];

export const accountStatementSamples = [
  require('./accountStatement/2020_account_statement_1.json'),
  require('./accountStatement/2020_account_statement_2.json'),
  require('./accountStatement/2016_account_statement.json'),
  require('./accountStatement/2017_account_statement_1.json'),
  require('./accountStatement/2017_account_statement_2.json'),
  require('./accountStatement/2020_account_statement_3.json'),
];

export const portfolioOverviewSamples = [
  require('./portfolioOverview/2020_overview.json'),
];

export const ignoredSamples = [
  require('./ignored/2020_cost_information.json'),
  require('./ignored/2020_multiple_dividend_cancellations.json'),
];

export const allSamples = buySamples.concat(
  sellSamples,
  dividendsSamples,
  multiPageSamples,
  accountStatementSamples,
  portfolioOverviewSamples,
  ignoredSamples
);
