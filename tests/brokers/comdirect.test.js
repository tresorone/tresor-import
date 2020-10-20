import { findImplementation } from '@/index';
import * as comdirect from '../../src/brokers/comdirect';
import { allSamples, buySamples, dividendSamples } from './__mocks__/comdirect';

describe('Broker: comdirect', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can one page parsed with comdirect', () => {
      allSamples.forEach(samples => {
        expect(
          samples.some(item => comdirect.canParsePage(item, 'pdf'))
        ).toEqual(true);
      });
    });

    test('Can identify a broker from one page as comdirect', () => {
      allSamples.forEach(samples => {
        const implementations = findImplementation(samples, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(comdirect);
      });
    });
  });

  describe('Validate buys', () => {
    test('Can the order parsed from saving_plan', () => {
      const result = comdirect.parsePages(buySamples[0]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Buy',
        date: '2020-08-11',
        isin: 'DE0007231334',
        company: 'Sixt SE',
        shares: 0.55,
        price: 44.74545454545454,
        amount: 24.61,
        fee: 0.37,
        tax: 0,
      });
    });

    test('Can the order with purchase reduction be parsed from purchase_reduction', () => {
      const result = comdirect.parsePages(buySamples[1]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Buy',
        date: '2020-04-06',
        isin: 'LU0187079347',
        company: 'Robeco Global Consumer Trends',
        shares: 0.108,
        price: 235.09259259259258,
        amount: 25.39,
        fee: -0.55,
        tax: 0,
      });
    });

    test('Can parse the order with purchase reduction from purchase_reduction_usd_1', () => {
      const result = comdirect.parsePages(buySamples[2]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Buy',
        date: '4152-11-09',
        isin: 'LU0079474960',
        company: 'AB SICAV I-American Growth Ptf',
        shares: 0.644,
        price: 122.57025271966882,
        amount: 78.93524275146672,
        fee: -3.94524275146672,
        tax: 0,
      });
    });
  });

  describe('Validate dividends', () => {
    test('Can the dividend in USD parsed from the document', () => {
      const result = comdirect.parsePages(dividendSamples[0]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Dividend',
        date: '2020-07-27',
        isin: 'US3696041033',
        company: 'General Electric Co.',
        shares: 59.058,
        price: 0.007280978021605879,
        amount: 0.43,
        fee: 0,
        tax: 0,
      });
    });

    test('Can the dividend in EUR parsed from the document', () => {
      const result = comdirect.parsePages(dividendSamples[1]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'comdirect',
        type: 'Dividend',
        date: '2020-05-08',
        isin: 'DE0005790430',
        company: 'FUCHS PETROLUB SE',
        shares: 13.128,
        price: 0.9696831200487508,
        amount: 12.73,
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
