import { getBroker } from '@/index';
import * as ebase from '../../src/brokers/ebase';
import { buySamples, sellSamples } from './__mocks__/ebase';

// David Holin: No dividend samples test yet, as no example document is available
describe('Broker: ebase', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can parse one page containing sell orders with ebase', () => {
      sellSamples.forEach(samples => {
        expect(samples.some(item => ebase.canParseData(item))).toEqual(true);
      });
    });

    test('Can identify a broker from one page as ebase', () => {
      sellSamples.forEach(samples => {
        expect(samples.some(item => getBroker(item) === ebase)).toEqual(true);
      });
    });
  });

  describe('Validate buys', () => {
    test('Can parse multiple buy orders from a document', () => {
      const activities = ebase.parsePages(buySamples[0]);
      expect(activities.length).toEqual(11);
      expect(activities[0]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-07-01',
        isin: 'DE000A0X7541',
        company: 'ACATIS GANÉ VALUE EVENT FONDS A',
        shares: 0.054571,
        price: 311.52,
        amount: 17.0,
        fee: 0.0,
      });
      expect(activities[10]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-07-01',
        isin: 'DE0009848119',
        company: 'DWS Top Dividende LD',
        shares: 0.126761,
        price: 120.7,
        amount: 15.3,
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
