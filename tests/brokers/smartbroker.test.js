import { findImplementation } from '../../src';
import * as smartbroker from '../../src/brokers/smartbroker';
import {
  buySamples,
  sellSamples,
  dividendSamples,
} from './__mocks__/smartbroker';

describe('Smartbroker broker test', () => {
  let consoleErrorSpy;

  const allSamples = buySamples.concat(sellSamples).concat(dividendSamples);

  describe('Check all documents', () => {
    test('Can the document parsed with smartbroker', () => {
      allSamples.forEach(pages => {
        expect(smartbroker.canParseDocument(pages, 'pdf')).toEqual(true);
      });
    });

    test('Can identify a implementation from the document as smartbroker', () => {
      allSamples.forEach(sample => {
        const implementations = findImplementation(sample, 'pdf');
        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(smartbroker);
      });
    });
  });

  describe('Buy', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const activities = smartbroker.parsePages(buySamples[0]).activities;

      expect(activities[0]).toEqual({
        broker: 'smartbroker',
        type: 'Buy',
        date: '2020-06-24',
        datetime: '2020-06-24T15:33:00.000Z',
        isin: 'US0028241000',
        company: 'Abbott Laboratories Registered Shares o.N.',
        shares: 14,
        price: 77.86,
        amount: 1090.04,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Sell', () => {
    test('should map pdf data of sell comission vanguard correctly', () => {
      const activities = smartbroker.parsePages(sellSamples[0]).activities;

      expect(activities[0]).toEqual({
        broker: 'smartbroker',
        type: 'Sell',
        date: '2020-11-05',
        datetime: '2020-11-05T08:48:00.000Z',
        isin: 'IE00B3RBWM25',
        company: 'Vanguard FTSE All-World U.ETF Registered Shares USD Dis.oN',
        shares: 26,
        price: 82.3,
        amount: 2139.8,
        fee: 0,
        tax: 27.57,
      });
    });
  });

  describe('Dividend', () => {
    test('should parse dividend_etf_usd correctly', () => {
      const activities = smartbroker.parsePages(dividendSamples[0]).activities;

      expect(activities[0]).toEqual({
        broker: 'smartbroker',
        type: 'Dividend',
        date: '2020-10-07',
        datetime: '2020-10-07T' + activities[0].datetime.substring(11),
        isin: 'IE00BZ163L38',
        company: 'Vang.USD Em.Mkts Gov.Bd U.ETF Registered Shares USD Dis.oN',
        shares: 445,
        price: 0.16415730337078652,
        amount: 73.05,
        fee: 0,
        tax: 20.45,
        foreignCurrency: 'USD',
        fxRate: 1.1804,
      });
    });

    test('should parse dividend_stock_usd correctly', () => {
      const activities = smartbroker.parsePages(dividendSamples[1]).activities;

      expect(activities[0]).toEqual({
        broker: 'smartbroker',
        type: 'Dividend',
        date: '2020-09-30',
        datetime: '2020-09-30T' + activities[0].datetime.substring(11),
        isin: 'US7134481081',
        company: 'PepsiCo Inc. Registered Shares DL -,0166',
        shares: 9,
        price: 1.0068453349316437,
        amount: 9.061608014384793,
        fee: 0,
        tax: 2.0716080143847933,
        foreignCurrency: 'USD',
        fxRate: 1.1679,
      });
    });

    test('should parse dividend_stock_usd_2 correctly', () => {
      const activities = smartbroker.parsePages(dividendSamples[2]).activities;

      expect(activities[0]).toEqual({
        broker: 'smartbroker',
        type: 'Dividend',
        date: '2020-10-30',
        datetime: '2020-10-30T' + activities[0].datetime.substring(11),
        isin: 'US5021751020',
        company: 'LTC Properties Inc. Registered Shares DL -,01',
        shares: 32,
        price: 0.18468176338719228,
        amount: 5.909816428390153,
        fee: 0,
        tax: 1.339816428390153,
        foreignCurrency: 'USD',
        fxRate: 1.1821,
      });
    });

    test('Should parse the document correctly: 2020_pan_american_silver', () => {
      const activities = smartbroker.parsePages(dividendSamples[3]).activities;

      expect(activities[0]).toEqual({
        broker: 'smartbroker',
        type: 'Dividend',
        date: '2020-11-27',
        datetime: '2020-11-27T' + activities[0].datetime.substring(11),
        isin: 'CA6979001089',
        company: 'Pan American Silver Corp. Registered Shares o.N.',
        shares: 25,
        price: 0.07358246262388712,
        amount: 1.839561565597178,
        fee: 0,
        tax: 0.5295615655971779,
        foreignCurrency: 'USD',
        fxRate: 1.1906,
      });
    });

    test('Should parse the document correctly: 2020_ishares_global_clean_energy', () => {
      const activities = smartbroker.parsePages(dividendSamples[4]).activities;

      expect(activities[0]).toEqual({
        broker: 'smartbroker',
        type: 'Dividend',
        date: '2020-11-25',
        datetime: '2020-11-25T' + activities[0].datetime.substring(11),
        isin: 'IE00B1XNHC34',
        company: 'iShsII-Gl.Clean Energy U.ETF Registered Shares o.N.',
        shares: 140,
        price: 0.02942857142857143,
        amount: 4.12,
        fee: 0,
        tax: 1.09,
        foreignCurrency: 'USD',
        fxRate: 1.19035,
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
