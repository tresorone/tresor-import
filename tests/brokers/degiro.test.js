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
        type: 'Buy',
        date: '2019-05-14',
        datetime: '2019-05-14T18:12:00.000Z',
        isin: 'US9839191015',
        company: 'XILINX INC. - COMMON',
        shares: 8,
        price: 100.90625,
        amount: 807.25,
        fee: 0.52,
        tax: 0,
        fxRate: 1.1226,
        foreignCurrency: 'USD',
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
