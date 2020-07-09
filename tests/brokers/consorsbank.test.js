import { getBroker } from '../../src';
import * as consorsbank from '../../src/brokers/consorsbank';
import {
  buySamples,
  sellSamples,
  dividendsSamples,
} from './__mocks__/consorsbank';

console.error = jest.fn();

describe('Consorsbank broker', () => {
  test('Our samples should be detected by Consorsbank handler only', () => {
    for (let sample of buySamples
      .concat(dividendsSamples)
      .concat(sellSamples)) {
      expect(getBroker(sample[0])).toEqual(consorsbank);
    }
  });

  describe('Buy', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const activity = consorsbank.parsePages(buySamples[0]);

      expect(activity).toEqual([
        {
          broker: 'consorsbank',
          type: 'Buy',
          tax: 0,
          company: 'ALERIAN MLP ETF',
          date: '2020-02-12',
          fee: 17.46,
          isin: 'US00162Q8666',
          price: 7.414,
          amount: 5004.45,
          shares: 675,
        },
      ]);
    });

    test('should map pdf data of sample 2 correctly', () => {
      const activity = consorsbank.parsePages(buySamples[1]);

      expect(activity).toEqual([
        {
          broker: 'consorsbank',
          type: 'Buy',
          company: 'GLOB.X SUPERDIVIDEND ETF',
          date: '2019-06-24',
          fee: 19.86,
          isin: 'US37950E5490',
          price: 14.908,
          shares: 400,
          amount: 5963.2,
          tax: 0,
        },
      ]);
    });

    test('should map pdf data of sample 3 correctly', () => {
      const activity = consorsbank.parsePages(buySamples[2]);

      expect(activity).toEqual([
        {
          broker: 'consorsbank',
          type: 'Buy',
          amount: 5044.28,
          company: 'ALERIAN MLP ETF',
          date: '2020-01-27',
          fee: 17.56,
          isin: 'US00162Q8666',
          price: 7.473007407407407,
          shares: 675,
          tax: 0,
        },
      ]);
    });

    test('should map pdf data of sample 4 correctly', () => {
      const activity = consorsbank.parsePages(buySamples[3]);

      expect(activity).toEqual([
        {
          broker: 'consorsbank',
          type: 'Buy',
          company: 'GLOB.X SUPERDIVIDEND ETF',
          date: '2019-04-29',
          fee: 14.95,
          isin: 'US37950E5490',
          price: 15.994,
          shares: 250,
          amount: 3998.5,
          tax: 0,
        },
      ]);
    });
  });

  describe('Sell', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const activity = consorsbank.parsePages(sellSamples[0]);

      expect(activity).toEqual([
        {
          amount: 22.59,
          broker: 'consorsbank',
          company: 'JOHNSON + JOHNSON    DL 1',
          date: '2019-10-24',
          fee: 0,
          isin: 'US4781601046',
          price: 116.44329896907216,
          shares: 0.194,
          tax: 0,
          type: 'Sell',
        },
      ]);
    });

    test('should map pdf data of sample 2 correctly', () => {
      expect(consorsbank.parsePages(sellSamples[1])).toEqual([
        {
          amount: 22.59,
          broker: 'consorsbank',
          company: 'JOHNSON + JOHNSON    DL 1',
          date: '2019-10-24',
          fee: 0,
          isin: 'US4781601046',
          price: 116.44329896907216,
          shares: 0.194,
          tax: 0,
          type: 'Sell',
        },
      ]);
    });
  });

  describe('Dividend', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const activity = consorsbank.parsePages(dividendsSamples[0]);

      expect(activity).toEqual([
        {
          amount: 158.77,
          broker: 'consorsbank',
          company: 'Alerian MLP ETF Registered Shares o.N.',
          date: '2020-05-06',
          fee: 0,
          isin: 'US00162Q8666',
          price: 0.11760740740740741,
          shares: 1350,
          tax: 19.7,
          type: 'Dividend',
        },
      ]);
    });

    test('should map pdf data of sample 2 correctly', () => {
      const activity = consorsbank.parsePages(dividendsSamples[1]);

      expect(activity).toEqual([
        {
          amount: 60.37,
          broker: 'consorsbank',
          company: 'Global X SuperDividend ETF Registered Shares o.N.',
          date: '2020-03-03',
          fee: 0,
          isin: 'US37950E5490',
          price: 0.09287692307692308,
          shares: 650,
          tax: 7.5,
          type: 'Dividend',
        },
      ]);
    });

    test('should map pdf data of sample 3 correctly', () => {
      const activity = consorsbank.parsePages(dividendsSamples[2]);

      expect(activity).toEqual([
        {
          amount: 9.75,
          broker: 'consorsbank',
          company: 'Vanguard FTSE D.A.P.x.J.U.ETF Registered Shares o.N.',
          date: '2018-09-26',
          fee: 0,
          isin: 'IE00B9F5YL18',
          price: 0.21195652173913043,
          shares: 46,
          tax: 1.8,
          type: 'Dividend',
        },
      ]);
    });

    test('should map pdf data of sample 4 correctly', () => {
      expect(consorsbank.parsePages(dividendsSamples[3])).toEqual([
        {
          amount: 201.22,
          broker: 'consorsbank',
          company: 'Alerian MLP ETF Registered Shares o.N.',
          date: '2020-02-12',
          fee: 0,
          isin: 'US00162Q8666',
          price: 0.14905185185185185,
          shares: 1350,
          tax: 24.97,
          type: 'Dividend',
        },
      ]);
    });
  });
});
