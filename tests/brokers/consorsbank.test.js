import { findImplementation } from '@/index';
import * as consorsbank from '../../src/brokers/consorsbank';
import {
  buySamples,
  sellSamples,
  dividendsSamples,
  oldDividendsSamples,
} from './__mocks__/consorsbank';
console.error = jest.fn();

describe('Broker: Consorsbank', () => {
  const allSamples = buySamples.concat(dividendsSamples).concat(sellSamples);

  describe('Check all documents', () => {
    test('Can the document parsed with Consorsbank', () => {
      allSamples.forEach(samples => {
        expect(
          samples.some(item => consorsbank.canParsePage(item, 'pdf'))
        ).toEqual(true);
      });
    });

    test('Can identify a implementation from the document as Consorsbank', () => {
      allSamples.forEach(samples => {
        const implementations = findImplementation(samples, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(consorsbank);
      });
    });
  });

  test('PDFs with the old Consorsbank format should not be accepted', () => {
    expect(consorsbank.canParsePage(oldDividendsSamples[0], 'pdf')).toEqual(
      false
    );
  });

  describe('Buy', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const activity = consorsbank.parsePages(buySamples[0]).activities;

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
      const activity = consorsbank.parsePages(buySamples[1]).activities;

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
      const activity = consorsbank.parsePages(buySamples[2]).activities;

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
      const activity = consorsbank.parsePages(buySamples[3]).activities;

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

    test('should map pdf data of old buy sample correctly', () => {
      const activity = consorsbank.parsePages(buySamples[4]).activities;

      expect(activity).toEqual([
        {
          broker: 'consorsbank',
          type: 'Buy',
          company: 'PAYPAL HDGS INC.DL-,0001',
          date: '2015-08-06',
          fee: 13.9,
          isin: 'US70450Y1038',
          price: 35.784000,
          shares: 100,
          amount: 3578.40,
          tax: 0,
        },
      ]);
    });
  });

  describe('Sell', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const activity = consorsbank.parsePages(sellSamples[0]).activities;

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
      expect(consorsbank.parsePages(sellSamples[1]).activities).toEqual([
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
    test('should map pdf data of ertrag_alerian_mlp_etf_1.json correctly', () => {
      const activity = consorsbank.parsePages(dividendsSamples[0]).activities;

      expect(activity).toEqual([
        {
          amount: 186.79,
          broker: 'consorsbank',
          company: 'Alerian MLP ETF Registered Shares o.N.',
          date: '2020-05-14',
          fee: 0,
          isin: 'US00162Q8666',
          price: 0.13836296296296297,
          shares: 1350,
          tax: 47.72,
          type: 'Dividend',
        },
      ]);
    });

    test('should map pdf data of ertrag_global_x_superdividend_etf correctly', () => {
      const activity = consorsbank.parsePages(dividendsSamples[1]).activities;

      expect(activity).toEqual([
        {
          amount: 71.02,
          broker: 'consorsbank',
          company: 'Global X SuperDividend ETF Registered Shares o.N.',
          date: '2020-03-12',
          fee: 0,
          isin: 'US37950E5490',
          price: 0.10926153846153847,
          shares: 650,
          tax: 18.15,
          type: 'Dividend',
        },
      ]);
    });

    test('should map pdf data of dividend_vanguard ftse_etf.json correctly', () => {
      const activity = consorsbank.parsePages(dividendsSamples[2]).activities;

      expect(activity).toEqual([
        {
          amount: 9.75,
          broker: 'consorsbank',
          company: 'Vanguard FTSE D.A.P.x.J.U.ETF Registered Shares o.N.',
          date: '2018-10-10',
          fee: 0,
          isin: 'IE00B9F5YL18',
          price: 0.21195652173913043,
          shares: 46,
          tax: 1.8,
          type: 'Dividend',
        },
      ]);
    });

    test('should map pdf data of ertrag_alerian_mlp_etf_2.json', () => {
      expect(consorsbank.parsePages(dividendsSamples[3]).activities).toEqual([
        {
          amount: 236.73,
          broker: 'consorsbank',
          company: 'Alerian MLP ETF Registered Shares o.N.',
          date: '2020-02-20',
          fee: 0,
          isin: 'US00162Q8666',
          price: 0.17535555555555554,
          shares: 1350,
          tax: 60.48,
          type: 'Dividend',
        },
      ]);
    });

    test('should map pdf data of dividend_volkswagen_ag.json', () => {
      expect(consorsbank.parsePages(dividendsSamples[4]).activities).toEqual([
        {
          amount: 67.2,
          broker: 'consorsbank',
          company: 'VOLKSWAGEN AG Inhaber-Stammaktien o.N.',
          date: '2019-05-17',
          fee: 0,
          isin: 'DE0007664005',
          price: 4.8,
          shares: 14,
          tax: 18.68,
          type: 'Dividend',
        },
      ]);
    });

    test('should map pdf data of dividend_diageo.json', () => {
      expect(consorsbank.parsePages(dividendsSamples[5]).activities).toEqual([
        {
          amount: 1.53,
          broker: 'consorsbank',
          company: 'DIAGEO PLC Reg. Shares LS -,28935185',
          date: '2020-10-08',
          fee: 0,
          isin: 'GB0002374006',
          price: 0.4625640560518797,
          shares: 3.30765,
          tax: 0,
          type: 'Dividend',
        },
      ]);
    });

    test('should map pdf data of dividend_cisco_system_inc.json', () => {
      expect(consorsbank.parsePages(dividendsSamples[6]).activities).toEqual([
        {
          amount: 0.27,
          broker: 'consorsbank',
          company: 'CISCO SYSTEMS INC. Registered Shares DL-,001',
          date: '2020-04-22',
          fee: 0,
          isin: 'US17275R1023',
          price: 0.33889795406049955,
          shares: 0.7967,
          tax: 0.04,
          type: 'Dividend',
        },
      ]);
    });

    test('should map pdf data of dividend_pepsico.json', () => {
      expect(consorsbank.parsePages(dividendsSamples[7]).activities).toEqual([
        {
          amount: 1.26,
          broker: 'consorsbank',
          company: 'PEPSICO INC. Registered Shares DL -,0166',
          date: '2020-09-30',
          fee: 0,
          isin: 'US7134481081',
          price: 0.8723949318008724,
          shares: 1.4443,
          tax: 0.19,
          type: 'Dividend',
        },
      ]);
    });

    test('should map pdf data of illinois tool works', () => {
      expect(consorsbank.parsePages(dividendsSamples[8]).activities).toEqual([
        {
          amount: 23.29,
          broker: 'consorsbank',
          company: 'ILLINOIS TOOL WORKS INC. Registered Shares o.N.',
          date: '2020-10-14',
          fee: 0,
          isin: 'US4523081093',
          price: 0.9704166666666667,
          shares: 24,
          tax: 5.95,
          type: 'Dividend',
        },
      ]);
    });

    test('should map pdf data of realty income', () => {
      expect(consorsbank.parsePages(dividendsSamples[9]).activities).toEqual([
        {
          broker: 'consorsbank',
          company: 'REALTY INCOME CORP. Registered Shares DL 1',
          date: '2020-02-19',
          isin: 'US7561091049',
          amount: 0.13,
          fee: 0,
          price: 0.1908256880733945,
          shares: 0.68125,
          tax: 0.02,
          type: 'Dividend',
        },
      ]);
    });

    test('should map pdf data of agnc investment corp', () => {
      expect(consorsbank.parsePages(dividendsSamples[10]).activities).toEqual([
        {
          broker: 'consorsbank',
          company: 'AGNC Investment Corp. Registered Shares DL -,001',
          date: '2020-06-29',
          isin: 'US00123Q1040',
          amount: 5.87,
          fee: 0,
          price: 0.09171875,
          shares: 64,
          tax: 0.88,
          type: 'Dividend',
        },
      ]);
    });
  });
});
