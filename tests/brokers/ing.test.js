import { findImplementation } from '../../src';
import * as ing from '../../src/brokers/ing';
import {
  buySamples,
  sellSamples,
  dividendsSamples,
  invalidSamples,
} from './__mocks__/ing';

describe('Broker: ING', () => {
  let consoleErrorSpy;

  const allSamples = buySamples.concat(sellSamples, dividendsSamples);

  describe('Check all documents', () => {
    test('Can the document parsed with ING', () => {
      allSamples.forEach(samples => {
        expect(samples.some(item => ing.canParsePage(item, 'pdf'))).toEqual(
          true
        );
      });
    });

    test('Can identify a implementation from the document as ING', () => {
      allSamples.forEach(samples => {
        const implementations = findImplementation(samples, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(ing);
      });
    });

    test('Should not identify ing as broker if ing BIC is not present', () => {
      invalidSamples.forEach(samples => {
        const implementations = findImplementation(samples, 'pdf');

        expect(implementations.length).toEqual(0);
      });
    });
  });

  describe('Buy', () => {
    test('Test if buy1 is mapped correctly', () => {
      const activities = ing.parsePages(buySamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Buy',
        date: '2020-03-03',
        datetime: '2020-03-03T16:22:22.000Z',
        isin: 'US5949181045',
        company: 'Microsoft Corp.',
        shares: 10,
        price: 151.72,
        amount: 1517.2,
        fee: 8.69,
        tax: 0,
      });
    });

    test('Test if buy2 is mapped correctly', () => {
      const activities = ing.parsePages(buySamples[1]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Buy',
        date: '2017-01-10',
        datetime: '2017-01-10T18:54:00.000Z',
        isin: 'US0846707026',
        company: 'Berkshire Hathaway Inc.',
        shares: 5,
        price: 153.48,
        amount: 767.4,
        fee: 9.9,
        tax: 0,
      });
    });

    test('Test if provision-free buy is mapped correctly', () => {
      const activities = ing.parsePages(buySamples[2]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Buy',
        date: '2016-01-22',
        datetime: '2016-01-22T16:47:56.000Z',
        isin: 'US64110L1061',
        company: 'Netflix Inc.',
        shares: 11,
        price: 92.09,
        amount: 1012.99,
        fee: 0,
        tax: 0,
      });
    });

    test('Test if investment plan is mapped correctly', () => {
      const activities = ing.parsePages(buySamples[3]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Buy',
        date: '2019-04-15',
        datetime: '2019-04-15T07:04:16.000Z',
        isin: 'LU0274208692',
        company: 'Xtrackers MSCI World Swap',
        shares: 4.51124,
        price: 54.464,
        amount: 245.7,
        fee: 4.3,
        tax: 0,
      });
    });
  });

  describe('Sell', () => {
    test('Test if sell1 is mapped correctly', () => {
      const activities = ing.parsePages(sellSamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Sell',
        date: '2020-01-14',
        datetime: '2020-01-14T08:03:52.000Z',
        isin: 'FR0010790980',
        company: 'Amundi ETF STOXX Europe 50',
        shares: 8,
        price: 79.71,
        amount: 637.68,
        fee: 6.49,
        tax: 0,
      });
    });

    test('Test if sell2 is mapped correctly', () => {
      const activities = ing.parsePages(sellSamples[1]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Sell',
        date: '2019-03-06',
        datetime: '2019-03-06T16:21:18.000Z',
        isin: 'US0079031078',
        company: 'Advanced Micro Devices Inc.',
        shares: 20,
        price: 20.09,
        amount: 401.8,
        fee: 5.9,
        tax: 0,
      });
    });

    test('Test if sell with taxes is mapped correctly', () => {
      const activities = ing.parsePages(sellSamples[2]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Sell',
        date: '2020-07-21',
        datetime: '2020-07-21T13:59:31.000Z',
        isin: 'US09075V1026',
        company: 'BioNTech SE Nam.-Akt.(sp.ADRs)1/o.N.',
        shares: 100,
        price: 84,
        amount: 8400,
        fee: 2.9,
        tax: 209.47,
      });
    });
  });

  describe('Dividend', () => {
    test('Test if dividend1 is mapped correctly', () => {
      const activities = ing.parsePages(dividendsSamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Dividend',
        date: '2020-03-12',
        datetime: '2020-03-12T' + activities[0].datetime.substring(11),
        isin: 'US5949181045',
        company: 'Microsoft Corp.',
        shares: 32,
        price: 0.45389737647316397,
        amount: 14.524716047141247,
        fee: 0,
        tax: 2.18,
      });
    });

    test('Test if dividend2 is mapped correctly', () => {
      const activities = ing.parsePages(dividendsSamples[1]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Dividend',
        date: '2020-03-18',
        datetime: '2020-03-18T' + activities[0].datetime.substring(11),
        isin: 'NL0000388619',
        company: 'Unilever N.V.',
        shares: 8,
        price: 0.4104,
        amount: 3.28,
        fee: 0,
        tax: 0.49,
      });
    });

    test('Test if dividend3 is mapped correctly', () => {
      const activities = ing.parsePages(dividendsSamples[2]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Dividend',
        date: '2020-05-04',
        datetime: '2020-05-04T' + activities[0].datetime.substring(11),
        isin: 'IE00BZ163G84',
        company: 'Vanguard EUR Corp.Bond U.ETF',
        shares: 29,
        price: 0.020034,
        amount: 0.58,
        fee: 0,
        tax: 0,
      });
    });

    test('Test if dividend4 is mapped correctly', () => {
      const activities = ing.parsePages(dividendsSamples[3]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Dividend',
        date: '2020-04-15',
        datetime: '2020-04-15T' + activities[0].datetime.substring(11),
        isin: 'DE000A0F5UH1',
        company: 'iSh.ST.Gl.Sel.Div.100 U.ETF DE',
        shares: 34,
        price: 0.177136,
        amount: 6.02,
        fee: 0,
        tax: 0,
      });
    });

    test('Test if dividend5 is mapped correctly', () => {
      const activities = ing.parsePages(dividendsSamples[4]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Dividend',
        date: '2020-04-08',
        datetime: '2020-04-08T' + activities[0].datetime.substring(11),
        isin: 'IE00B3RBWM25',
        company: 'Vanguard FTSE All-World U.ETF',
        shares: 270,
        price: 0.37524009432835165,
        amount: 101.31291390424165,
        fee: 0,
        tax: 18.7,
      });
    });

    test('Test if dividend_etf is mapped correctly', () => {
      const activities = ing.parsePages(dividendsSamples[5]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Dividend',
        date: '2018-08-23',
        datetime: '2018-08-23T' + activities[0].datetime.substring(11),
        isin: 'LU0392494562',
        company: 'ComStage-MSCI World TRN U.ETF',
        shares: 12,
        price: 0.9411004908292431,
        amount: 11.28907259106174,
        fee: 0,
        tax: 0,
      });
    });

    test('Test if dividend with taxes from a ETF is mapped correctly', () => {
      const activities = ing.parsePages(dividendsSamples[6]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Dividend',
        date: '2020-09-15',
        datetime: '2020-09-15T' + activities[0].datetime.substring(11),
        isin: 'DE0006289382',
        company: 'iSh.DJ Glob.Titans 50 U.ETF DE',
        shares: 53,
        price: 0.055626,
        amount: 2.95,
        fee: 0,
        tax: 0.54,
      });
    });

    test('Test if dividend with taxes from a stock is mapped correctly', () => {
      const activities = ing.parsePages(dividendsSamples[7]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Dividend',
        date: '2020-09-18',
        datetime: '2020-09-18T' + activities[0].datetime.substring(11),
        isin: 'US94106L1098',
        company: 'Waste Management Inc. (Del.)',
        shares: 6,
        price: 0.4608279344592755,
        amount: 2.764967606755653,
        fee: 0,
        tax: 0.7,
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
