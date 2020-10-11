import { findImplementation } from '../../src';
import * as baaderBank from '../../src/brokers/baaderBank';
import {
  allSamples,
  buySamples,
  sellSamples,
  dividendSamples,
} from './__mocks__/baaderbank';

describe('Broker: scalable.capital', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can the document parsed with scalable.capital', () => {
      allSamples.forEach(samples => {
        expect(
          samples.some(item => baaderBank.canParsePage(item, 'pdf'))
        ).toEqual(true);
      });
    });

    test('Can identify a implementation from the document as scalable.capital', () => {
      allSamples.forEach(samples => {
        const implementations = findImplementation(samples, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(baaderBank);
      });
    });
  });

  describe('Validate buys', () => {
    test('Can the market order be parsed from the document', () => {
      const activities = baaderBank.parsePages(buySamples[0]).activities;

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
      const activities = baaderBank.parsePages(buySamples[1]).activities;

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
      const activities = baaderBank.parsePages(buySamples[2]).activities;

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
      const activities = baaderBank.parsePages(buySamples[3]).activities;

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

    test('Can the BioNTech order be parsed from the document of Gratisbroker', () => {
      const activities = baaderBank.parsePages(buySamples[4]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'gratisbroker',
        type: 'Buy',
        date: '2020-10-05',
        isin: 'US09075V1026',
        company: 'BioNTech SE',
        shares: 34,
        price: 63.92,
        amount: 2173.28,
        fee: 0,
        tax: 0,
      });
    });

    test('Can a order made from Oskar be parsed from the document', () => {
      const activities = baaderBank.parsePages(buySamples[5]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'oskar',
        type: 'Buy',
        date: '2020-09-24',
        isin: 'IE00BZ163L38',
        company: 'Vang.USD Em.Mkts Gov.Bd U.ETF',
        shares: 0.01,
        price: 43.87,
        amount: 0.44,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Validate sells', () => {
    test('Can the order be parsed from the document', () => {
      const activities = baaderBank.parsePages(sellSamples[0]).activities;

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
      const activities = baaderBank.parsePages(dividendSamples[0]).activities;

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
      const activities = baaderBank.parsePages(dividendSamples[1]).activities;

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

    test('Can the stock dividend from Volkswagen with taxes be parsed from the document of Gratisbroker', () => {
      const activities = baaderBank.parsePages(dividendSamples[2]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'gratisbroker',
        type: 'Dividend',
        date: '2020-10-05',
        isin: 'DE0007664039',
        company: 'Volkswagen AG',
        shares: 12,
        price: 4.86,
        amount: 42.94,
        fee: 0,
        tax: 15.38,
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
