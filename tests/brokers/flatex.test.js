import * as flatex from '../../src/brokers/flatex';
import { findImplementation } from '../../src';
import {
  buySamples,
  sellSamples,
  dividendSamples,
  mixedPageSamples,
  ignoredSamples,
  allSamples,
} from './__mocks__/flatex';
import Big from 'big.js';

describe('Broker: Flatex', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can the document parsed with Flatex', () => {
      allSamples.forEach(pages => {
        expect(flatex.canParseDocument(pages, 'pdf')).toEqual(true);
      });
    });

    test('Can identify a implementation from the document as Flatex', () => {
      allSamples.forEach(pages => {
        const implementations = findImplementation(pages, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(flatex);
      });
    });
  });

  describe('canParseDocument', () => {
    test('should accept Buy, Sell, Div Flatex PDFs only', () => {
      expect(
        flatex.canParseDocument([['flatex Bank AG', 'Kauf']], 'pdf')
      ).toEqual(true);
      expect(
        flatex.canParseDocument([['FinTech Group Bank AG', 'Kauf']], 'pdf')
      ).toEqual(true); // old bank name
      expect(
        flatex.canParseDocument([['flatex Bank AG', 'Verkauf']], 'pdf')
      ).toEqual(true);
      expect(
        flatex.canParseDocument(
          [['flatex Bank AG', 'Dividendengutschrift']],
          'pdf'
        )
      ).toEqual(true);
    });

    test('should not accept any PDFs', () => {
      expect(flatex.canParseDocument([['42']], 'pdf')).toEqual(false);
      expect(
        flatex.canParseDocument([['flatex Bank AG', 'Kauf']], 'csv')
      ).toEqual(false);
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
        datetime: '2019-05-16T06:00:00.000Z',
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
        datetime: '2020-03-05T14:55:00.000Z',
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
        datetime: '2019-10-17T14:52:00.000Z',
        isin: 'US5949181045',
        company: 'MICROSOFT DL-,00000625',
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
        datetime: '2018-04-03T09:29:00.000Z',
        isin: 'US88160R1014',
        company: 'TESLA INC. DL -,001',
        shares: 1,
        price: 207.83,
        amount: 207.83,
        fee: +Big(5.9).plus(Big(0.71)),
        tax: 0,
      });
    });

    test('Can parse buy of chinese stock BYD Co Ltd', () => {
      const result = flatex.parsePages(buySamples[5]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'flatex',
        type: 'Buy',
        date: '2020-11-05',
        datetime: '2020-11-05T13:18:00.000Z',
        isin: 'CNE100000296',
        company: 'BYD CO. LTD H YC 1',
        shares: 25,
        price: 21.25,
        amount: 531.25,
        fee: 8.41,
        tax: 0,
      });
    });

    test('Can parse three buys across two pdf pages', () => {
      const result = flatex.parsePages(buySamples[6]);

      expect(result.activities.length).toEqual(3);
      expect(result.activities[0]).toEqual({
        broker: 'flatex',
        type: 'Buy',
        date: '2020-10-13',
        datetime: '2020-10-13T13:55:00.000Z',
        isin: 'LU2237380790',
        company: 'ALLEGRO.EU ZY -,01',
        shares: 30,
        price: 17.7,
        amount: 531,
        fee: 6.75,
        tax: 0,
      });
    });

    test('Can parse statement: 2018_etf_ishares_tecdax', () => {
      const result = flatex.parsePages(buySamples[7]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'flatex',
        type: 'Buy',
        date: '2018-01-02',
        datetime: '2018-01-01T23:00:00.000Z',
        isin: 'DE0005933972',
        company: 'ISHARES TECDAX UCITS ETF',
        shares: 2.649551,
        price: 23.5889,
        amount: 62.5,
        fee: 1.5,
        tax: 0,
      });
    });

    test('Can parse statement: 2016_old_bank_name', () => {
      const result = flatex.parsePages(buySamples[8]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'flatex',
        type: 'Buy',
        date: '2016-05-17',
        datetime: '2016-05-17T07:04:00.000Z',
        isin: 'IE00B4L5Y983',
        company: 'ISHSIII-C.MSCI W.U.E.ACDL',
        shares: 15,
        price: 36.54,
        amount: 548.1,
        fee: 7.88,
        tax: 0,
      });
    });

    test('Can parse statement: 2020_dropbox', () => {
      const result = flatex.parsePages(buySamples[9]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'flatex',
        type: 'Buy',
        date: '2020-12-02',
        datetime: '2020-12-02T18:31:00.000Z',
        isin: 'US26210C1045',
        company: 'DROPBOX INC CL. A',
        shares: 60,
        price: 16.60067896776978,
        amount: 996.04,
        fee: 15.9,
        tax: 0,
        fxRate: 1.20477,
        foreignCurrency: 'USD',
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
        datetime: '2019-05-20T09:16:00.000Z',
        isin: 'US30303M1027',
        company: 'FACEBOOK INC.A DL-,000006',
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
        datetime: '2019-05-20T09:21:00.000Z',
        isin: 'DE000A1C9KL8',
        company: 'HSBC MSCI WORLD UC.ETF DZ',
        shares: 36,
        price: 18.95,
        amount: 682.2,
        fee: +Big(3.8).plus(Big(0.85)),
        tax: 17.17,
      });
    });

    test('Can parse statement: 2018_ishares_global_corporate', () => {
      const result = flatex.parsePages(sellSamples[2]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'flatex',
        type: 'Sell',
        date: '2018-12-11',
        datetime: '2018-12-11T20:47:00.000Z',
        isin: 'IE00B7J7TB45',
        company: 'IS GBL CORP BD U.ETF DLD',
        shares: 2,
        price: 82.106,
        amount: 164.21,
        fee: 6.54,
        tax: -0.21,
      });
    });
  });

  describe('Dividend', () => {
    test('should map pdf data of sample correctly: 2020_apple', () => {
      const activities = flatex.parsePages(dividendSamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'flatex',
        type: 'Dividend',
        date: '2020-02-13',
        datetime: '2020-02-13T' + activities[0].datetime.substring(11),
        isin: 'US0378331005',
        company: 'APPLE INC.',
        shares: 7,
        amount: 4.95997055305052,
        price: 0.7085672218643599,
        fee: 0,
        tax: 1.35997055305052,
        fxRate: 1.0867,
        foreignCurrency: 'USD',
      });
    });

    test('should map pdf data of sample correctly: 2019_microsoft', () => {
      const activities = flatex.parsePages(dividendSamples[1]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'flatex',
        type: 'Dividend',
        date: '2019-12-12',
        datetime: '2019-12-12T' + activities[0].datetime.substring(11),
        isin: 'US5949181045',
        company: 'MICROSOFT DL-,00000625',
        shares: 16,
        amount: 7.326928257160815,
        price: 0.45793301607255094,
        fee: 0,
        tax: 1.0969282571608152,
        fxRate: 1.1137,
        foreignCurrency: 'USD',
      });
    });

    test('should map pdf data of sample correctly: 2018_msci_world', () => {
      const activities = flatex.parsePages(dividendSamples[2]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'flatex',
        type: 'Dividend',
        date: '2018-11-09',
        datetime: '2018-11-09T' + activities[0].datetime.substring(11),
        isin: 'DE000A1C9KL8',
        company: 'HSBC MSCI WORLD UC.ETF DZ',
        shares: 36,
        amount: 3.0142781597038604,
        price: 0.08372994888066279,
        fee: 0,
        tax: 0.8342781597038604,
        fxRate: 1.1346,
        foreignCurrency: 'USD',
      });
    });

    test('should map pdf data of sample correctly: 2018_etf_001', () => {
      const activities = flatex.parsePages(dividendSamples[3]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'flatex',
        type: 'Dividend',
        date: '2018-08-23',
        datetime: '2018-08-23T' + activities[0].datetime.substring(11),
        isin: 'LU0378449770',
        company: 'COMST.-NASDAQ-100 U.ETF I',
        shares: 25.28,
        amount: 9.2235944382071,
        price: 0.36485737492907827,
        fee: 0,
        tax: 0,
        fxRate: 1.1579,
        foreignCurrency: 'USD',
      });
    });

    test('should map pdf data of sample correctly: 2020_ishare_msci_eu', () => {
      const activities = flatex.parsePages(dividendSamples[4]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'flatex',
        type: 'Dividend',
        date: '2020-11-25',
        datetime: '2020-11-25T' + activities[0].datetime.substring(11),
        isin: 'IE00BYYHSM20',
        company: 'ISHSII-MSCI EU.QUA.DV.EOD',
        shares: 709.25,
        amount: 58.44,
        price: 0.08239689813182939,
        fee: 0,
        tax: 0,
      });
    });

    test('should map pdf data of sample correctly: 2020_royal_dutch_shell', () => {
      const activities = flatex.parsePages(dividendSamples[5]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'flatex',
        type: 'Dividend',
        date: '2020-09-22',
        datetime: '2020-09-22T' + activities[0].datetime.substring(11),
        isin: 'GB00B03MLX29',
        company: 'ROYAL DUTCH SHELL A EO-07',
        shares: 25,
        amount: 3.38,
        price: 0.1352,
        fee: 0,
        tax: 0.51,
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
        datetime: '2020-06-18T10:53:00.000Z',
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
        datetime: '2020-06-18T11:20:00.000Z',
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
        datetime: '2020-06-18T13:33:00.000Z',
        fee: 6.07,
        isin: 'DE0007472060',
        price: 32.915,
        shares: 10,
        tax: 0,
        type: 'Sell',
      });
    });
  });

  describe('Validate all ignored statements', () => {
    test('The statement should be ignored: 2020_order_confirmation', () => {
      const result = flatex.parsePages(ignoredSamples[0]);

      expect(result.status).toEqual(7);
      expect(result.activities.length).toEqual(0);
    });

    test('The statement should be ignored: 2020_saving_plan_confirmation', () => {
      const result = flatex.parsePages(ignoredSamples[1]);

      expect(result.status).toEqual(7);
      expect(result.activities.length).toEqual(0);
    });
  });

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
});
