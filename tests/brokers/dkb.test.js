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
      const activities = dkb.parsePages(buySamples[0]).activities;

      expect(activities[0]).toEqual({
        broker: 'dkb',
        type: 'Buy',
        date: '2019-01-25',
        datetime: '2019-01-25T20:34:28.000Z',
        isin: 'US0378331005',
        company: 'APPLE INC. REGISTERED SHARES O.N.',
        shares: 36,
        price: 123,
        amount: 4428,
        fee: 10,
        tax: 0,
      });
    });

    test('should map pdf data of sample 2 correctly', () => {
      const activities = dkb.parsePages(buySamples[1]).activities;

      expect(activities[0]).toEqual({
        broker: 'dkb',
        type: 'Buy',
        date: '2016-10-10',
        datetime: '2016-10-10T06:00:02.000Z',
        isin: 'US88160R1014',
        company: 'TESLA MOTORS INC. REGISTERED SHARES DL-,001',
        shares: 1,
        price: 177.85,
        amount: 177.85,
        fee: 10,
        tax: 0,
      });
    });

    test('should map pdf data of sample 3 correctly', () => {
      const activities = dkb.parsePages(buySamples[2]).activities;

      expect(activities[0]).toEqual({
        broker: 'dkb',
        type: 'Buy',
        date: '2016-10-18',
        datetime: '2016-10-18T' + activities[0].datetime.substring(11),
        isin: 'LU0302296495',
        company: 'DNB FD-DNB TECHNOLOGY ACT. NOMINAT. A ACC. O.N.',
        shares: 0.7419,
        price: 353.8346,
        amount: 262.5,
        fee: 1.5,
        tax: 0,
      });
    });

    test('Can parse limit market order for McDonalds', () => {
      const activities = dkb.parsePages(buySamples[3]).activities;

      expect(activities[0]).toEqual({
        broker: 'dkb',
        type: 'Buy',
        date: '2020-07-07',
        datetime: '2020-07-07T' + activities[0].datetime.substring(11),
        isin: 'US5801351017',
        company: 'MC DONALD S CORP. SHARES REGISTERED SHARES DL-,01',
        shares: 8,
        price: 165.02,
        amount: 1320.16,
        fee: 10,
        tax: 0,
      });
    });
  });

  describe('Sell', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const activities = dkb.parsePages(sellSamples[0]).activities;

      expect(activities[0]).toEqual({
        broker: 'dkb',
        type: 'Sell',
        date: '2020-01-27',
        datetime: '2020-01-27T07:00:01.000Z',
        isin: 'LU1861132840',
        company: 'AIS - AMUNDI STOXX GL.ART.INT. ACT. NOM. AH EUR ACC. ON',
        shares: 36,
        price: 123,
        amount: 4428,
        fee: 10,
        tax: 0,
      });
    });

    test('Can parse invesco_msci_world buy action', () => {
      const activities = dkb.parsePages(sellSamples[1]).activities;

      expect(activities[0]).toEqual({
        broker: 'dkb',
        type: 'Sell',
        date: '2020-09-10',
        datetime: '2020-09-10T13:39:56.000Z',
        isin: 'IE00B60SX394',
        company: 'I.M.-I.MSCI WORLD UETF REGISTERED SHARES ACC O.N',
        shares: 92,
        price: 58.887,
        amount: 5417.6,
        fee: 16.32,
        tax: 0,
      });
    });

    test('Can parse IE00B4L5Y983 regular buys', () => {
      const activities = dkb.parsePages(sellSamples[2]).activities;

      expect(activities[0]).toEqual({
        broker: 'dkb',
        type: 'Sell',
        date: '2020-10-14',
        datetime: '2020-10-14T07:04:03.000Z',
        isin: 'IE00B4L5Y983',
        company: 'ISHSIII-CORE MSCI WORLD U.ETF REGISTERED SHS USD (ACC) O.N.',
        shares: 60,
        price: 57.104,
        amount: 3426.24,
        fee: 10.86,
        tax: 0,
      });
    });

    test('Can parse a redemption of ETF fragments', () => {
      const activities = dkb.parsePages(sellSamples[3]).activities;

      expect(activities[0]).toEqual({
        broker: 'dkb',
        type: 'Sell',
        date: '2020-10-28',
        datetime: '2020-10-28T' + activities[0].datetime.substring(11),
        isin: 'IE00B3RBWM25',
        company: 'VANGUARD FTSE ALL-WORLD U.ETF REGISTERED SHARES USD DIS.ON',
        shares: 0.3807,
        price: 78.82,
        amount: 30.01,
        fee: 0,
        tax: 0.37,
      });
    });

    test('Should map the document correctly: 2020_etf_tecdax', () => {
      const activities = dkb.parsePages(sellSamples[4]).activities;

      expect(activities[0]).toEqual({
        broker: 'dkb',
        type: 'Sell',
        date: '2020-12-09',
        datetime: '2020-12-09T' + activities[0].datetime.substring(11),
        isin: 'DE0005933972',
        company: 'ISHARES TECDAX UCITS ETF DE INHABER-ANTEILE',
        shares: 100,
        price: 28.3152,
        amount: 2831.52,
        fee: 10,
        tax: 2.18,
      });
    });
  });

  describe('Dividend', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const activities = dkb.parsePages(dividendsSamples[0]).activities;

      expect(activities[0]).toEqual({
        broker: 'dkb',
        type: 'Dividend',
        date: '2020-02-13',
        datetime: '2020-02-13T' + activities[0].datetime.substring(11),
        isin: 'US0378331005',
        company: 'APPLE INC. REGISTERED SHARES O.N.',
        shares: 36,
        price: 0.7080555555555555,
        amount: 25.49,
        fee: 0,
        tax: 3.82,
      });
    });

    test('should map pdf data of sample 2 correctly', () => {
      const activities = dkb.parsePages(dividendsSamples[1]).activities;

      expect(activities[0]).toEqual({
        broker: 'dkb',
        type: 'Dividend',
        date: '2016-03-10',
        datetime: '2016-03-10T' + activities[0].datetime.substring(11),
        isin: 'US5949181045',
        company: 'MICROSOFT CORP. REGISTERED SHARES DL-,00000625',
        shares: 5,
        price: 0.32599999999999996,
        amount: 1.63,
        fee: 0,
        tax: 0.24,
      });
    });
    test('should map pdf data of sample 3 correctly', () => {
      const activities = dkb.parsePages(dividendsSamples[2]).activities;

      expect(activities[0]).toEqual({
        broker: 'dkb',
        type: 'Dividend',
        date: '2020-04-08',
        datetime: '2020-04-08T' + activities[0].datetime.substring(11),
        isin: 'IE00B3RBWM25',
        company: 'VANGUARD FTSE ALL-WORLD U.ETF REGISTERED SHARES USD DIS.ON',
        shares: 12,
        price: 0.375,
        amount: 4.5,
        fee: 0,
        tax: 0,
      });
    });
    test('should map pdf data of sample 4 correctly', () => {
      const activities = dkb.parsePages(dividendsSamples[3]).activities;

      expect(activities[0]).toEqual({
        broker: 'dkb',
        type: 'Dividend',
        date: '2020-04-08',
        datetime: '2020-04-08T' + activities[0].datetime.substring(11),
        isin: 'IE00B3RBWM25',
        company: 'VANGUARD FTSE ALL-WORLD U.ETF REGISTERED SHARES USD DIS.ON',
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
