import { getBroker } from '../../src';
import * as scalableCapital from '../../src/brokers/scalableCapital';
import {
  allSamples,
  buySamples,
  sellSamples,
  dividendSamples,
} from './__mocks__/scalablecapital';

describe('Broker: scalable.capital', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can one page parsed with scalable.capital', () => {
      allSamples.forEach(samples => {
        expect(
          samples.some(item => scalableCapital.canParseData(item))
        ).toEqual(true);
      });
    });

    test('Can identify a broker from one page as scalable.capital', () => {
      allSamples.forEach(samples => {
        expect(
          samples.some(item => getBroker(item) === scalableCapital)
        ).toEqual(true);
      });
    });
  });

  describe('Validate buys', () => {
    test('Can the market order parsed from the document', () => {
      const activities = scalableCapital.parsePages(buySamples[0]);

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'scalablecapital',
        type: 'Buy',
        date: '2020-06-22',
        isin: 'LU0392494562',
        company: 'ComStage-MSCI World TRN U.ETF',
        shares: 9,
        price: 55.56777777777778,
        amount: 500.11,
        fee: 0,
        tax: 0,
      });
    });

    test('Can the saving plan order parsed from the document - vanguard', () => {
      const activities = scalableCapital.parsePages(buySamples[1]);

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'scalablecapital',
        type: 'Buy',
        date: '2020-07-07',
        isin: 'IE00B3RBWM25',
        company: 'Vanguard FTSE All-World U.ETF',
        shares: 0.635,
        price: 78.67716535433071,
        amount: 49.96,
        fee: 0,
        tax: 0,
      });
    });

    test('Can the saving plan order parsed from the document - comstage', () => {
      const activities = scalableCapital.parsePages(buySamples[2]);

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'scalablecapital',
        type: 'Buy',
        date: '2020-07-07',
        isin: 'LU0392494562',
        company: 'ComStage-MSCI World TRN U.ETF',
        shares: 0.883,
        price: 56.5911664779162,
        amount: 49.97,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Validate sells', () => {
    test('Can the order parsed from the document', () => {
      const activities = scalableCapital.parsePages(sellSamples[0]);

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'scalablecapital',
        type: 'Sell',
        date: '2020-06-22',
        isin: 'LU0392494562',
        company: 'ComStage-MSCI World TRN U.ETF',
        shares: 9,
        price: 55.47666666666667,
        amount: 499.29,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Validate dividends', () => {
    test('Can the etf dividend be parsed from the document', () => {
      const activities = scalableCapital.parsePages(dividendSamples[0]);

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'scalablecapital',
        type: 'Dividend',
        date: '2020-08-25',
        isin: 'LU0392494562',
        company: 'ComStage-MSCI World TRN U.ETF',
        shares: 0.883,
        price: 0.9173272933182333,
        amount: 0.81,
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
