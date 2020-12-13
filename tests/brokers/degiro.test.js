import { findImplementation } from '@/index';
import * as degiro from '../../src/brokers/degiro';
import { transactionLog } from './__mocks__/degiro';

const allSamples = transactionLog; //.concat(futureSamples);

describe('Broker: DEGIRO', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can the document parsed with DEGIRO', () => {
      allSamples.forEach(samples => {
        expect(samples.some(item => degiro.canParsePage(item, 'pdf'))).toEqual(
          true
        );
      });
    });

    test('Can identify a implementation from the document as DEGIRO', () => {
      allSamples.forEach(samples => {
        const implementations = findImplementation(samples, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(degiro);
      });
    });
  });

  describe('Validate transactionLog', () => {
    test('Can the transactions be parsed from: buy_only_transactions', () => {
      const activities = degiro.parsePages(transactionLog[0]).activities;

      expect(activities.length).toEqual(7);
      expect(activities[0]).toEqual({
        broker: 'degiro',
        type: 'Buy',
        date: '2020-03-30',
        datetime: '2020-03-30T14:09:00.000Z',
        isin: 'US64110L1061',
        company: 'NETFLIX INC. - COMMON',
        shares: 12,
        price: 332.7658333333333,
        amount: 3993.19,
        fee: 0.54,
        tax: 0,
        foreignCurrency: 'USD',
        fxRate: 1.1024,
      });
      expect(activities[6]).toEqual({
        broker: 'degiro',
        type: 'Buy',
        date: '2020-02-21',
        datetime: '2020-02-21T12:03:00.000Z',
        isin: 'KYG875721634',
        company: 'TENCENT HLDGS HD-,00002',
        shares: 416,
        price: 47.485,
        amount: 19753.76,
        fee: 25.28,
        tax: 0,
      });
    });

    test('Can the transactions be parsed from: buy_sell_and_call_transactions', () => {
      const activities = degiro.parsePages(transactionLog[1]).activities;

      expect(activities.length).toEqual(28);
      expect(
        activities.filter(activity => activity !== undefined).length
      ).toEqual(25);
      expect(activities[5]).toEqual({
        broker: 'degiro',
        type: 'Buy',
        date: '2019-05-31',
        datetime: '2019-05-31T07:00:00.000Z',
        isin: 'SE0011527845',
        company: 'QLINEA',
        shares: 100,
        price: 6.1153,
        amount: 611.53,
        fee: 4.36,
        tax: 0,
        fxRate: 10.6185,
        foreignCurrency: 'SEK',
      });
      expect(activities[9]).toEqual({
        broker: 'degiro',
        type: 'Sell',
        date: '2019-05-14',
        datetime: '2019-05-14T18:12:00.000Z',
        isin: 'US9839191015',
        company: 'XILINX INC. - COMMON',
        shares: 8,
        price: 100.90625,
        amount: 807.25,
        fee: 0,
        tax: 0.52,
        fxRate: 1.1226,
        foreignCurrency: 'USD',
      });
    });

    test('Can the transactions be parsed from: mixed_transaction_log_1', () => {
      const activities = degiro.parsePages(transactionLog[2]).activities;

      expect(activities.length).toEqual(16);
      expect(
          activities.filter(activity => activity !== undefined).length
      ).toEqual(16);
      expect(activities[0]).toEqual({
        broker: 'degiro',
        type: 'Sell',
        date: '2020-12-11',
        datetime: '2020-12-11T16:25:00.000Z',
        isin: 'US8969452015',
        company: 'TRIPADVISOR INC. - CO',
        shares: 47,
        price: 23.664468085106382,
        amount: 1112.23,
        fee: 0,
        tax: 0.66,
        fxRate: 1.2124,
        foreignCurrency: 'USD',
      });
      expect(activities[15]).toEqual({
        broker: 'degiro',
        type: 'Buy',
        date: '2020-12-08',
        datetime: '2020-12-08T15:55:00.000Z',
        isin: 'DE000KB9J0M8',
        company: 'CALL 16.12.21 NEXTERA 75',
        shares: 970,
        price: 0.62,
        amount: 601.40,
        fee: 2.66,
        tax: 0,
      });
    });

    test('Can the transactions be parsed from: mixed_transaction_log_2', () => {
      const activities = degiro.parsePages(transactionLog[3]).activities;

      expect(activities.length).toEqual(29);
      expect(
          activities.filter(activity => activity !== undefined).length
      ).toEqual(29);
      expect(activities[0]).toEqual({
        broker: 'degiro',
        type: 'Buy',
        date: '2020-12-10',
        datetime: '2020-12-10T16:14:00.000Z',
        isin: 'US3765361080',
        company: 'GLADSTONE COMMERCIAL C',
        shares: 2,
        price: 16.205,
        amount: 32.41,
        fee: 0.55,
        tax: 0,
        fxRate: 1.1252,
        foreignCurrency: 'USD',
      });
      expect(activities[1]).toEqual({
        broker: 'degiro',
        type: 'Sell',
        date: '2020-12-10',
        datetime: '2020-12-10T15:25:00.000Z',
        isin: 'CA90022K1003',
        company: 'TURMALINA METALS',
        shares: 100,
        price: 0.5057,
        amount: 50.57,
        fee: 0,
        tax: 8.13,
        foreignCurrency: 'EUR',
        fxRate: 0.9305,
      });
      expect(activities[4]).toEqual({
        broker: 'degiro',
        type: 'Buy',
        date: '2020-06-22',
        datetime: '2020-06-22T08:57:00.000Z',
        isin: 'CA90022K1003',
        company: 'TURMALINA METALS',
        shares: 100,
        price: 0.891,
        amount: 89.1,
        fee: 8.08,
        tax: 0,
        foreignCurrency: 'EUR',
        fxRate: 0.9373,
      });
      expect(activities[6]).toEqual({
        broker: 'degiro',
        type: 'Sell',
        date: '2020-05-11',
        datetime: '2020-05-11T07:00:00.000Z',
        isin: 'IE00B3WJKG14',
        company: 'BLACKROCK ISHARES S&P 500 INFORMATION TECHNOLOGY SEC...',
        shares: 3,
        price: 11.616666666666667,
        amount: 34.85,
        fee: 0,
        tax: 2.12,
        foreignCurrency: 'USD',
        fxRate: 1.0308,
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
