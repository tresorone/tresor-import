import Big from 'big.js';
import { findImplementation } from '@/index';
import * as comdirect from '../../src/brokers/comdirect';
import {
  buySamples,
  sellSamples,
  dividendSamples,
  taxInfoDividendSamples,
  ignoredSamples,
  allSamples,
} from './__mocks__/comdirect';

describe('Broker: comdirect', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can one page parsed with comdirect', () => {
      allSamples.forEach(pages => {
        expect(comdirect.canParseDocument(pages, 'pdf')).toEqual(true);
      });
    });

    test('Can identify a broker from one page as comdirect', () => {
      allSamples.forEach(pages => {
        const implementations = findImplementation(pages, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(comdirect);
      });
    });
  });

  describe('Validate buys', () => {
    test('Can the order parsed from saving_plan', () => {
      const activities = comdirect.parsePages(buySamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Buy',
        date: '2020-08-07',
        datetime: '2020-08-07T' + activities[0].datetime.substring(11),
        isin: 'DE0007231334',
        wkn: '723133',
        company: 'Sixt SE',
        shares: 0.55,
        price: 44.74545454545454,
        amount: 24.61,
        fee: 0.37,
        tax: 0,
      });
    });

    test('Can the order with purchase reduction be parsed from purchase_eur_reduction', () => {
      const activities = comdirect.parsePages(buySamples[1]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Buy',
        date: '2020-04-01',
        datetime: '2020-04-01T' + activities[0].datetime.substring(11),
        isin: 'LU0187079347',
        wkn: 'A0CA0W',
        company: 'Robeco Global Consumer Trends',
        shares: 0.108,
        price: 235.09259259259258,
        amount: 25.39,
        fee: -0.55,
        tax: 0,
      });
    });

    test('Can the buy order with purchase reduction be parsed from purchase_usd_reduction', () => {
      const activities = comdirect.parsePages(buySamples[2]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Buy',
        date: '2020-10-07',
        datetime: '2020-10-07T' + activities[0].datetime.substring(11),
        isin: 'LU0079474960',
        wkn: '986838',
        company: 'AB SICAV I-American Growth Ptf',
        shares: 0.644,
        price: 122.57587848246733,
        amount: 78.93886574270896,
        fee: +Big(74.99).minus(78.93886574270896),
        tax: 0,
        fxRate: 1.1761,
        foreignCurrency: 'USD',
      });
    });

    test('Can the buy order be parsed from purchase_leifheit_ag', () => {
      const activities = comdirect.parsePages(buySamples[3]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Buy',
        date: '2020-11-02',
        datetime: '2020-11-02T10:41:00.000Z',
        isin: 'DE0006464506',
        wkn: '646450',
        company: 'Leifheit AG',
        shares: 75,
        price: 33.9,
        amount: 2542.5,
        fee: 13.76,
        tax: 0,
      });
    });

    test('Can the buy order for BYD Co. Ltd. be parsed ', () => {
      const activities = comdirect.parsePages(buySamples[4]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Buy',
        date: '2020-11-02',
        datetime: '2020-11-02T08:28:00.000Z',
        isin: 'CNE100000296',
        wkn: 'A0M4W9',
        company: 'BYD Co. Ltd.',
        shares: 130,
        price: 19.375,
        amount: 2518.75,
        fee: 16.6,
        tax: 0,
      });
    });

    test('Can the buy order for Lordstown Motors, traded at NASDAQ, be parsed', () => {
      const activities = comdirect.parsePages(buySamples[5]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Buy',
        date: '2020-10-29',
        datetime: '2020-10-29T14:34:00.000Z',
        isin: 'US54405Q1004',
        wkn: 'A2QGHG',
        company: 'Lordstown Motors Corp.',
        foreignCurrency: 'USD',
        fxRate: 1.1643,
        shares: 50,
        price: 13.055054539208108,
        amount: 652.7527269604054,
        fee: +Big(677.59).minus(652.7527269604054),
        tax: 0,
      });
    });

    test('Can the buy order for Alibaba Group Holding be parsed', () => {
      const activities = comdirect.parsePages(buySamples[6]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Buy',
        date: '2020-11-03',
        datetime: '2020-11-03T14:30:00.000Z',
        isin: 'US01609W1027',
        wkn: 'A117ME',
        company: 'Alibaba Group Holding Ltd.',
        shares: 3,
        price: 243,
        amount: 729,
        fee: +Big(741.4).minus(729),
        tax: 0,
      });
    });

    test('Can parse the buy order: 2020_usd_epr_properties', () => {
      const result = comdirect.parsePages(buySamples[7]).activities;

      expect(result.length).toEqual(1);
      expect(result[0]).toEqual({
        broker: 'comdirect',
        type: 'Buy',
        date: '2019-01-30',
        datetime: '2019-01-30T14:30:00.000Z',
        isin: 'US26884U1097',
        wkn: 'A1J78V',
        company: 'EPR Properties',
        shares: 16,
        price: 63.0476522953395,
        amount: 1008.762436725432,
        fee: 25.027563274568,
        tax: 0,
        foreignCurrency: 'USD',
        fxRate: 1.1458,
      });
    });

    test('Can parse the buy order: 2004_fidelity_fds_europ', () => {
      const result = comdirect.parsePages(buySamples[8]).activities;

      expect(result.length).toEqual(1);
      expect(result[0]).toEqual({
        broker: 'comdirect',
        type: 'Buy',
        date: '2004-01-02',
        datetime: '2004-01-02T' + result[0].datetime.substring(11),
        isin: 'LU0048578792',
        wkn: '973270',
        company: 'Fidelity Fds-Europ. Growth Fd.',
        shares: 6.818,
        price: 7.5198005280140805,
        amount: 51.27,
        fee: -1.28,
        tax: 0,
      });
    });

    test('Can parse the buy order: 2003_jenoptik', () => {
      const result = comdirect.parsePages(buySamples[9]).activities;

      expect(result.length).toEqual(1);
      expect(result[0]).toEqual({
        broker: 'comdirect',
        type: 'Buy',
        date: '2003-10-20',
        datetime: '2003-10-20T' + result[0].datetime.substring(11),
        isin: 'DE0006229107',
        wkn: '622910',
        company: 'JENOPTIK AG',
        shares: 22,
        price: 6,
        amount: 132,
        fee: 9.9,
        tax: 0,
      });
    });
  });

  describe('Validate Sells', () => {
    test('Can parse the sell order: 2020_eur_stock_biontech', () => {
      const activities = comdirect.parsePages(sellSamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Sell',
        date: '2020-03-18',
        datetime: '2020-03-18T09:08:00.000Z',
        isin: 'US09075V1026',
        wkn: 'A2PSR2',
        company: 'BioNTech SE',
        shares: 250,
        price: 89.2,
        amount: 22300,
        fee: 68.2,
        tax: 3858.01,
      });
    });

    test('Can parse the sell order: 2020_usd_arcimoto', () => {
      const result = comdirect.parsePages(sellSamples[1]).activities;

      expect(result.length).toEqual(1);
      expect(result[0]).toEqual({
        broker: 'comdirect',
        type: 'Sell',
        date: '2020-11-20',
        datetime: '2020-11-20T15:35:00.000Z',
        isin: 'US0395871009',
        wkn: 'A2JN1H',
        company: 'Arcimoto Inc.',
        shares: 75,
        price: 12.250712250712251,
        amount: 918.8034188034188,
        fee: 24.5534188034188,
        tax: 0,
        foreignCurrency: 'USD',
        fxRate: 1.1934,
      });
    });

    test('Can parse the sell order: 2020_eur_stock_wirecard', () => {
      const result = comdirect.parsePages(sellSamples[2]).activities;

      expect(result.length).toEqual(1);
      expect(result[0]).toEqual({
        broker: 'comdirect',
        type: 'Sell',
        date: '2020-03-18',
        datetime: '2020-03-18T09:20:00.000Z',
        isin: 'DE0007472060',
        wkn: '747206',
        company: 'Wirecard AG',
        shares: 5,
        price: 83.06,
        amount: 415.3,
        fee: 6.4,
        tax: 0,
      });
    });

    test('Can parse the sell order: 2020_eur_sauren_global_balanced', () => {
      const result = comdirect.parsePages(sellSamples[3]).activities;

      expect(result.length).toEqual(1);
      expect(result[0]).toEqual({
        broker: 'comdirect',
        type: 'Sell',
        date: '2020-11-30',
        datetime: '2020-11-30T06:06:00.000Z',
        isin: 'LU0313462318',
        wkn: 'A0MX7N',
        company: 'Sauren Global Balanced Focus',
        shares: 100,
        price: 18.58,
        amount: 1858,
        fee: 0,
        tax: 0,
      });
    });

    test('Can parse the sell order: 2020_eur_sma_solar_technology', () => {
      const result = comdirect.parsePages(sellSamples[4]).activities;

      expect(result.length).toEqual(1);
      expect(result[0]).toEqual({
        broker: 'comdirect',
        type: 'Sell',
        date: '2021-01-13',
        datetime: '2021-01-13T14:55:00.000Z',
        isin: 'US78446M1099',
        wkn: 'A2QFGD',
        company: 'SMA Solar Technology AG',
        shares: 50,
        price: 6.045,
        amount: 302.25,
        fee: 6.8,
        tax: 0,
      });
    });
  });

  describe('Validate dividends', () => {
    test('Can the dividend in USD parsed from the document', () => {
      const activities = comdirect.parsePages(dividendSamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Dividend',
        date: '2020-07-29',
        datetime: '2020-07-29T' + activities[0].datetime.substring(11),
        isin: 'US3696041033',
        wkn: '851144',
        company: 'General Electric Co.',
        shares: 59.058,
        price: 0.008497940750190834,
        amount: 0.5018713848247703,
        fee: 0,
        tax: 0.07655665192242259,
        fxRate: 1.1756,
        foreignCurrency: 'USD',
      });
    });

    test('Can the dividend in EUR parsed from the document', () => {
      const activities = comdirect.parsePages(dividendSamples[1]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Dividend',
        date: '2020-05-08',
        datetime: '2020-05-08T' + activities[0].datetime.substring(11),
        isin: 'DE0005790430',
        wkn: '579043',
        company: 'FUCHS PETROLUB SE',
        shares: 13.128,
        price: 0.9696831200487508,
        amount: 12.73,
        fee: 0,
        tax: 0,
      });
    });

    test('Can the dividend in USD for Stryker Corp. be parsed from the document', () => {
      const activities = comdirect.parsePages(dividendSamples[2]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Dividend',
        date: '2020-11-03',
        datetime: '2020-11-03T' + activities[0].datetime.substring(11),
        isin: 'US8636671013',
        wkn: '864952',
        company: 'Stryker Corp.',
        shares: 1,
        price: 0.4955994189524054,
        amount: 0.4955994189524054,
        fxRate: 1.1703,
        foreignCurrency: 'USD',
        fee: 0,
        tax: 0.07690335811330429,
      });
    });
  });

  describe('Validate dividends from tax information', () => {
    test('Can the payout for be parsed from a tax information for iShsii_jpm', () => {
      const result = comdirect.parsePages(taxInfoDividendSamples[0]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Dividend',
        date: '2020-06-23',
        datetime: '2020-06-23T' + result.activities[0].datetime.substring(11),
        isin: 'IE00B2NPKV68',
        wkn: 'A0NECU',
        company: 'ISHSII-JPM DL EM BD DLDIS',
        shares: 4.249,
        price: 0.3224288067780654,
        amount: 1.37,
        fee: 0,
        tax: 0.35,
      });
    });

    test('Can the dividend for be parsed from a tax information for BASF', () => {
      const result = comdirect.parsePages(taxInfoDividendSamples[1]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Dividend',
        date: '2020-06-23',
        datetime: '2020-06-23T' + result.activities[0].datetime.substring(11),
        isin: 'DE000BASF111',
        wkn: 'BASF11',
        company: 'BASF SE NA O.N.',
        shares: 145.04,
        price: 3.2999862107004962,
        amount: 478.63,
        fee: 0,
        tax: 0,
      });
    });

    test('Can the dividend for be parsed from a tax information for Bayer', () => {
      const result = comdirect.parsePages(taxInfoDividendSamples[2]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Dividend',
        date: '2020-05-04',
        datetime: '2020-05-04T' + result.activities[0].datetime.substring(11),
        isin: 'DE000BAY0017',
        wkn: 'BAY001',
        company: 'BAYER AG NA O.N.',
        shares: 41.711,
        price: 2.799980820407087,
        amount: 116.79,
        fee: 0,
        tax: 0,
      });
    });

    test('Can the dividend for be parsed from a tax information for Daimler', () => {
      const result = comdirect.parsePages(taxInfoDividendSamples[3]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Dividend',
        date: '2020-07-13',
        datetime: '2020-07-13T' + result.activities[0].datetime.substring(11),
        isin: 'DE0007100000',
        wkn: '710000',
        company: 'DAIMLER AG NA O.N.',
        shares: 40,
        price: 0.9,
        amount: 36,
        fee: 0,
        tax: 0,
      });
    });

    test('Can the dividend for be parsed from a tax information for Freenet', () => {
      const result = comdirect.parsePages(taxInfoDividendSamples[4]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Dividend',
        date: '2020-06-02',
        datetime: '2020-06-02T' + result.activities[0].datetime.substring(11),
        isin: 'DE000A0Z2ZZ5',
        wkn: 'A0Z2ZZ',
        company: 'FREENET AG NA O.N.',
        shares: 86.988,
        price: 0.0400055180024831,
        amount: 3.48,
        fee: 0,
        tax: 0,
      });
    });

    test('Can the dividend for be parsed from a tax information for Fresenius', () => {
      const result = comdirect.parsePages(taxInfoDividendSamples[5]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Dividend',
        date: '2020-09-02',
        datetime: '2020-09-02T' + result.activities[0].datetime.substring(11),
        isin: 'DE0005785604',
        wkn: '578560',
        company: 'FRESENIUS SE+CO.KGAA O.N.',
        shares: 25,
        price: 0.84,
        amount: 21,
        fee: 0,
        tax: 0,
      });
    });

    test('Can the payout for be parsed from a tax information for all finanzplan from 2013', () => {
      const result = comdirect.parsePages(taxInfoDividendSamples[6]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Dividend',
        date: '2013-07-17',
        datetime: '2013-07-17T' + result.activities[0].datetime.substring(11),
        isin: 'LU0239364531',
        wkn: 'A0H0SB',
        company: 'ALL.FINANZPLAN 2020 A EO',
        shares: 4.617,
        price: 0.43318171973142733,
        amount: 2,
        fee: 0,
        tax: 0.23,
      });
    });

    test('Can the dividend for be parsed from a tax information for mondelez from 2018', () => {
      const result = comdirect.parsePages(taxInfoDividendSamples[7]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Dividend',
        date: '2018-01-16',
        datetime: '2018-01-16T' + result.activities[0].datetime.substring(11),
        isin: 'US6092071058',
        wkn: 'A1J4U0',
        company: 'MONDELEZ INTL INC. A',
        shares: 35,
        price: 0.18371428571428572,
        amount: 6.43,
        fee: 0,
        tax: 0.97,
      });
    });

    test('Can the dividend for be parsed from a tax information for garmin from 2019', () => {
      const result = comdirect.parsePages(taxInfoDividendSamples[8]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Dividend',
        date: '2019-12-31',
        datetime: '2019-12-31T' + result.activities[0].datetime.substring(11),
        isin: 'CH0114405324',
        wkn: 'A1C06B',
        company: 'GARMIN LTD NAM.SF 0,10',
        shares: 50,
        price: 0.5064,
        amount: 25.32,
        fee: 0,
        tax: 6.67,
      });
    });

    test('Can parse dividend from a tax information for chruch_dwight (2020)', () => {
      const result = comdirect.parsePages(taxInfoDividendSamples[9]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Dividend',
        date: '2020-12-03',
        datetime: '2020-12-03T' + result.activities[0].datetime.substring(11),
        isin: 'US1713401024',
        wkn: '864371',
        company: 'CHURCH + DWIGHT CO. DL 1',
        shares: 0.61,
        price: 0.22950819672131148,
        amount: 0.14,
        fee: 0,
        tax: 0.03,
      });
    });

    test('Can parse dividend from a tax information for STARBUCKS CORP (2020)', () => {
      const result = comdirect.parsePages(taxInfoDividendSamples[10]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Dividend',
        date: '2020-12-01',
        datetime: '2020-12-01T' + result.activities[0].datetime.substring(11),
        isin: 'US8552441094',
        wkn: '884437',
        company: 'STARBUCKS CORP.',
        shares: 1.378,
        price: 0.41364296081277213,
        amount: 0.57,
        fee: 0,
        tax: 0.13,
      });
    });

    test('Can parse dividend from a tax information for VISA (2020)', () => {
      const result = comdirect.parsePages(taxInfoDividendSamples[11]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Dividend',
        date: '2020-12-03',
        datetime: '2020-12-03T' + result.activities[0].datetime.substring(11),
        isin: 'US92826C8394',
        wkn: 'A0NC7B',
        company: 'VISA INC. CL. A DL -,0001',
        shares: 0.15,
        price: 0.26666666666666666,
        amount: 0.04,
        fee: 0,
        tax: 0.01,
      });
    });

    test('Can parse dividend from a tax information for ISHSII-JPM (2020)', () => {
      const result = comdirect.parsePages(taxInfoDividendSamples[12]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Dividend',
        date: '2020-11-27',
        datetime: '2020-11-27T' + result.activities[0].datetime.substring(11),
        isin: 'IE00B2NPKV68',
        wkn: 'A0NECU',
        company: 'ISHSII-JPM DL EM BD DLDIS',
        shares: 4.773,
        price: 0.40435784621831133,
        amount: 1.93,
        fee: 0,
        tax: 0.39,
      });
    });
  });

  describe('Validate all ignored statements', () => {
    test('The statement should be ignored: 2020_cost_information', () => {
      const result = comdirect.parsePages(ignoredSamples[0]);

      expect(result.status).toEqual(7);
      expect(result.activities.length).toEqual(0);
    });
  });

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
});
