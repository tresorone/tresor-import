import { findImplementation } from '@/index';
import * as unioninvest from '../../src/brokers/unioninvest';
import {
  allSamples,
  buySamples,
  sellSamples,
  dividendSamples,
  redistribution,
} from './__mocks__/unioninvest';

describe('Broker: Union Invest', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can the document parsed with the Union Invest parser', () => {
      allSamples.forEach(samples => {
        expect(
          samples.some(item => unioninvest.canParsePage(item, 'pdf'))
        ).toEqual(true);
      });
    });

    test('Can identify a implementation from the document as Union Invest file', () => {
      allSamples.forEach(samples => {
        const implementations = findImplementation(samples, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(unioninvest);
      });
    });
  });

  describe('Validate buys', () => {
    test('Can parse a union invest buy from 2019 (1) ', () => {
      const activities = unioninvest.parsePages(buySamples[0]).activities;
      expect(activities.length).toEqual(2);
      expect(activities[0]).toEqual({
        broker: 'unioninvest',
        type: 'Buy',
        date: '2019-06-12',
        datetime: '2019-06-12T' + activities[0].datetime.substring(11),
        isin: 'LU1900195949',
        company: 'PrivatFonds: Nachhaltig',
        shares: 0.482,
        price: 51.88,
        amount: 25,
        fee: 0,
        tax: 0,
      });
      expect(activities[1]).toEqual({
        broker: 'unioninvest',
        type: 'Buy',
        date: '2019-06-12',
        datetime: '2019-06-12T' + activities[1].datetime.substring(11),
        isin: 'DE0008007519',
        company: 'UniFavorit: Aktien -net-',
        shares: 0.268,
        price: 93.28,
        amount: 25,
        fee: 0,
        tax: 0,
      });
    });

    test('Can parse a union invest buy from 2019 (2) ', () => {
      const activities = unioninvest.parsePages(buySamples[1]).activities;
      expect(activities.length).toEqual(2);
      expect(activities[0]).toEqual({
        broker: 'unioninvest',
        type: 'Buy',
        date: '2019-07-11',
        datetime: '2019-07-11T' + activities[0].datetime.substring(11),
        isin: 'LU1900195949',
        company: 'PrivatFonds: Nachhaltig',
        shares: 0.473,
        price: 52.81,
        amount: 25,
        fee: 0,
        tax: 0,
      });
      expect(activities[1]).toEqual({
        broker: 'unioninvest',
        type: 'Buy',
        date: '2019-07-11',
        datetime: '2019-07-11T' + activities[1].datetime.substring(11),
        isin: 'DE0008007519',
        company: 'UniFavorit: Aktien -net-',
        shares: 0.258,
        price: 96.89,
        amount: 25,
        fee: 0,
        tax: 0,
      });
    });

    test('Can parse a union invest buy from 2019 (3) ', () => {
      const activities = unioninvest.parsePages(buySamples[2]).activities;
      expect(activities.length).toEqual(2);
      expect(activities[0]).toEqual({
        broker: 'unioninvest',
        type: 'Buy',
        date: '2019-08-13',
        datetime: '2019-08-13T' + activities[0].datetime.substring(11),
        isin: 'LU1900195949',
        company: 'PrivatFonds: Nachhaltig',
        shares: 0.476,
        price: 52.52,
        amount: 25,
        fee: 0,
        tax: 0,
      });
      expect(activities[1]).toEqual({
        broker: 'unioninvest',
        type: 'Buy',
        date: '2019-08-13',
        datetime: '2019-08-13T' + activities[1].datetime.substring(11),
        isin: 'DE0008007519',
        company: 'UniFavorit: Aktien -net-',
        shares: 0.266,
        price: 93.95,
        amount: 25,
        fee: 0,
        tax: 0,
      });
    });

    test('Can parse a union invest buy from 2019 (4) ', () => {
      const activities = unioninvest.parsePages(buySamples[3]).activities;

      expect(activities.length).toEqual(2);
      expect(activities[0]).toEqual({
        broker: 'unioninvest',
        type: 'Buy',
        date: '2019-12-11',
        datetime: '2019-12-11T' + activities[0].datetime.substring(11),
        isin: 'LU1900195949',
        company: 'PrivatFonds: Nachhaltig',
        shares: 0.469,
        price: 53.25,
        amount: 25,
        fee: 0,
        tax: 0,
      });
      expect(activities[1]).toEqual({
        broker: 'unioninvest',
        type: 'Buy',
        date: '2019-12-11',
        datetime: '2019-12-11T' + activities[1].datetime.substring(11),
        isin: 'DE0008007519',
        company: 'UniFavorit: Aktien -net-',
        shares: 0.252,
        price: 99.15,
        amount: 25,
        fee: 0,
        tax: 0,
      });
    });

    test('Can parse a union invest buy from 2020 (1) ', () => {
      const activities = unioninvest.parsePages(buySamples[4]).activities;

      expect(activities.length).toEqual(2);
      expect(activities[0]).toEqual({
        broker: 'unioninvest',
        type: 'Buy',
        date: '2020-10-06',
        datetime: '2020-10-06T' + activities[0].datetime.substring(11),
        isin: 'DE000A1C81G1',
        company: 'UniGlobal Vorsorge',
        shares: 0.07,
        price: 233.87,
        amount: 16.3,
        fee: 0,
        tax: 0,
      });
      expect(activities[1]).toEqual({
        broker: 'unioninvest',
        type: 'Buy',
        date: '2020-10-06',
        datetime: '2020-10-06T' + activities[0].datetime.substring(11),
        isin: 'DE0008491069',
        company: 'UniEuroRenta',
        shares: 2.136,
        price: 68.67,
        amount: 146.7,
        fee: 0,
        tax: 0,
      });
    });

    test('Can parse a union invest buy from 2016 (1) ', () => {
      const activities = unioninvest.parsePages(buySamples[5]).activities;
      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'unioninvest',
        type: 'Buy',
        date: '2016-06-21',
        datetime: '2016-06-21T' + activities[0].datetime.substring(11),
        isin: 'DE000A1C81G1',
        company: 'UniGlobal Vorsorge',
        shares: 0.366,
        price: 180.41,
        amount: 66,
        fee: 0,
        tax: 0,
      });
    });

    test('Can parse a single union invest buy from 2020 (1) ', () => {
      const activities = unioninvest.parsePages(buySamples[6]).activities;
      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'unioninvest',
        type: 'Buy',
        date: '2020-01-21',
        datetime: '2020-01-21T' + activities[0].datetime.substring(11),
        isin: 'DE000A1C81G1',
        company: 'UniGlobal Vorsorge',
        shares: 0.315,
        price: 254.19,
        amount: 80,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Validate Sells', () => {
    test('Can parse two sells from 2016', () => {
      const activities = unioninvest.parsePages(sellSamples[0]).activities;
      expect(activities.length).toEqual(2);
      expect(activities[0]).toEqual({
        broker: 'unioninvest',
        type: 'Sell',
        date: '2016-12-24',
        datetime: '2016-12-24T' + activities[0].datetime.substring(11),
        isin: 'DE000A1C81G1',
        company: 'UniGlobal Vorsorge',
        shares: 0.041,
        amount: 7.78,
        price: 191.02,
        fee: 0,
        tax: 0,
      });
      expect(activities[1]).toEqual({
        broker: 'unioninvest',
        type: 'Sell',
        date: '2016-12-24',
        datetime: '2016-12-24T' + activities[1].datetime.substring(11),
        isin: 'DE0008491069',
        company: 'UniEuroRenta',
        shares: 0.018,
        amount: 1.22,
        price: 66.92,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Validate Dividends', () => {
    test('Can parse a union invest dividend+reinvest from 2019 (1) ', () => {
      const activities = unioninvest.parsePages(dividendSamples[0]).activities;

      expect(activities.length).toEqual(2);
      expect(activities[0]).toEqual({
        broker: 'unioninvest',
        type: 'Dividend',
        date: '2019-11-15',
        datetime: '2019-11-15T' + activities[0].datetime.substring(11),
        isin: 'DE0008007519',
        company: 'UniFavorit: Aktien -net-',
        shares: 1.831,
        price: 0.9011469142545058,
        amount: 1.65,
        fee: 0,
        tax: 0.31,
      });
      expect(activities[1]).toEqual({
        broker: 'unioninvest',
        type: 'Buy',
        date: '2019-11-15',
        datetime: '2019-11-15T' + activities[1].datetime.substring(11),
        isin: 'DE0008007519',
        company: 'UniFavorit: Aktien -net-',
        shares: 0.014,
        price: 98.57,
        amount: 1.34,
        fee: 0,
        tax: 0,
      });
    });

    test('Can parse a union invest reinvest from 2020 (1) ', () => {
      const activities = unioninvest.parsePages(dividendSamples[1]).activities;

      expect(activities.length).toEqual(2);
      expect(activities[0]).toEqual({
        broker: 'unioninvest',
        type: 'Dividend',
        date: '2020-11-13',
        datetime: '2020-11-13T' + activities[0].datetime.substring(11),
        isin: 'DE0008491069',
        company: 'UniEuroRenta',
        shares: 66.255,
        price: 0.14006490076220662,
        amount: 9.28,
        fee: 0,
        tax: 0,
      });
      expect(activities[1]).toEqual({
        broker: 'unioninvest',
        type: 'Buy',
        date: '2020-11-13',
        datetime: '2020-11-13T' + activities[0].datetime.substring(11),
        isin: 'DE0008491069',
        company: 'UniEuroRenta',
        shares: 0.139,
        price: 66.71,
        amount: 9.28,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Validate Redistributions', () => {
    test('Can parse a redistribution from 2016', () => {
      const activities = unioninvest.parsePages(redistribution[0]).activities;
      expect(activities.length).toEqual(2);
      expect(activities[0]).toEqual({
        broker: 'unioninvest',
        type: 'Buy',
        date: '2020-02-03',
        datetime: '2020-02-03T' + activities[0].datetime.substring(11),
        isin: 'DE0008491069',
        company: 'UniEuroRenta',
        shares: 10.267,
        amount: 687.99,
        price: 67.01,
        fee: 0,
        tax: 0,
      });
      expect(activities[1]).toEqual({
        broker: 'unioninvest',
        type: 'Sell',
        date: '2020-02-03',
        datetime: '2020-02-03T' + activities[1].datetime.substring(11),
        isin: 'DE000A1C81G1',
        company: 'UniGlobal Vorsorge',
        shares: 2.964,
        amount: 687.99,
        price: 232.15,
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
