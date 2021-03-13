import { findImplementation } from '@/index';
import * as degiro from '../../src/brokers/degiro';
import Big from 'big.js';
import { transactionLog } from './__mocks__/degiro';

const allSamples = transactionLog; //.concat(futureSamples);

describe('Broker: DEGIRO', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can the document parsed with DEGIRO', () => {
      allSamples.forEach(pages => {
        expect(degiro.canParseDocument(pages, 'pdf')).toEqual(true);
      });
    });

    test('Can identify a implementation from the document as DEGIRO', () => {
      allSamples.forEach(pages => {
        const implementations = findImplementation(pages, 'pdf');

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
        amount: 601.4,
        fee: 2.66,
        tax: 0,
      });
    });

    test('Can the transactions be parsed from: mixed_transaction_log_2', () => {
      const activities = degiro.parsePages(transactionLog[3]).activities;
      expect(activities.length).toEqual(237);
      expect(
        activities.filter(activity => activity !== undefined).length
      ).toEqual(237);
      expect(activities[0]).toEqual({
        broker: 'degiro',
        type: 'Sell',
        date: '2020-12-04',
        datetime: '2020-12-04T15:39:00.000Z',
        isin: 'US7615256093',
        company: 'REVLON INC. NEW COMMO',
        shares: 100,
        price: 11.7069,
        amount: 1170.69,
        fee: 0,
        tax: 0.83,
        fxRate: 1.216,
        foreignCurrency: 'USD',
      });
      expect(activities[236]).toEqual({
        broker: 'degiro',
        type: 'Buy',
        date: '2015-01-02',
        datetime: '2015-01-02T10:49:00.000Z',
        isin: 'DE000A1PHEL8',
        company: 'SNOWBIRD AG',
        shares: 196,
        price: 5.1,
        amount: 999.6,
        tax: 0,
        fee: 2.08,
      });
    });

    test('Can parse 2021_transaction_log_1', () => {
      const activities = degiro.parsePages(transactionLog[4]).activities;
      expect(activities.length).toEqual(4);
      expect(
        activities.filter(activity => activity !== undefined).length
      ).toEqual(4);
      expect(activities[0]).toEqual({
        broker: 'degiro',
        type: 'Buy',
        date: '2021-01-29',
        datetime: '2021-01-29T14:41:00.000Z',
        isin: 'US00165C1045',
        company: 'AMC ENTERTAINMENT HOLD',
        shares: 15,
        price: +Big(160.55).div(15),
        amount: 160.55,
        fee: 0.55,
        tax: 0,
        fxRate: 1.2134,
        foreignCurrency: 'USD',
      });

      expect(activities[3]).toEqual({
        broker: 'degiro',
        type: 'Buy',
        date: '2021-01-15',
        datetime: '2021-01-15T08:10:00.000Z',
        isin: 'CH0038863350',
        company: 'NESTLE SA',
        shares: 4,
        price: 92.81,
        amount: 371.24,
        fee: 4.19,
        tax: 0,
        fxRate: 1.0766,
        foreignCurrency: 'CHF',
      });
    });

    test('Can parse 2021_transaction_log_2', () => {
      const activities = degiro.parsePages(transactionLog[5]).activities;
      expect(activities.length).toEqual(1);
      expect(
        activities.filter(activity => activity !== undefined).length
      ).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'degiro',
        type: 'Buy',
        date: '2021-01-26',
        datetime: '2021-01-26T13:54:00.000Z',
        isin: 'DE000TR6T1W3',
        company: 'CALL 15.12.21 NOKIA 8',
        shares: 207,
        price: 0.48,
        amount: 99.36,
        fee: 2.11,
        tax: 0,
      });
    });

    test('Can parse all transactions of file: place_of_execution_empty.json', () => {
      const activities = degiro.parsePages(transactionLog[6]).activities;
      expect(activities.length).toEqual(35);
      expect(
        activities.filter(activity => activity !== undefined).length
      ).toEqual(35);
      expect(activities[0]).toEqual({
        broker: 'degiro',
        type: 'Buy',
        company: 'CD PROJEKT RED SA',
        date: '2020-12-11',
        datetime: '2020-12-11T09:08:00.000Z',
        fee: 8.46,
        foreignCurrency: 'PLN',
        fxRate: 4.4388,
        isin: 'PLOPTTC00011',
        price: 72.02,
        shares: 30,
        amount: 2160.6,
        tax: 0,
      });
    });

    test('Can parse a transactions that has no place of execution ', () => {
      const activities = degiro.parsePages(transactionLog[6]).activities;
      expect(activities.length).toEqual(35);
      expect(
        activities.filter(activity => activity.isin === 'AU000000APX3')[0]
      ).toEqual({
        broker: 'degiro',
        type: 'Buy',
        company: 'APPEN LTD',
        date: '2020-12-03',
        datetime: '2020-12-02T23:26:00.000Z',
        foreignCurrency: 'AUD',
        fxRate: 1.6319,
        isin: 'AU000000APX3',
        price: 18.745,
        shares: 50,
        amount: 937.25,
        fee: 10.56,
        tax: 0,
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
