import { findImplementation } from '@/index';
import * as peaks from '../../src/brokers/peaks';
import {
  overviewSamples,
  buySamples,
  dividendSamples,
  feesSamples,
  unknownSamples,
  numberFormatSamples,
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
      expect(activities[113]).toEqual({
        broker: 'peaks',
        type: 'Buy',
        date: '2020-07-08',
        datetime: '2020-07-08T' + activities[113].datetime.substring(11),
        isin: 'IE00B4WXJJ64',
        company: 'iShares Core Govt Bond UCITS ETF EUR (Dist)',
        shares: 0.010564,
        price: 132.53,
        amount: 1.4,
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

  describe('Validate unknown', () => {
    test('Can "unknown" entries be parsed as buy and sell', () => {
      // unknown entries are a switch of portfolios
      const activities = peaks.parsePages(unknownSamples[0]).activities;

      expect(activities.length).toEqual(12);
      expect(activities[6]).toEqual({
        broker: 'peaks',
        type: 'Buy',
        date: '2020-08-26',
        datetime: '2020-08-26T' + activities[6].datetime.substring(11),
        isin: 'IE00B52VJ196',
        company: 'iShares MSCI Europe SRI UCITS ETF EUR (Acc)',
        shares: 0.48347549,
        price: 47.5,
        amount: 22.97,
        fee: 0,
        tax: 0,
      });
      expect(activities[7]).toEqual({
        broker: 'peaks',
        type: 'Buy',
        date: '2020-08-26',
        datetime: '2020-08-26T' + activities[7].datetime.substring(11),
        isin: 'LU0629460089',
        company: 'UBS ETF-MSCI USA Socially Responsible',
        shares: 0.44857923,
        price: 122.26,
        amount: 54.84,
        fee: 0,
        tax: 0,
      });
      expect(activities[8]).toEqual({
        broker: 'peaks',
        type: 'Buy',
        date: '2020-08-26',
        datetime: '2020-08-26T' + activities[8].datetime.substring(11),
        isin: 'LU0629460832',
        company: 'UBS ETF-MSCI Pac Socially Responsible',
        shares: 0.21945726,
        price: 61.22,
        amount: 13.44,
        fee: 0,
        tax: 0,
      });
      expect(activities[9]).toEqual({
        broker: 'peaks',
        type: 'Buy',
        date: '2020-08-26',
        datetime: '2020-08-26T' + activities[9].datetime.substring(11),
        isin: 'IE00BYVJRP78',
        company: 'iShares Sustainable MSCI Em Mkt',
        shares: 1.57696059,
        price: 5.91,
        amount: 9.32,
        fee: 0,
        tax: 0,
      });
      expect(activities[10]).toEqual({
        broker: 'peaks',
        type: 'Sell',
        date: '2020-08-26',
        datetime: '2020-08-26T' + activities[10].datetime.substring(11),
        isin: 'IE00B4WXJJ64',
        company: 'iShares Core Govt Bond UCITS ETF EUR (Dist)',
        shares: 0.52972954,
        price: 132.51,
        amount: 70.2,
        fee: 0,
        tax: 0,
      });
      expect(activities[11]).toEqual({
        broker: 'peaks',
        type: 'Sell',
        date: '2020-08-26',
        datetime: '2020-08-26T' + activities[11].datetime.substring(11),
        isin: 'LU0484968812',
        company: 'Xtrackers II ESG EUR Corp Bond UCITS ETF',
        shares: 0.19276853,
        price: 157.51,
        amount: 30.36,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Validate number format', () => {
    test('Can English formatted numbers be parsed correctly', () => {
      const activities = peaks.parsePages(numberFormatSamples[0]).activities;

      expect(activities.length).toEqual(12);
      expect(activities[0]).toEqual({
        broker: 'peaks',
        type: 'Buy',
        date: '2020-07-02',
        datetime: '2020-07-02T' + activities[0].datetime.substring(11),
        isin: 'IE00B4WXJJ64',
        company: 'iShares Core Govt Bond UCITS ETF EUR (Dist)',
        shares: 0.0796132,
        price: 131.89,
        amount: 10.5,
        fee: 0,
        tax: 0,
      });
      expect(activities[11]).toEqual({
        broker: 'peaks',
        type: 'Buy',
        date: '2020-07-01',
        datetime: '2020-07-01T' + activities[11].datetime.substring(11),
        isin: 'LU0484968812',
        company: 'Xtrackers II ESG EUR Corp Bond UCITS ETF',
        shares: 0.01191687,
        price: 155.58,
        amount: 1.85,
        fee: 0,
        tax: 0,
      });
    });
    test('Can German formatted numbers be parsed correctly', () => {
      const activities = peaks.parsePages(numberFormatSamples[1]).activities;

      expect(activities.length).toEqual(12);
      expect(activities[0]).toEqual({
        broker: 'peaks',
        type: 'Buy',
        date: '2020-08-04',
        datetime: '2020-08-04T' + activities[0].datetime.substring(11),
        isin: 'LU0484968812',
        company: 'Xtrackers II ESG EUR Corp Bond UCITS ETF',
        shares: 0.00560401,
        price: 157.92,
        amount: 0.88,
        fee: 0,
        tax: 0,
      });
      expect(activities[11]).toEqual({
        broker: 'peaks',
        type: 'Buy',
        date: '2020-08-04',
        datetime: '2020-08-04T' + activities[11].datetime.substring(11),
        isin: 'IE00B4WXJJ64',
        company: 'iShares Core Govt Bond UCITS ETF EUR (Dist)',
        shares: 0.0785399,
        price: 133.69,
        amount: 10.5,
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
