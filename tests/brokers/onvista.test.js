import { getBroker } from '../../src/';
import * as onvista from '../../src/brokers/onvista';
import {
  buySamples,
  dividendsSamples,
  multiPageSample,
} from './__mocks__/onvista';

console.error = jest.fn();

describe('Onvista Bank broker', () => {
  test('Our samples should be detected by Onvista Bank handler only', () => {
    for (let sample of buySamples.concat(dividendsSamples)) {
      expect(getBroker(sample)).toEqual(onvista);
    }
  });

  let multiPageActivities;

  describe('Multiple Pages', () => {
    test('should parse a PDF with multiple bills', () => {
      multiPageActivities = onvista.parsePages(multiPageSample);
      expect(multiPageActivities.length).toEqual(2);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Buy', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const activity = onvista.parsePages(buySamples[0]);

      expect(activity).toEqual([
        {
          broker: 'onvista',
          type: 'Buy',
          date: '2019-12-16',
          isin: 'LU0635178014',
          company: 'ComSta.-MSCI Em.Mkts.TRN U.ETF Inhaber-Anteile I o.N.',
          shares: 6.9666,
          price: 42.919,
          amount: 299,
          fee: 1,
          tax: 0,
        },
      ]);
    });

    test('should map pdf data of sample 2 correctly', () => {
      const activity = onvista.parsePages(buySamples[1]);

      expect(activity).toEqual([
        {
          broker: 'onvista',
          type: 'Buy',
          date: '2020-04-15',
          isin: 'IE00B3RBWM25',
          company: 'Vanguard FTSE All-World U.ETF Registered Shares USD Dis.oN',
          shares: 13.9369,
          price: 71.68,
          amount: 999,
          fee: 1,
          tax: 0,
        },
      ]);
    });

    test('should map pdf data of sample 3 correctly', () => {
      const activity = onvista.parsePages(buySamples[2]);

      expect(activity).toEqual([
        {
          broker: 'onvista',
          type: 'Buy',
          date: '2018-11-09',
          isin: 'LU0392494562',
          company: 'ComStage-MSCI World TRN U.ETF Inhaber-Anteile I o.N.',
          shares: 19,
          price: 50.977,
          amount: 968.56,
          fee: 1.5,
          tax: 0,
        },
      ]);
    });

    test('should map pdf data of multi-page sample 1 correctly', () => {
      const activity = multiPageActivities[0];

      expect(activity).toEqual({
        broker: 'onvista',
        type: 'Buy',
        date: '2019-12-27',
        isin: 'IE00B3RBWM25',
        company: 'Vanguard FTSE All-World U.ETF Registered Shares USD Dis.oN',
        shares: 27,
        price: 84.16,
        amount: 2272.32,
        fee: 9.7,
        tax: 0,
      });
    });
  });

  describe('Sell', () => {
    test('should map pdf data of multi-page sample 2 correctly', () => {
      const activity = multiPageActivities[1];

      expect(activity).toEqual({
        broker: 'onvista',
        type: 'Sell',
        date: '2019-12-27',
        isin: 'IE00B4L5Y983',
        company: 'iShsIII-Core MSCI World U.ETF Registered Shs USD (Acc) o.N.',
        shares: 38,
        price: 56.991,
        amount: 2165.66,
        fee: 7,
        tax: 0,
      });
    });
  });

  describe('Dividend', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const activity = onvista.parsePages(dividendsSamples[0]);

      expect(activity).toEqual([
        {
          broker: 'onvista',
          type: 'Dividend',
          date: '2020-04-08',
          isin: 'IE00B3RBWM25',
          company: 'Vanguard FTSE All-World U.ETF Registered Shares USD Dis.oN',
          shares: 222.9756,
          price: 0.37582587511817436527,
          amount: 83.8,
          fee: 0,
          tax: 0,
        },
      ]);
    });
  });
});
