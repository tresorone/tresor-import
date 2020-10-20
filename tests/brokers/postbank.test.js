import { findImplementation } from '@/index';
import * as postbank from '../../src/brokers/postbank';
import {
  dividendSamples,
  buySamples
} from './__mocks__/postbank';

console.error = jest.fn();

describe('Broker: Postbank', () => {
  // Currently there are no more samples than dividends
  const allSamples = dividendSamples

  describe('Check all documents', () => {
    test('Can the document be parsed with postbank', () => {
      allSamples.forEach(samples => {
        expect(
          samples.some(item => postbank.canParsePage(item, 'pdf'))
        ).toEqual(true);
      });
    });

    test('Can identify a implementation from the document as postbank', () => {
      allSamples.forEach(samples => {
        const implementations = findImplementation(samples, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(postbank);
      });
    });
  });

  describe('Buy', () => {
    test('should map pdf data of buy_savings_plan_vanguard_ftse_all_world_1.json correctly', () => {
      const activity = postbank.parsePages(buySamples[0]).activities;

      expect(activity).toEqual([
        {
          type: 'Buy',
          amount: 800,
          broker: 'postbank',
          company: 'VANGUARD FTSE ALL-WORLD U.ETF',
          date: '2020-10-05',
          isin: 'IE00B3RBWM25',
          price: 79.68,
          shares: 10.0402,
          tax: 0,
          fee: 0.90,
        },
      ]);
    });
  });

  describe('Dividend', () => {
    test('should map pdf data of dividend_vanguard_ftse_all_world_1.json correctly', () => {
      const activity = postbank.parsePages(dividendSamples[0]).activities;

      expect(activity).toEqual([
        {
          type: 'Dividend',
          amount: 50.80,
          broker: 'postbank',
          company: 'VANGUARD FTSE ALL-WORLD U.ETF',
          date: '2020-10-07',
          isin: 'IE00B3RBWM25',
          price: 0.38539358319683975,
          shares: 131.8133,
          tax: 0,
          fee: 0,
        },
      ]);
    });
  });
});
