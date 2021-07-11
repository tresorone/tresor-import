import { findImplementation } from '@/index';
import * as interactiveBrokers from '../../src/brokers/interactiveBrokers';
import {
  allSamples
} from './__mocks__/interactiveBrokers';

describe('Broker: interactive Brokers', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can one page parsed with interactive Brokers', () => {
      allSamples.forEach(pages => {
        expect(interactiveBrokers.canParseDocument(pages[0], 'csv')).toEqual(true);
      });
    });

    test('Can identify a broker from one page as interactive Brokers', () => {
      allSamples.forEach(pages => {
        const implementations = findImplementation(pages, 'csv');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(interactiveBrokers);
      });
    });
  });

  describe('Validate activity', () => {
    test('Can the first order parsed from activity', () => {
      const activities = interactiveBrokers.parsePages(allSamples[0]).activities;

      expect(activities.length).toEqual(3);
      expect(activities[0]).toEqual({
        broker: 'interactiveBroker',
        type: 'Buy',
        date: '2021-06-18',
        datetime: '2021-06-18T15:00:00.000Z',
        symbol: 'EOANd',
        shares: 100,
        price: 10.2,
        amount: 1020,
        currency: 'EUR',
        fee: 0,
        tax: 0,
        company: 'EOANd',
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

