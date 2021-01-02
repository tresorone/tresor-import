import { findImplementation } from '@/index';
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
    test('Can the document parsed with 1822direkt', () => {
      allSamples.forEach(pages => {
        expect(_1822direkt.canParseDocument(pages, 'pdf')).toEqual(true);
      });
    });

    test('Can identify a implementation from the document as 1822direkt', () => {
      allSamples.forEach(pages => {
        const implementations = findImplementation(pages, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(_1822direkt);
      });
    });
  });

  describe('Validate buys', () => {
    test('Can the direct market order parsed from the document', () => {
      const activities = _1822direkt.parsePages(buySamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: '1822direkt',
        type: 'Buy',
        date: '2020-08-14',
        datetime: '2020-08-14T' + activities[0].datetime.substring(11),
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
      const activities = _1822direkt.parsePages(buySamples[1]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: '1822direkt',
        type: 'Buy',
        date: '2020-06-26',
        datetime: '2020-06-26T08:08:37.000Z',
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
      const activities = _1822direkt.parsePages(buySamples[2]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: '1822direkt',
        type: 'Buy',
        date: '2020-07-06',
        datetime: '2020-07-06T' + activities[0].datetime.substring(11),
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
    test('Can the markets order be parsed from the document', () => {
      const activities = _1822direkt.parsePages(sellSamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: '1822direkt',
        type: 'Sell',
        date: '2020-06-26',
        datetime: '2020-06-26T08:30:47.000Z',
        isin: 'LU0392494562',
        company: 'COMSTAGE-MSCI WORLD TRN U.ETF',
        shares: 1,
        price: 55.25,
        amount: 55.25,
        fee: 2.95,
        tax: 0,
      });
    });

    test('Can the funds redemption order be parsed from the document', () => {
      const activities = _1822direkt.parsePages(sellSamples[1]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: '1822direkt',
        type: 'Sell',
        date: '2020-11-24',
        datetime: '2020-11-24T' + activities[0].datetime.substring(11),
        isin: 'LU0392494562',
        company: 'COMSTAGE-MSCI WORLD TRN U.ETF',
        shares: 0.8793,
        price: 60.87797111338565,
        amount: 53.53,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Validate dividends', () => {
    test('Can the etf dividend be parsed from the document', () => {
      const activities = _1822direkt.parsePages(dividendSamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: '1822direkt',
        type: 'Dividend',
        date: '2020-08-25',
        datetime: '2020-08-25T' + activities[0].datetime.substring(11),
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
