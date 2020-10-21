import { findImplementation } from '@/index';
import * as ebase from '../../src/brokers/ebase';
import {
  buySamples,
  invalidSamples,
  mixedSamples,
  sellSamples,
} from './__mocks__/ebase';
import { canParsePage, parseData } from '@/brokers/ebase';
import { allValidSamples } from './__mocks__/ebase';

// David Holin: No dividend samples test yet, as no example document is available
describe('Broker: ebase', () => {
  let consoleErrorSpy;

  test('should only accept revenue-summary reports', () => {
    expect(
      canParsePage(
        ['Fondsertrag / Vorabpauschale', 'ebase Depot flex standard'],
        'pdf'
      )
    ).toEqual(true);
  });

  test('should reject unknown PDF files', () => {
    expect(
      canParsePage(['This String should never occur in a legitimate document'])
    ).toEqual(false);
  });

  test('should validate the result', () => {
    const activity = parseData(invalidSamples[0]);

    expect(activity).toEqual(undefined);
    expect(console.error).toHaveBeenLastCalledWith(
      'The activity for ebase has empty fields.',
      {
        type: 'Sell',
        amount: 45,
        broker: 'ebase',
        company: 'DWS Top Dividende LD',
        date: '2019-12-19',
        isin: 'DE0009848119',
        price: 130.93,
        shares: undefined,
        tax: 0.0,
        fee: 0,
      }
    );
  });

  describe('Check all documents', () => {
    test('Can parse one page containing sell orders with ebase', () => {
      sellSamples.forEach(samples => {
        expect(samples.some(item => ebase.canParsePage(item, 'pdf'))).toEqual(
          true
        );
      });
    });

    test('Can identify a broker from one page as ebase', () => {
      allValidSamples.forEach(samples => {
        const implementations = findImplementation(samples, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(ebase);
      });
    });
  });

  describe('Validate buys', () => {
    test('Can parse multiple buy orders from a document', () => {
      const activities = ebase.parsePages(buySamples[0]);
      expect(activities.activities.length).toEqual(11);
      expect(activities.activities[0]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-07-01',
        isin: 'DE000A0X7541',
        company: 'ACATIS GANÉ VALUE EVENT FONDS A',
        shares: 0.054571,
        price: 311.52,
        amount: 17.0,
        tax: 0.0,
        fee: 0.0,
      });
      expect(activities.activities[10]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-07-01',
        isin: 'DE0009848119',
        company: 'DWS Top Dividende LD',
        shares: 0.126761,
        price: 120.7,
        amount: 15.3,
        tax: 0.0,
        fee: 0.0,
      });
    });
  });

  describe('Validate sells', () => {
    test('Can parse multiple eremuneration sell orders from a document', () => {
      const activities = ebase.parsePages(sellSamples[0]);
      expect(activities.activities.length).toEqual(2);
      expect(activities.activities[0]).toEqual({
        broker: 'ebase',
        type: 'Sell',
        date: '2019-12-19',
        isin: 'DE0009848119',
        company: 'DWS Top Dividende LD',
        shares: 0.343695,
        price: 130.93,
        amount: 45.0,
        tax: 0.0,
        fee: 0.0,
      });
      expect(activities.activities[1]).toEqual({
        broker: 'ebase',
        type: 'Sell',
        date: '2018-12-19',
        isin: 'DE0009848119',
        company: 'DWS Top Dividende LD',
        shares: 0.394046,
        price: 114.2,
        amount: 45.0,
        tax: 0.0,
        fee: 0.0,
      });
    });

    test('Can parse multiple ordinary sell orders from a document', () => {
      const activities = ebase.parsePages(sellSamples[1]);
      expect(activities.activities.length).toEqual(11);
      expect(activities.activities[0]).toEqual({
        broker: 'ebase',
        type: 'Sell',
        date: '2020-09-23',
        isin: 'FR0000292278',
        company: 'Magellan C',
        shares: 18.014988,
        price: 23.17,
        amount: 373.54,
        tax: 0.0,
        fee: 0.0,
      });
      expect(activities.activities[10]).toEqual({
        broker: 'ebase',
        type: 'Sell',
        date: '2020-09-22',
        isin: 'DE0009848119',
        company: 'DWS Top Dividende LD',
        shares: 2.752834,
        price: 114.58,
        amount: 315.42,
        tax: 0.0,
        fee: 0.0,
      });
    });
  });

  describe('Mixed Sells, buys and everything in between', () => {
    test('Can parse multiple sell orders from a document', () => {
      const activities = ebase.parsePages(mixedSamples[0]);
      expect(activities.activities.length).toEqual(327);
      expect(activities.activities[11]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-07-01',
        isin: 'DE000A0X7541',
        company: 'ACATIS GANÉ VALUE EVENT FONDS A',
        shares: 0.054571,
        price: 311.52,
        amount: 17.0,
        tax: 0.0,
        fee: 0.0,
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
