import { findImplementation } from '@/index';
import * as traderepublic from '../../src/brokers/traderepublic';
import {
  allSamples,
  buySamples,
  sellSamples,
  dividendSamples,
  quarterSamples,
} from './__mocks__/traderepublic';

describe('Broker: Trade Republic', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can the document parsed with Trade Republic', () => {
      allSamples.forEach(samples => {
        expect(
          samples.some(item => traderepublic.canParsePage(item, 'pdf'))
        ).toEqual(true);
      });
    });

    test('Can identify a implementation from the document as Trade Republic', () => {
      allSamples.forEach(samples => {
        const implementations = findImplementation(samples, 'pdf');

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
        isin: 'FR0000031122',
        company: 'Air France-KLM S.A.',
        shares: 100,
        price: 5.63,
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
        isin: 'IE00B1YZSC51',
        company: 'iShsII-Core MSCI Europe U.ETF',
        shares: 1.3404,
        price: 26.11,
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
        amount: 160.17499384432017,
        broker: 'traderepublic',
        company: 'Royal Dutch Shell',
        date: '2020-03-23',
        fee: 0,
        isin: 'GB00B03MLX29',
        price: 0.41929992970035224,
        shares: 382,
        tax: 41.96499384432018,
        type: 'Dividend',
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
        fee: 0,
        isin: 'DE0002635299',
        price: 0.27,
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
        fee: 0,
        isin: 'DE0002635281',
        price: 0.234,
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
        amount: 24.33,
        broker: 'traderepublic',
        company: 'iShsII-Dev.Mkts Prop.Yld U.ETF',
        date: '2020-02-26',
        fee: 0,
        isin: 'IE00B1FZS350',
        price: 0.17252514069563613,
        shares: 141,
        tax: 6.81,
        type: 'Dividend',
      });
    });

    test('Should map the pdf data correctly for: Gazprom with third party expenses and withholding tax', () => {
      const activities = traderepublic.parsePages(dividendSamples[4])
        .activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        amount: 15.648939253517566,
        broker: 'traderepublic',
        company: 'Gazprom PJSC',
        date: '2020-08-18',
        fee: 0.7582778667116017,
        isin: 'US3682872078',
        price: 0.3479652877243239,
        shares: 45,
        tax: 2.350661386805965,
        type: 'Dividend',
      });
    });

    test('Should map the pdf data correctly for: Realty Income Corp with other withholding tax format', () => {
      const activities = traderepublic.parsePages(dividendSamples[5])
        .activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        amount: 0.9814259274838059,
        broker: 'traderepublic',
        company: 'Realty Income Corp.',
        date: '2020-09-15',
        fee: 0,
        isin: 'US7561091049',
        price: 0.1968537057289476,
        shares: 5,
        tax: 0.15142592748380584,
        type: 'Dividend',
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
        fee: 0,
        isin: 'US3682872078',
        price: 4.684222222222222,
        shares: 45,
        tax: 0,
        type: 'Buy',
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
