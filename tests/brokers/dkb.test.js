import { findImplementation } from '../../src';
import * as dkb from '../../src/brokers/dkb';
import { buySamples, sellSamples, dividendsSamples } from './__mocks__/dkb';

describe('DKB broker', () => {
  let consoleErrorSpy;

  const allSamples = buySamples.concat(sellSamples).concat(dividendsSamples);

  describe('Check all documents', () => {
    test('Can the document parsed with DKB', () => {
      allSamples.forEach(samples => {
        expect(samples.some(item => dkb.canParsePage(item, 'pdf'))).toEqual(
          true
        );
      });
    });

    test('Can identify a implementation from the document as DKB', () => {
      allSamples.forEach(samples => {
        const implementations = findImplementation(samples, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(dkb);
      });
    });
  });

  describe('Buy', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const result = dkb.parsePages(buySamples[0]);

      expect(result.activities[0]).toEqual({
        broker: 'dkb',
        type: 'Buy',
        date: '2019-01-25',
        isin: 'US0378331005',
        company: 'APPLE INC.',
        shares: 36,
        price: 123,
        amount: 4428,
        fee: 10,
        tax: 0,
      });
    });

    test('Can parse invesco_msci_world buy action', () => {
      const result = dkb.parsePages(buySamples[3]);

      expect(result.activities[0]).toEqual({
        broker: 'dkb',
        type: 'Sell',
        date: '2020-09-10',
        isin: 'IE00B60SX394',
        company: 'I.M.-I.MSCI WORLD UETF',
        shares: 92,
        price: 58.887,
        amount: 5417.60,
        fee: 16.32,
        tax: 0,
      });
    });

    test('should map pdf data of sample 2 correctly', () => {
      const result = dkb.parsePages(buySamples[1]);

      expect(result.activities[0]).toEqual({
        broker: 'dkb',
        type: 'Buy',
        date: '2016-10-10',
        isin: 'US88160R1014',
        company: 'TESLA MOTORS INC.',
        shares: 1,
        price: 177.85,
        amount: 177.85,
        fee: 10,
        tax: 0,
      });
    });

    test('should map pdf data of sample 3 correctly', () => {
      const result = dkb.parsePages(buySamples[2]);

      expect(result.activities[0]).toEqual({
        broker: 'dkb',
        type: 'Buy',
        date: '2016-10-18',
        isin: 'LU0302296495',
        company: 'DNB FD-DNB TECHNOLOGY',
        shares: 0.7419,
        price: 353.8346,
        amount: 262.5,
        fee: 1.5,
        tax: 0,
      });
    });
  });

  describe('Sell', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const result = dkb.parsePages(sellSamples[0]);

      expect(result.activities[0]).toEqual({
        broker: 'dkb',
        type: 'Sell',
        date: '2020-01-27',
        isin: 'LU1861132840',
        company: 'AIS - AMUNDI STOXX GL.ART.INT.',
        shares: 36,
        price: 123,
        amount: 4428,
        fee: 10,
        tax: 0,
      });
    });


  });

  describe('Dividend', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const result = dkb.parsePages(dividendsSamples[0]);

      expect(result.activities[0]).toEqual({
        broker: 'dkb',
        type: 'Dividend',
        date: '2020-02-13',
        isin: 'US0378331005',
        company: 'APPLE INC.',
        shares: 36,
        price: 0.7080555555555555,
        amount: 25.49,
        fee: 0,
        tax: 3.82,
      });
    });

    test('should map pdf data of sample 2 correctly', () => {
      const result = dkb.parsePages(dividendsSamples[1]);

      expect(result.activities[0]).toEqual({
        broker: 'dkb',
        type: 'Dividend',
        date: '2016-03-10',
        isin: 'US5949181045',
        company: 'MICROSOFT CORP.',
        shares: 5,
        price: 0.32599999999999996,
        amount: 1.63,
        fee: 0,
        tax: 0.24,
      });
    });
    test('should map pdf data of sample 3 correctly', () => {
      const result = dkb.parsePages(dividendsSamples[2]);

      expect(result.activities[0]).toEqual({
        broker: 'dkb',
        type: 'Dividend',
        date: '2020-04-08',
        isin: 'IE00B3RBWM25',
        company: 'VANGUARD FTSE ALL-WORLD U.ETF',
        shares: 12,
        price: 0.375,
        amount: 4.5,
        fee: 0,
        tax: 0,
      });
    });
    test('should map pdf data of sample 4 correctly', () => {
      const result = dkb.parsePages(dividendsSamples[3]);

      expect(result.activities[0]).toEqual({
        broker: 'dkb',
        type: 'Dividend',
        date: '2020-04-08',
        isin: 'IE00B3RBWM25',
        company: 'VANGUARD FTSE ALL-WORLD U.ETF',
        shares: 12,
        price: 0.375,
        amount: 4.5,
        fee: 0,
        tax: 0.83,
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
