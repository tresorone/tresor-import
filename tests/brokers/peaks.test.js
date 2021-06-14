//import Big from 'big.js';
import { findImplementation } from '@/index';
import * as peaks from '../../src/brokers/peaks';
import {
  overviewSamples,
  buySamples,
  dividendSamples,
  feesSamples,
} from './__mocks__/peaks';

describe('Broker: peaks', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can one page parsed with peaks', () => {
      overviewSamples.forEach(pages => {
        expect(peaks.canParseDocument(pages, 'pdf')).toEqual(true);
      });
    });

    test('Can identify a broker from one page as peaks', () => {
      overviewSamples.forEach(pages => {
        const implementations = findImplementation(pages, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(peaks);
      });
    });
  });

  describe('Validate buys', () => {
    test('Can all orders be parsed from overview', () => {
      const activities = peaks.parsePages(overviewSamples[0]).activities;

      expect(activities.length).toEqual(114);
      expect(activities[0]).toEqual({
        broker: 'peaks',
        type: 'Buy',
        date: '2020-10-02',
        datetime: '2020-10-02T' + activities[0].datetime.substring(11),
        isin: 'LU0484968812',
        company: 'Xtrackers II ESG EUR Corp Bond UCITS ETF',
        shares: 0.0094678,
        price: 158.43,
        amount: 1.5,
        fee: 0,
        tax: 0,
      });
    });

    test('Can a monthly purchase be parsed from buy_monthly', () => {
      const activities = peaks.parsePages(buySamples[0]).activities;

      expect(activities.length).toEqual(12);
      expect(activities[2]).toEqual({
        broker: 'peaks',
        type: 'Buy',
        date: '2020-10-02',
        datetime: '2020-10-02T' + activities[2].datetime.substring(11),
        isin: 'LU0629460089',
        company: 'UBS ETF-MSCI USA Socially Responsible',
        shares: 0.20238318,
        price: 121.06,
        amount: 24.5,
        fee: 0,
        tax: 0,
      });
    });

    test('Can parse odd money buy from buy_odd_money', () => {
      const result = peaks.parsePages(buySamples[1]);

      expect(result.activities.length).toEqual(12);
      expect(result.activities[9]).toEqual({
        broker: 'peaks',
        type: 'Buy',
        date: '2020-09-29',
        datetime: '2020-09-29T' + result.activities[9].datetime.substring(11),
        isin: 'IE00BYVJRP78',
        company: 'iShares Sustainable MSCI Em Mkt',
        shares: 0.03072824,
        price: 5.63,
        amount: 0.17,
        fee: 0,
        tax: 0,
      });
    });

    test('Can parse dividend buy from buy_dividends', () => {
      const result = peaks.parsePages(buySamples[2]);

      expect(result.activities.length).toEqual(4);
      expect(result.activities[0]).toEqual({
        broker: 'peaks',
        type: 'Buy',
        date: '2020-08-10',
        datetime: '2020-08-10T' + result.activities[0].datetime.substring(11),
        isin: 'LU0629460832',
        company: 'UBS ETF-MSCI Pac Socially Responsible',
        shares: 0.00182368,
        price: 59.78,
        amount: 0.11,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Validate dividends', () => {
    test('Can dividend be parsed from dividend', () => {
      const activities = peaks.parsePages(dividendSamples[0]).activities;

      expect(activities.length).toEqual(4);
      // the buy would be index 0 / 2, but we are looking for the dividend activity,
      // which is index + 1, because it is a copy of the buy activity
      expect(activities[3]).toEqual({
        broker: 'peaks',
        type: 'Dividend',
        date: '2020-08-10',
        datetime: '2020-08-10T' + activities[3].datetime.substring(11),
        isin: 'LU0629460089',
        company: 'UBS ETF-MSCI USA Socially Responsible',
        shares: 0.00231294,
        price: 118.42,
        amount: 0.27,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Validate fees', () => {
    test('Can sell be parsed from fees sell', () => {
      const activities = peaks.parsePages(feesSamples[0]).activities;

      expect(activities.length).toEqual(12);
      expect(activities[6]).toEqual({
        broker: 'peaks',
        type: 'Sell',
        date: '2020-09-01',
        datetime: '2020-09-01T' + activities[6].datetime.substring(11),
        isin: 'LU0629460089',
        company: 'UBS ETF-MSCI USA Socially Responsible',
        shares: 0.00402491,
        price: 123.2,
        amount: 0.5,
        fee: 0.5,
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
