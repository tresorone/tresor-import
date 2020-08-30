import { getBroker } from '../../src';
import * as _1822direkt from '../../src/brokers/1822direkt';
import {
  allSamples,
  buySamples,
  sellSamples,
  dividendSamples,
} from './__mocks__/1822direkt';

describe('Broker: 1822direkt', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can one page parsed with 1822direkt', () => {
      allSamples.forEach(samples => {
        expect(samples.some(item => _1822direkt.canParseData(item))).toEqual(
          true
        );
      });
    });

    test('Can identify a broker from one page as 1822direkt', () => {
      allSamples.forEach(samples => {
        expect(samples.some(item => getBroker(item) === _1822direkt)).toEqual(
          true
        );
      });
    });
  });

  describe('Validate buys', () => {
    test('Can the direct market order parsed from the document', () => {
      const activities = _1822direkt.parsePages(buySamples[0]);

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: '1822direkt',
        type: 'Buy',
        date: '2020-08-14',
        isin: 'LU0392494562',
        company: 'COMSTAGE-MSCI WORLD TRN U.ETF',
        shares: 10,
        price: 57.06,
        amount: 570.6,
        fee: 4.95,
        tax: 0,
      });
    });

    test('Can the exchange market order parsed from the document', () => {
      const activities = _1822direkt.parsePages(buySamples[1]);

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: '1822direkt',
        type: 'Buy',
        date: '2020-06-26',
        isin: 'LU0392494562',
        company: 'COMSTAGE-MSCI WORLD TRN U.ETF',
        shares: 1,
        price: 55.29,
        amount: 55.29,
        fee: 5.43,
        tax: 0,
      });
    });

    test('Can the saving plan order parsed from the document - comstage', () => {
      const activities = _1822direkt.parsePages(buySamples[2]);

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: '1822direkt',
        type: 'Buy',
        date: '2020-07-06',
        isin: 'LU0392494562',
        company: 'COMSTAGE-MSCI WORLD TRN U.ETF',
        shares: 0.8793,
        price: 56.86341407938133,
        amount: 50.0,
        fee: 2.95,
        tax: 0,
      });
    });
  });

  describe('Validate sells', () => {
    test('Can the order parsed from the document', () => {
      const activities = _1822direkt.parsePages(sellSamples[0]);

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: '1822direkt',
        type: 'Sell',
        date: '2020-06-26',
        isin: 'LU0392494562',
        company: 'COMSTAGE-MSCI WORLD TRN U.ETF',
        shares: 1,
        price: 55.25,
        amount: 55.25,
        fee: 2.95,
        tax: 0,
      });
    });
  });

  describe('Validate dividends', () => {
    test('Can the etf dividend be parsed from the document', () => {
      const activities = _1822direkt.parsePages(dividendSamples[0]);

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: '1822direkt',
        type: 'Dividend',
        date: '2020-08-25',
        isin: 'LU0392494562',
        company: 'COMSTAGE-MSCI WORLD TRN U.ETF',
        shares: 27.8793,
        price: 0.9193200690117758,
        amount: 25.63,
        fee: 0,
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
