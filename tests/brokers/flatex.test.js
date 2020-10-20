import * as flatex from '../../src/brokers/flatex';
import { findImplementation } from '../../src';
import {
  buySamples,
  sellSamples,
  dividendsSamples,
  mixedPageSamples,
} from './__mocks__/flatex';
import Big from 'big.js';

describe('Broker: Flatex', () => {
  let consoleErrorSpy;

  const allSamples = buySamples
    .concat(sellSamples)
    .concat(dividendsSamples)
    .concat(mixedPageSamples);

  describe('Check all documents', () => {
    test('Can the document parsed with Flatex', () => {
      allSamples.forEach(samples => {
        expect(samples.some(item => flatex.canParsePage(item, 'pdf'))).toEqual(
          true
        );
      });
    });

    test('Can identify a implementation from the document as Flatex', () => {
      allSamples.forEach(samples => {
        const implementations = findImplementation(samples, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(flatex);
      });
    });
  });

  describe('canParsePage', () => {
    test('should accept Buy, Sell, Div Flatex PDFs only', () => {
      expect(flatex.canParsePage(['flatex Bank AG', 'Kauf'], 'pdf')).toEqual(
        true
      );
      expect(
        flatex.canParsePage(['FinTech Group Bank AG', 'Kauf'], 'pdf')
      ).toEqual(true); // old bank name
      expect(flatex.canParsePage(['flatex Bank AG', 'Verkauf'], 'pdf')).toEqual(
        true
      );
      expect(
        flatex.canParsePage(['flatex Bank AG', 'Dividendengutschrift'], 'pdf')
      ).toEqual(true);
    });

    test('should not accept any PDFs', () => {
      expect(flatex.canParsePage(['42'], 'pdf')).toEqual(false);
      expect(flatex.canParsePage(['flatex Bank AG', 'Kauf'], 'csv')).toEqual(
        false
      );
    });
  });

  describe('Buy', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const result = flatex.parsePages(buySamples[0]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'flatex',
        type: 'Buy',
        date: '2019-05-16',
        isin: 'US0378331005',
        company: 'APPLE INC.',
        shares: 4,
        price: 170,
        amount: 680,
        fee: +Big(5.9).plus(Big(0.85)),
        tax: 0,
      });
    });

    test('should map pdf data of sample 2 correctly', () => {
      const result = flatex.parsePages(buySamples[1]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'flatex',
        type: 'Buy',
        date: '2020-03-05',
        isin: 'US4642863926',
        company: 'ISHS-ISHARES MSCI WLD ETF',
        shares: 20,
        price: 82.4959,
        amount: 1649.92,
        fee: 5.9,
        tax: 0,
      });
    });

    test('should map pdf data of sample 3 correctly', () => {
      const result = flatex.parsePages(buySamples[2]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'flatex',
        type: 'Buy',
        date: '2019-10-17',
        isin: 'US5949181045',
        company: 'MICROSOFT',
        shares: 12,
        price: 125.5,
        amount: 1506,
        fee: +Big(5.9).plus(Big(0.85)),
        tax: 0,
      });
    });

    test('should map pdf data of sample 5 correctly', () => {
      const result = flatex.parsePages(buySamples[4]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'flatex',
        type: 'Buy',
        date: '2018-04-03',
        isin: 'US88160R1014',
        company: 'TESLA INC.',
        shares: 1,
        price: 207.83,
        amount: 207.83,
        fee: +Big(5.9).plus(Big(0.71)),
        tax: 0,
      });
    });
  });

  describe('Sell', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const result = flatex.parsePages(sellSamples[0]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'flatex',
        type: 'Sell',
        date: '2019-05-20',
        isin: 'US30303M1027',
        company: 'FACEBOOK INC.A',
        shares: 4,
        price: 164.5,
        amount: 658,
        fee: +Big(3.8).plus(Big(0.85)),
        tax: 28.33,
      });
    });

    test('should map pdf data of sample 2 correctly', () => {
      const result = flatex.parsePages(sellSamples[1]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'flatex',
        type: 'Sell',
        date: '2019-05-20',
        isin: 'DE000A1C9KL8',
        company: 'HSBC MSCI WORLD UC.ETF DZ',
        shares: 36,
        price: 18.95,
        amount: 682.2,
        fee: +Big(3.8).plus(Big(0.85)),
        tax: 17.17,
      });
    });
  });

  describe('Dividend', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const result = flatex.parsePages(dividendsSamples[0]);

      // stock
      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'flatex',
        type: 'Dividend',
        date: '2020-02-13',
        isin: 'US0378331005',
        company: 'APPLE INC.',
        shares: 7,
        amount: 4.96,
        price: 4.96 / 7,
        fee: 0,
        tax: +Big(4.96).minus(Big(3.6)), // calculate from Bemessungsgrundlage - Endbetrag#
      });
    });

    test('should map pdf data of sample 2 correctly', () => {
      const result = flatex.parsePages(dividendsSamples[1]);

      // stock
      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'flatex',
        type: 'Dividend',
        date: '2019-12-12',
        isin: 'US5949181045',
        company: 'MICROSOFT',
        shares: 16,
        amount: 7.326928257160815, // only available in USD, thus using net dividend in EUR
        price: 7.326928257160815 / 16,
        fee: 0,
        tax: 0, // skip bc only available in USD
      });
    });

    test('should map pdf data of sample 3 correctly', () => {
      const result = flatex.parsePages(dividendsSamples[2]);

      // index fund
      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'flatex',
        type: 'Dividend',
        date: '2018-11-09',
        isin: 'DE000A1C9KL8',
        company: 'HSBC MSCI WORLD UC.ETF DZ',
        shares: 36,
        amount: 3.02,
        price: 3.02 / 36,
        fee: 0,
        tax: +Big(3.02).minus(Big(2.18)), // calculate from Bemessungsgrundlage - Endbetrag (note: diff in pdf is wrong by 0,01)
      });
    });
  });

  describe('Mixed pages', () => {
    test('should map the multi page documents correctly', () => {
      const result = flatex.parsePages(mixedPageSamples[0]);

      expect(result.activities.length).toEqual(3);
      expect(result.activities[0]).toEqual({
        amount: 481.4,
        broker: 'flatex',
        company: 'ADIDAS AG NA O.N.',
        date: '2020-06-18',
        fee: 4.65,
        isin: 'DE000A1EWWW0',
        price: 240.7,
        shares: 2,
        tax: 0,
        type: 'Sell',
      });
      expect(result.activities[1]).toEqual({
        amount: 484.4,
        broker: 'flatex',
        company: 'WIRECARD AG',
        date: '2020-06-18',
        fee: 4.84,
        isin: 'DE0007472060',
        price: 48.44,
        shares: 10,
        tax: 0,
        type: 'Buy',
      });
      expect(result.activities[2]).toEqual({
        amount: 329.15,
        broker: 'flatex',
        company: 'WIRECARD AG',
        date: '2020-06-18',
        fee: 6.07,
        isin: 'DE0007472060',
        price: 32.915,
        shares: 10,
        tax: 0,
        type: 'Sell',
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
