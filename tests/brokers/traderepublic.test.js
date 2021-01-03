import { findImplementation } from '@/index';
import * as traderepublic from '../../src/brokers/traderepublic';
import {
  allSamples,
  buySamples,
  sellSamples,
  dividendSamples,
  quarterSamples,
  ignoredSamples,
} from './__mocks__/traderepublic';

describe('Broker: Trade Republic', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can the document parsed with Trade Republic', () => {
      allSamples.forEach(pages => {
        expect(traderepublic.canParseDocument(pages, 'pdf')).toEqual(true);
      });
    });

    test('Can identify a implementation from the document as Trade Republic', () => {
      allSamples.forEach(pages => {
        const implementations = findImplementation(pages, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(traderepublic);
      });
    });
  });

  describe('Validate buys', () => {
    test('Map a limit order correctly', () => {
      const activities = traderepublic.parsePages(buySamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Buy',
        date: '2020-02-24',
        datetime: '2020-02-24T10:28:00.000Z',
        isin: 'US88160R1014',
        company: 'Tesla Inc.',
        shares: 3,
        price: 768.1,
        amount: 2304.3,
        fee: 1,
        tax: 0,
      });
    });

    test('Map a market order correctly', () => {
      const activities = traderepublic.parsePages(buySamples[1]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Buy',
        date: '2019-11-29',
        datetime: '2019-11-29T11:08:00.000Z',
        isin: 'GB00B03MLX29',
        company: 'Royal Dutch Shell',
        shares: 382,
        price: 26.14,
        amount: 9985.48,
        fee: 1,
        tax: 0,
      });
    });

    test('Map a limit order with financial transaction tax correctly', () => {
      const activities = traderepublic.parsePages(buySamples[2]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Buy',
        date: '2020-06-09',
        datetime: '2020-06-09T11:36:00.000Z',
        isin: 'FR0000031122',
        company: 'Air France-KLM S.A.',
        shares: 100,
        price: 5.632,
        amount: 563.2,
        fee: 1,
        tax: 1.69,
      });
    });

    test('Map a market order without explicit ISIN correctly', () => {
      const activities = traderepublic.parsePages(buySamples[3]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Buy',
        date: '2019-07-19',
        datetime: '2019-07-19T12:32:00.000Z',
        isin: 'DE000SHL1006',
        company: 'Siemens Healthineers AG',
        shares: 14,
        price: 35.7,
        amount: 499.8,
        fee: 1,
        tax: 0,
      });
    });

    test('Map a saving plan order correctly', () => {
      const activities = traderepublic.parsePages(buySamples[4]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Buy',
        date: '2020-01-16',
        datetime: '2020-01-16T' + activities[0].datetime.substring(11),
        isin: 'IE00B1YZSC51',
        company: 'iShsII-Core MSCI Europe U.ETF',
        shares: 1.3404,
        price: 26.111608475082065,
        amount: 35.0,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Validate sells', () => {
    test('Map a limit sell order correctly: Tesla', () => {
      const activities = traderepublic.parsePages(sellSamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        amount: 2550,
        broker: 'traderepublic',
        company: 'Tesla Inc.',
        date: '2020-02-04',
        datetime: '2020-02-04T14:52:00.000Z',
        fee: 1,
        isin: 'US88160R1014',
        price: 850.0,
        shares: 3,
        tax: 36.47,
        type: 'Sell',
      });
    });

    test('Map a limit sell order correctly: Stryker', () => {
      const activities = traderepublic.parsePages(sellSamples[1]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        amount: 16723.08,
        broker: 'traderepublic',
        company: 'Stryker Corp.',
        date: '2020-07-21',
        datetime: '2020-07-21T08:24:00.000Z',
        fee: 1,
        isin: 'US8636671013',
        price: 168.92,
        shares: 99,
        tax: 52.97,
        type: 'Sell',
      });
    });

    test('Map a limit sell order with tax returns correctly: Workgroup', () => {
      const activities = traderepublic.parsePages(sellSamples[2]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        amount: 1005.0,
        broker: 'traderepublic',
        company: 'Workhorse Group Inc.',
        date: '2020-10-02',
        datetime: '2020-10-02T07:04:00.000Z',
        fee: 1,
        isin: 'US98138J2069',
        price: 20.1,
        shares: 50,
        tax: -6.93,
        type: 'Sell',
      });
    });
  });

  describe('Validate dividends', () => {
    test('Should map the pdf data correctly for: Royal Dutch Shell', () => {
      const activities = traderepublic.parsePages(dividendSamples[0])
        .activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Dividend',
        isin: 'GB00B03MLX29',
        company: 'Royal Dutch Shell',
        date: '2020-03-23',
        datetime: '2020-03-23T' + activities[0].datetime.substring(11),
        shares: 382,
        amount: 160.17257314553456,
        price: 0.41929992970035224,
        fee: 0,
        tax: 41.96499384432018,
        fxRate: 1.120916,
        foreignCurrency: 'USD',
      });
    });

    test('Should map the pdf data correctly for: iSh.ST.Eur.Sel.Div.30 U.ETF DE', () => {
      const activities = traderepublic.parsePages(dividendSamples[1])
        .activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        amount: 11.87,
        broker: 'traderepublic',
        company: 'iSh.ST.Eur.Sel.Div.30 U.ETF DE',
        date: '2020-07-15',
        datetime: '2020-07-15T' + activities[0].datetime.substring(11),
        fee: 0,
        isin: 'DE0002635299',
        price: 0.2699973159491759,
        shares: 43.9634,
        tax: 2.2,
        type: 'Dividend',
      });
    });

    test('Should map the pdf data correctly for: iSh.EO ST.Sel.Div.30 U.ETF DE', () => {
      const activities = traderepublic.parsePages(dividendSamples[2])
        .activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        amount: 10.23,
        broker: 'traderepublic',
        company: 'iSh.EO ST.Sel.Div.30 U.ETF DE',
        date: '2020-07-15',
        datetime: '2020-07-15T' + activities[0].datetime.substring(11),
        fee: 0,
        isin: 'DE0002635281',
        price: 0.23434708108454821,
        shares: 43.6532,
        tax: 1.89,
        type: 'Dividend',
      });
    });

    test('Should map the pdf data correctly for: iShsII-Dev.Mkts Prop.Yld U.ETF', () => {
      const activities = traderepublic.parsePages(dividendSamples[3])
        .activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Dividend',
        isin: 'IE00B1FZS350',
        company: 'iShsII-Dev.Mkts Prop.Yld U.ETF',
        date: '2020-02-26',
        datetime: '2020-02-26T' + activities[0].datetime.substring(11),
        shares: 141,
        amount: 24.328812621090506,
        price: 0.172544770362344,
        fee: 0,
        tax: 6.81,
        fxRate: 1.0839,
        foreignCurrency: 'USD',
      });
    });

    test('Should map the pdf data correctly for: Gazprom with third party expenses and withholding tax', () => {
      const activities = traderepublic.parsePages(dividendSamples[4])
        .activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Dividend',
        isin: 'US3682872078',
        company: 'Gazprom PJSC',
        date: '2020-08-18',
        datetime: '2020-08-18T' + activities[0].datetime.substring(11),
        shares: 45,
        amount: 15.65422529277951,
        price: 0.347871673172878,
        tax: 2.350661386805965,
        fee: 0.7582778667116017,
        fxRate: 1.1869,
        foreignCurrency: 'USD',
      });
    });

    test('Should map the pdf data correctly for: Realty Income Corp with other withholding tax format', () => {
      const activities = traderepublic.parsePages(dividendSamples[5])
        .activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Dividend',
        isin: 'US7561091049',
        company: 'Realty Income Corp.',
        date: '2020-09-15',
        datetime: '2020-09-15T' + activities[0].datetime.substring(11),
        amount: 0.9842685286447379,
        shares: 5,
        price: 0.1968537057289476,
        tax: 0.15142592748380584,
        fee: 0,
        fxRate: 1.1887,
        foreignCurrency: 'USD',
      });
    });

    test('Should map the pdf data correctly for: Unilever with other withholding tax format', () => {
      const activities = traderepublic.parsePages(dividendSamples[6])
        .activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        amount: 2.05,
        broker: 'traderepublic',
        company: 'Unilever N.V.',
        date: '2020-09-09',
        datetime: '2020-09-09T' + activities[0].datetime.substring(11),
        fee: 0,
        isin: 'NL0000388619',
        price: 0.41,
        shares: 5,
        tax: 0.31,
        type: 'Dividend',
      });
    });

    test('New Dividend Date Format starting in 2020: 2020_walgreens_boots_alliance', () => {
      const activities = traderepublic.parsePages(dividendSamples[7])
        .activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Dividend',
        isin: 'US9314271084',
        company: 'Walgreens Boots Alliance Inc.',
        date: '2020-12-11',
        datetime: '2020-12-11T' + activities[0].datetime.substring(11),
        shares: 1,
        amount: 0.3867357854027812,
        price: 0.3867357854027812,
        tax: 0.05759894676211635,
        fee: 0,
        fxRate: 1.2153,
        foreignCurrency: 'USD',
      });
    });

    test('New Dividend Date Format starting in 2020: 2020_exxon_mobile_corp', () => {
      const activities = traderepublic.parsePages(dividendSamples[8])
        .activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'traderepublic',
        type: 'Dividend',
        isin: 'US30231G1022',
        company: 'Exxon Mobil Corp.',
        date: '2020-12-10',
        datetime: '2020-12-10T' + activities[0].datetime.substring(11),
        amount: 3.5870371897418982,
        price: 0.7174074379483797,
        shares: 5,
        tax: 0.5359940628349963,
        fee: 0,
        foreignCurrency: 'USD',
        fxRate: 1.2127,
      });
    });
  });

  describe('Validate quarter statement', () => {
    test('Map a empty quarter statement correctly', () => {
      const activities = traderepublic.parsePages(quarterSamples[0]).activities;

      expect(activities.length).toEqual(0);
    });

    test('Map a quarter statement with two positions correctly', () => {
      const activities = traderepublic.parsePages(quarterSamples[1]).activities;

      expect(activities.length).toEqual(2);
      expect(activities[0]).toEqual({
        amount: 132.96,
        broker: 'traderepublic',
        company: 'Royal Dutch Shell',
        date: '2020-06-30',
        datetime: '2020-06-30T' + activities[0].datetime.substring(11),
        fee: 0,
        isin: 'GB00B03MLX29',
        price: 13.296,
        shares: 10,
        tax: 0,
        type: 'Buy',
      });
      expect(activities[1]).toEqual({
        amount: 210.79,
        broker: 'traderepublic',
        company: 'Gazprom PJSC',
        date: '2020-06-30',
        datetime: '2020-06-30T' + activities[1].datetime.substring(11),
        fee: 0,
        isin: 'US3682872078',
        price: 4.684222222222222,
        shares: 45,
        tax: 0,
        type: 'Buy',
      });
    });

    test('Map a quarter statement with two pages correctly', () => {
      const activities = traderepublic.parsePages(quarterSamples[2]).activities;

      expect(activities[10]).toEqual({
        amount: 366.12,
        broker: 'traderepublic',
        company: 'VISA Inc.',
        date: '2020-03-31',
        datetime: '2020-03-31T' + activities[1].datetime.substring(11),
        fee: 0,
        isin: 'US92826C8394',
        price: 183.06,
        shares: 2,
        tax: 0,
        type: 'Buy',
      });
      expect(activities[11]).toEqual({
        amount: 391,
        broker: 'traderepublic',
        company: 'Zoom Video',
        date: '2020-03-31',
        datetime: '2020-03-31T' + activities[1].datetime.substring(11),
        fee: 0,
        isin: 'US98980L1017',
        price: 130.33333333333334,
        shares: 3,
        tax: 0,
        type: 'Buy',
      });

      expect(activities.length).toEqual(15);
    });
  });

  describe('Validate all ignored statements', () => {
    test('The statement should be ignored: cost_information.json', () => {
      const result = traderepublic.parsePages(ignoredSamples[0]);

      expect(result.status).toEqual(7);
      expect(result.activities.length).toEqual(0);
    });

    test('The statement should be ignored: reverse_split.json', () => {
      const result = traderepublic.parsePages(ignoredSamples[1]);

      expect(result.status).toEqual(7);
      expect(result.activities.length).toEqual(0);
    });

    test('The statement should be ignored: saving_plan_failed.json', () => {
      const result = traderepublic.parsePages(ignoredSamples[2]);

      expect(result.status).toEqual(7);
      expect(result.activities.length).toEqual(0);
    });

    test('The statement should be ignored: split.json', () => {
      const result = traderepublic.parsePages(ignoredSamples[3]);

      expect(result.status).toEqual(7);
      expect(result.activities.length).toEqual(0);
    });

    test('The statement should be ignored: saving_plan_confirmation.json', () => {
      const result = traderepublic.parsePages(ignoredSamples[4]);

      expect(result.status).toEqual(7);
      expect(result.activities.length).toEqual(0);
    });

    test('The statement should be ignored: saving_plan_change_confirmation.json', () => {
      const result = traderepublic.parsePages(ignoredSamples[5]);

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
