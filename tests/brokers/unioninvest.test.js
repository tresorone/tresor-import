import { findImplementation } from '@/index';
import * as unioninvest from '../../src/brokers/unioninvest';
import {
  allSamples,
  buySamples,
  dividendSamples,
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
  });

  describe('Validate Dividends', () => {
    test('Can parse a union invest dividend+reinvest from 2019 (1) ', () => {
      const activities = unioninvest.parsePages(dividendSamples[0]).activities;

      expect(activities.length).toEqual(2);
      expect(activities[0]).toEqual({
        broker: 'unioninvest',
        type: 'Dividend',
        date: '2019-11-14',
        datetime: '2019-11-14T' + activities[0].datetime.substring(11),
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
        date: '2019-11-14',
        datetime: '2019-11-14T' + activities[1].datetime.substring(11),
        isin: 'DE0008007519',
        company: 'UniFavorit: Aktien -net-',
        shares: 0.014,
        price: 98.57,
        amount: 1.34,
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
