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
      allSamples.forEach(sample => {
        expect(
          sample.some(item => smartbroker.canParsePage(item, 'pdf'))
        ).toEqual(true);
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
        price: 0.8755555555555555,
        amount: 7.88,
        fee: 0,
        tax: 2.07,
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
        price: 0.160625,
        amount: 5.14,
        fee: 0,
        tax: 1.34,
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
