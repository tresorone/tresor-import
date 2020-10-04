import { findImplementation } from '../../src';
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
    test('Can the document parsed with scalable.capital', () => {
      allSamples.forEach(samples => {
        expect(
          samples.some(item => scalableCapital.canParsePage(item, 'pdf'))
        ).toEqual(true);
      });
    });

    test('Can identify a implementation from the document as scalable.capital', () => {
      allSamples.forEach(samples => {
        const implementations = findImplementation(samples, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(scalableCapital);
      });
    });
  });

  describe('Validate buys', () => {
    test('Can the market order be parsed from the document', () => {
      const activities = scalableCapital.parsePages(buySamples[0]);

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'scalablecapital',
        type: 'Buy',
        date: '2020-06-22',
        isin: 'LU0392494562',
        company: 'ComStage-MSCI World TRN U.ETF',
        shares: 9,
        price: 55.568,
        amount: 500.11,
        fee: 0,
        tax: 0,
      });
    });

    test('Can the saving plan order be parsed from the document - vanguard', () => {
      const activities = scalableCapital.parsePages(buySamples[1]);

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'scalablecapital',
        type: 'Buy',
        date: '2020-07-07',
        isin: 'IE00B3RBWM25',
        company: 'Vanguard FTSE All-World U.ETF',
        shares: 0.635,
        price: 78.68,
        amount: 49.96,
        fee: 0,
        tax: 0,
      });
    });

    test('Can the saving plan order be parsed from the document - comstage', () => {
      const activities = scalableCapital.parsePages(buySamples[2]);

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'scalablecapital',
        type: 'Buy',
        date: '2020-07-07',
        isin: 'LU0392494562',
        company: 'ComStage-MSCI World TRN U.ETF',
        shares: 0.883,
        price: 56.587,
        amount: 49.97,
        fee: 0,
        tax: 0,
      });
    });

    test('Can the limit order be parsed from the document', () => {
      const activities = scalableCapital.parsePages(buySamples[3]);

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'scalablecapital',
        type: 'Buy',
        date: '2020-09-02',
        isin: 'LU0392494562',
        company: 'ComStage-MSCI World TRN U.ETF',
        shares: 13,
        price: 58.558,
        amount: 761.25,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Validate sells', () => {
    test('Can the order be parsed from the document', () => {
      const activities = scalableCapital.parsePages(sellSamples[0]);

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'scalablecapital',
        type: 'Sell',
        date: '2020-06-22',
        isin: 'LU0392494562',
        company: 'ComStage-MSCI World TRN U.ETF',
        shares: 9,
        price: 55.477,
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
        price: 0.918978163729871,
        amount: 0.81,
        fee: 0,
        tax: 0,
      });
    });

    test('Can the stock dividend in USD with withholding taxes be parsed from the document', () => {
      const activities = scalableCapital.parsePages(dividendSamples[1]);

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'scalablecapital',
        type: 'Dividend',
        date: '2020-09-30',
        isin: 'US3765361080',
        company: 'Gladstone Commercial Corp.',
        shares: 33,
        price: 0.10674047097153871,
        amount: 2.6,
        fee: 0,
        tax: 0.92,
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
