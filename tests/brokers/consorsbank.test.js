import { findImplementation } from '@/index';
import * as consorsbank from '../../src/brokers/consorsbank';
import {
  buySamples,
  sellSamples,
  dividendsSamples,
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
          datetime: '2020-02-12T14:57:49.000Z',
          fee: 17.46,
          isin: 'US00162Q8666',
          wkn: 'A1H99H',
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
          datetime: '2019-06-24T12:17:34.000Z',
          fee: 19.86,
          isin: 'US37950E5490',
          wkn: 'A1JJ54',
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
          datetime: '2020-01-27T15:15:47.000Z',
          fee: 17.56,
          isin: 'US00162Q8666',
          wkn: 'A1H99H',
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
          datetime: '2019-04-29T15:07:48.000Z',
          fee: 14.95,
          isin: 'US37950E5490',
          wkn: 'A1JJ54',
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
          datetime: '2015-08-06T15:01:20.000Z',
          fee: 13.9,
          isin: 'US70450Y1038',
          wkn: 'A14R7U',
          price: 35.784,
          shares: 100,
          amount: 3578.4,
          tax: 0,
        },
      ]);
    });

    test('should map pdf data of buy sample from 2015 (ISHS)', () => {
      const activity = consorsbank.parsePages(buySamples[5]).activities;

      expect(activity).toEqual([
        {
          broker: 'consorsbank',
          type: 'Buy',
          company: 'ISHS-EO CO.BD LA.C.UTS DZ',
          date: '2015-08-03',
          datetime: '2015-08-03T06:00:48.000Z',
          isin: 'DE0002511243',
          wkn: '251124',
          price: 133.2393168997759,
          shares: 0.51764,
          amount: 68.97,
          tax: 0,
          fee: 1.03,
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
          datetime: '2019-10-24T16:31:22.000Z',
          fee: 0,
          isin: 'US4781601046',
          wkn: '853260',
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
          datetime: '2019-10-24T16:31:22.000Z',
          fee: 0,
          isin: 'US4781601046',
          wkn: '853260',
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
      const activities = consorsbank.parsePages(dividendsSamples[0]).activities;

      expect(activities).toEqual([
        {
          type: 'Dividend',
          broker: 'consorsbank',
          company: 'Alerian MLP ETF Registered Shares o.N.',
          date: '2020-05-14',
          datetime: '2020-05-14T' + activities[0].datetime.substring(11),
          isin: 'US00162Q8666',
          wkn: 'A1H99H',
          amount: 186.79,
          price: 0.13836296296296297,
          shares: 1350,
          tax: 47.72,
          fee: 0,
          foreignCurrency: 'USD',
          fxRate: 1.0841,
        },
      ]);
    });

    test('should map pdf data of ertrag_global_x_superdividend_etf correctly', () => {
      const activities = consorsbank.parsePages(dividendsSamples[1]).activities;

      expect(activities).toEqual([
        {
          amount: 71.02,
          broker: 'consorsbank',
          company: 'Global X SuperDividend ETF Registered Shares o.N.',
          date: '2020-03-12',
          datetime: '2020-03-12T' + activities[0].datetime.substring(11),
          fee: 0,
          isin: 'US37950E5490',
          wkn: 'A1JJ54',
          price: 0.10926153846153847,
          shares: 650,
          tax: 18.15,
          type: 'Dividend',
          foreignCurrency: 'USD',
          fxRate: 1.1184,
        },
      ]);
    });

    test('should map pdf data of dividend_vanguard ftse_etf.json correctly', () => {
      const activities = consorsbank.parsePages(dividendsSamples[2]).activities;

      expect(activities).toEqual([
        {
          amount: 9.75,
          broker: 'consorsbank',
          company: 'Vanguard FTSE D.A.P.x.J.U.ETF Registered Shares o.N.',
          date: '2018-10-10',
          datetime: '2018-10-10T' + activities[0].datetime.substring(11),
          fee: 0,
          isin: 'IE00B9F5YL18',
          wkn: 'A1T8FT',
          price: 0.21195652173913043,
          shares: 46,
          tax: 1.8,
          type: 'Dividend',
          foreignCurrency: 'USD',
          fxRate: 1.1604,
        },
      ]);
    });

    test('should map pdf data of ertrag_alerian_mlp_etf_2.json', () => {
      const activities = consorsbank.parsePages(dividendsSamples[3]).activities;

      expect(activities).toEqual([
        {
          amount: 236.73,
          broker: 'consorsbank',
          company: 'Alerian MLP ETF Registered Shares o.N.',
          date: '2020-02-20',
          datetime: '2020-02-20T' + activities[0].datetime.substring(11),
          fee: 0,
          isin: 'US00162Q8666',
          wkn: 'A1H99H',
          price: 0.17535555555555554,
          shares: 1350,
          tax: 60.48,
          type: 'Dividend',
          foreignCurrency: 'USD',
          fxRate: 1.0835,
        },
      ]);
    });

    test('should map pdf data of dividend_volkswagen_ag.json', () => {
      const activities = consorsbank.parsePages(dividendsSamples[4]).activities;

      expect(activities).toEqual([
        {
          amount: 67.2,
          broker: 'consorsbank',
          company: 'VOLKSWAGEN AG Inhaber-Stammaktien o.N.',
          date: '2019-05-17',
          datetime: '2019-05-17T' + activities[0].datetime.substring(11),
          fee: 0,
          isin: 'DE0007664005',
          wkn: '766400',
          price: 4.8,
          shares: 14,
          tax: 18.68,
          type: 'Dividend',
        },
      ]);
    });

    test('should map pdf data of dividend_diageo.json', () => {
      const activities = consorsbank.parsePages(dividendsSamples[5]).activities;

      expect(activities).toEqual([
        {
          type: 'Dividend',
          amount: 1.53,
          broker: 'consorsbank',
          company: 'DIAGEO PLC Reg. Shares LS -,28935185',
          date: '2020-10-08',
          datetime: '2020-10-08T' + activities[0].datetime.substring(11),
          fee: 0,
          isin: 'GB0002374006',
          wkn: '851247',
          price: 0.4625640560518797,
          shares: 3.30765,
          tax: 0,
          foreignCurrency: 'GBP',
          fxRate: 0.9134,
        },
      ]);
    });

    test('should map pdf data of dividend_cisco_system_inc.json', () => {
      const activities = consorsbank.parsePages(dividendsSamples[6]).activities;

      expect(activities).toEqual([
        {
          amount: 0.27,
          broker: 'consorsbank',
          company: 'CISCO SYSTEMS INC. Registered Shares DL-,001',
          date: '2020-04-22',
          datetime: '2020-04-22T' + activities[0].datetime.substring(11),
          fee: 0,
          isin: 'US17275R1023',
          wkn: '878841',
          price: 0.33889795406049955,
          shares: 0.7967,
          tax: 0.04,
          type: 'Dividend',
          foreignCurrency: 'USD',
          fxRate: 1.0814,
        },
      ]);
    });

    test('should map pdf data of dividend_pepsico.json', () => {
      const activities = consorsbank.parsePages(dividendsSamples[7]).activities;

      expect(activities).toEqual([
        {
          amount: 1.26,
          broker: 'consorsbank',
          company: 'PEPSICO INC. Registered Shares DL -,0166',
          date: '2020-09-30',
          datetime: '2020-09-30T' + activities[0].datetime.substring(11),
          fee: 0,
          isin: 'US7134481081',
          wkn: '851995',
          price: 0.8723949318008724,
          shares: 1.4443,
          tax: 0.19,
          type: 'Dividend',
          foreignCurrency: 'USD',
          fxRate: 1.1786,
        },
      ]);
    });

    test('should map pdf data of illinois tool works', () => {
      const activities = consorsbank.parsePages(dividendsSamples[8]).activities;

      expect(activities).toEqual([
        {
          amount: 23.29,
          broker: 'consorsbank',
          company: 'ILLINOIS TOOL WORKS INC. Registered Shares o.N.',
          date: '2020-10-14',
          datetime: '2020-10-14T' + activities[0].datetime.substring(11),
          fee: 0,
          isin: 'US4523081093',
          wkn: '861219',
          price: 0.9704166666666667,
          shares: 24,
          tax: 5.95,
          type: 'Dividend',
          foreignCurrency: 'USD',
          fxRate: 1.1749,
        },
      ]);
    });

    // This document is a funny one. First, there is a missmatch occuring during
    // USD-> EUR calculation. It states a gross dividend of 0.13€ and a tax of
    // 0.02€, however 0.12€ are payed out.
    // Secondly, it seems to be a cancellation of an allready payed out dividend
    // so the dividend is payed BACK to the Broker to recalculate something
    test('should map pdf data of realty income', () => {
      const activities = consorsbank.parsePages(dividendsSamples[9]).activities;

      expect(activities).toEqual([
        {
          broker: 'consorsbank',
          company: 'REALTY INCOME CORP. Registered Shares DL 1',
          date: '2020-02-19',
          datetime: '2020-02-19T' + activities[0].datetime.substring(11),
          isin: 'US7561091049',
          wkn: '899744',
          amount: 0.13,
          fee: 0,
          price: 0.1908256880733945,
          shares: 0.68125,
          tax: 0.01,
          type: 'Dividend',
          foreignCurrency: 'USD',
          fxRate: 1.1174,
        },
      ]);
    });

    test('should map pdf data of agnc investment corp', () => {
      const activities = consorsbank.parsePages(dividendsSamples[10])
        .activities;

      expect(activities).toEqual([
        {
          broker: 'consorsbank',
          company: 'AGNC Investment Corp. Registered Shares DL -,001',
          date: '2020-06-29',
          datetime: '2020-06-29T' + activities[0].datetime.substring(11),
          isin: 'US00123Q1040',
          wkn: 'A2AR58',
          amount: 5.87,
          fee: 0,
          price: 0.09171875,
          shares: 64,
          tax: 0.88,
          type: 'Dividend',
          foreignCurrency: 'USD',
          fxRate: 1.1263,
        },
      ]);
    });

    test('Can parse dividend from a 2015 total sa file', () => {
      const activities = consorsbank.parsePages(dividendsSamples[11])
        .activities;

      expect(activities).toEqual([
        {
          broker: 'consorsbank',
          company: 'Total S.A.',
          date: '2015-07-01',
          datetime: '2015-07-01T' + activities[0].datetime.substring(11),
          wkn: 'A14UJS',
          amount: 15.25,
          fee: 0,
          price: 0.61,
          shares: 25,
          tax: 4.58,
          type: 'Dividend',
        },
      ]);
    });

    test('Can parse dividend from a 2016 bmw file', () => {
      const activities = consorsbank.parsePages(dividendsSamples[12])
        .activities;

      expect(activities).toEqual([
        {
          broker: 'consorsbank',
          company: 'BAYERISCHE MOTOREN WERKE AG',
          date: '2016-05-13',
          datetime: '2016-05-13T' + activities[0].datetime.substring(11),
          wkn: '519000',
          amount: 489.6,
          fee: 0,
          price: 3.2,
          shares: 153,
          tax: 136.2,
          type: 'Dividend',
        },
      ]);
    });

    test('Can parse dividend from a 2018 total sa file', () => {
      const activities = consorsbank.parsePages(dividendsSamples[13])
        .activities;

      expect(activities).toEqual([
        {
          broker: 'consorsbank',
          company: 'Total S.A. Anrechte',
          date: '2018-06-28',
          datetime: '2018-06-28T' + activities[0].datetime.substring(11),
          wkn: 'A2JNEW',
          isin: 'FR0013333374',
          amount: 15.5,
          fee: 0,
          price: 0.62,
          shares: 25,
          tax: 4.65,
          type: 'Dividend',
        },
      ]);
    });

    test('Can parse dividend from a 2018 DEUTSCHE POST AG file', () => {
      const activities = consorsbank.parsePages(dividendsSamples[14])
        .activities;

      expect(activities).toEqual([
        {
          broker: 'consorsbank',
          company: 'DEUTSCHE POST AG NAMENS-AKTIEN O.N.',
          date: '2018-04-27',
          datetime: '2018-04-27T' + activities[0].datetime.substring(11),
          wkn: '555200',
          isin: 'DE0005552004',
          amount: 24.15,
          fee: 0,
          price: 1.15,
          shares: 21,
          tax: 0,
          type: 'Dividend',
        },
      ]);
    });
  });
});
