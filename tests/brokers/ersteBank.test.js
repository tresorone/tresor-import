import { findImplementation } from '@/index';
import * as ersteBank from '../../src/brokers/ersteBank';
import { buySamples } from './__mocks__/ersteBank';

const allSamples = buySamples; //.concat(sellSamples).concat(dividendSamples);
describe('Broker: Erste Bank', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can the document parsed with Erste Bank', () => {
      allSamples.forEach(samples => {
        expect(
          samples.some(item => ersteBank.canParsePage(item, 'pdf'))
        ).toEqual(true);
      });
    });

    test('Can identify a implementation from the document as Erste Bank', () => {
      allSamples.forEach(samples => {
        const implementations = findImplementation(samples, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(ersteBank);
      });
    });
  });

  describe('Validate buys', () => {
    test('Map the buy order for AT0000APOST4 correctly', () => {
      const activities = ersteBank.parsePages(buySamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ersteBank',
        type: 'Buy',
        date: '2020-06-09',
        isin: 'AT0000APOST4',
        company: 'OESTERREICHISCHE POST AG',
        shares: 33,
        price: 30.9,
        amount: 1019.7,
        fee: 22.35,
        tax: 0,
      });
    });

    test('Map the buy order for AT00000VIE62 correctly', () => {
      const activities = ersteBank.parsePages(buySamples[1]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ersteBank',
        type: 'Buy',
        date: '2020-06-05',
        isin: 'AT00000VIE62',
        company: 'FLUGHAFEN WIEN AG',
        shares: 36,
        price: 28.1,
        amount: 1011.6,
        fee: 22.35,
        tax: 0,
      });
    });

    test('Map the buy order for DE0005773303 correctly', () => {
      const activities = ersteBank.parsePages(buySamples[2]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ersteBank',
        type: 'Buy',
        date: '2020-06-05',
        isin: 'DE0005773303',
        company: 'FRAPORT AG FFM.AIRPORT.SERVICE AG',
        shares: 22,
        price: 45.76,
        amount: 1006.72,
        fee: 22.88,
        tax: 0,
      });
    });

    test('Map the buy order for GB00B03MLX29 correctly', () => {
      const activities = ersteBank.parsePages(buySamples[3]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ersteBank',
        type: 'Buy',
        date: '2020-02-07',
        isin: 'GB00B03MLX29',
        company: 'ROYAL DUTCH SHELL',
        shares: 72,
        price: 23.55,
        amount: 1695.6,
        fee: 28.5,
        tax: 0,
      });
    });

    test('Map the buy order for GB00B03MLX29 correctly', () => {
      const activities = ersteBank.parsePages(buySamples[4]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ersteBank',
        type: 'Buy',
        date: '2020-03-06',
        isin: 'GB0004544929',
        company: 'IMPERIAL BRANDS PLC',
        shares: 17,
        price: 18.69,
        amount: 317.73,
        fee: 1.25,
        tax: 0,
      });
    });

    test('Map the buy order for US02209S1033 correctly', () => {
      const activities = ersteBank.parsePages(buySamples[5]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ersteBank',
        type: 'Buy',
        date: '2019-11-14',
        isin: 'US02209S1033',
        company: 'ALTRIA GROUP INC.',
        shares: 40,
        price: 42.29,
        amount: 1691.6,
        fee: 23.6,
        tax: 0,
      });
    });

    test('Map the buy order for US88579Y1010 correctly', () => {
      const activities = ersteBank.parsePages(buySamples[6]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ersteBank',
        type: 'Buy',
        date: '2019-12-20',
        isin: 'US88579Y1010',
        company: '3M CO.',
        shares: 11,
        price: 153.26,
        amount: 1685.86,
        fee: 22.9,
        tax: 0,
      });
    });

    test('Map the USD buy order for US00206R1023_1 correctly', () => {
      const activities = ersteBank.parsePages(buySamples[7]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ersteBank',
        type: 'Buy',
        date: '2019-09-17',
        isin: 'US00206R1023',
        company: 'AT & T INC.',
        shares: 20,
        price: 34.3705,
        fxRate: 1.1056,
        foreignCurrency: 'USD',
        amount: 687.41,
        fee: 24.63,
        tax: 0,
      });
    });

    test('Map the USD buy order for US00206R1023_2 correctly', () => {
      const activities = ersteBank.parsePages(buySamples[8]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ersteBank',
        type: 'Buy',
        date: '2019-09-20',
        isin: 'US00206R1023',
        company: 'AT & T INC.',
        shares: 30,
        price: 33.16733333333333,
        fxRate: 1.105,
        foreignCurrency: 'USD',
        amount: 995.02,
        fee: 24.66,
        tax: 0,
      });
    });

    test('Map the USD currency buy order for US2546871060 correctly', () => {
      const activities = ersteBank.parsePages(buySamples[9]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ersteBank',
        type: 'Buy',
        date: '2019-12-04',
        isin: 'US2546871060',
        company: 'WALT DISNEY CO., THE',
        shares: 13,
        price: 137.76846153846154,
        fxRate: 1.1033,
        foreignCurrency: 'USD',
        amount: 1790.99,
        fee: 23.99,
        tax: 0,
      });
    });

    test('Map the USD currency buy order for US2546871060 correctly', () => {
      const activities = ersteBank.parsePages(buySamples[10]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ersteBank',
        type: 'Buy',
        date: '2020-09-21',
        isin: 'US5949181045',
        company: 'MICROSOFT CORP.',
        shares: 6,
        price: 170.03666666666666,
        fxRate: 1.1791,
        foreignCurrency: 'USD',
        amount: 1020.22,
        fee: 23.34,
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
