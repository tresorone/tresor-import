import { findImplementation } from '@/index';
import * as degiro from '../../src/brokers/degiro';
import {
  transactionLog
} from './__mocks__/degiro';

const allSamples = transactionLog//.concat(futureSamples);

describe('Broker: DEGIRO', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can the document parsed with DEGIRO', () => {
      allSamples.forEach(samples => {
        expect(
          samples.some(item => degiro.canParsePage(item, 'pdf'))
        ).toEqual(true);
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
    test('Can the transactions be parsed from buy_only_transactions', () => {
      const activities = degiro.parsePages(transactionLog[0]).activities;
      expect(activities.length).toEqual(7);
      expect(activities[0]).toEqual({
        broker: 'degiro',
        type: 'Buy',
        date: '2020-03-30',
        isin: 'US64110L1061',
        company: 'NETFLIX INC. - COMMON',
        shares: 12,
        price: 332.7658333333333,
        amount: 3993.19,
        fee: 0.54,
        tax: 0,
      });
      expect(activities[6]).toEqual({
        broker: 'degiro',
        type: 'Buy',
        date: '2020-02-21',
        isin: 'KYG875721634',
        company: 'TENCENT HLDGS HD-,00002',
        shares: 416,
        price: 47.485,
        amount: 19753.76,
        fee: 25.28,
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
