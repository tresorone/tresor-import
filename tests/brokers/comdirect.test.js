import Big from 'big.js';

import { findImplementation } from '@/index';
import * as comdirect from '../../src/brokers/comdirect';
import { allSamples, buySamples, dividendSamples } from './__mocks__/comdirect';

describe('Broker: comdirect', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can one page parsed with comdirect', () => {
      allSamples.forEach(samples => {
        expect(
          samples.some(item => comdirect.canParsePage(item, 'pdf'))
        ).toEqual(true);
      });
    });

    test('Can identify a broker from one page as comdirect', () => {
      allSamples.forEach(samples => {
        const implementations = findImplementation(samples, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(comdirect);
      });
    });
  });

  describe('Validate buys', () => {
    test('Can the order parsed from saving_plan', () => {
      const result = comdirect.parsePages(buySamples[0]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Buy',
        date: '2020-08-07',
        isin: 'DE0007231334',
        wkn: "723133",
        company: 'Sixt SE',
        shares: 0.55,
        price: 44.74545454545454,
        amount: 24.61,
        fee: 0.37,
        tax: 0,
      });
    });

    test('Can the order with purchase reduction be parsed from purchase_eur_reduction', () => {
      const result = comdirect.parsePages(buySamples[1]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Buy',
        date: '2020-04-01',
        isin: 'LU0187079347',
        wkn: "A0CA0W",
        company: 'Robeco Global Consumer Trends',
        shares: 0.108,
        price: 235.09259259259258,
        amount: 25.39,
        fee: -0.55,
        tax: 0,
      });
    });

    test('Can the buy order with purchase reduction be parsed from purchase_usd_reduction', () => {
      const result = comdirect.parsePages(buySamples[2]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Buy',
        date: '2020-10-07',
        isin: 'LU0079474960',
        wkn: "986838",
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
      const result = comdirect.parsePages(buySamples[3]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Buy',
        date: '2020-11-02',
        isin: 'DE0006464506',
        wkn: '646450',
        company: 'Leifheit AG',
        shares: 75,
        price: 33.90,
        amount: 2542.50,
        fee: 13.76,
        tax: 0,
      });
    });

    test('Can the buy order for BYD Co. Ltd. be parsed ', () => {
      const result = comdirect.parsePages(buySamples[4]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Buy',
        date: '2020-11-02',
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
      const result = comdirect.parsePages(buySamples[5]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Buy',
        date: '2020-10-29',
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
      const result = comdirect.parsePages(buySamples[6]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Buy',
        date: '2020-11-03',
        isin: 'US01609W1027',
        wkn: 'A117ME',
        company: 'Alibaba Group Holding Ltd.',
        shares: 3,
        price: 243,
        amount: 729,
        fee: +Big(741.40).minus(729),
        tax: 0,
      });
    });
  });

  describe('Validate dividends', () => {
    test('Can the dividend in USD parsed from the document', () => {
      const result = comdirect.parsePages(dividendSamples[0]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Dividend',
        date: '2020-07-29',
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
      const result = comdirect.parsePages(dividendSamples[1]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Dividend',
        date: '2020-05-08',
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
      const result = comdirect.parsePages(dividendSamples[2]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Dividend',
        date: '2020-11-03',
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

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
});
