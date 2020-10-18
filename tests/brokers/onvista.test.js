import { findImplementation } from '../../src';
import * as onvista from '../../src/brokers/onvista';
import {
  buySamples,
  sellSamples,
  dividendsSamples,
  multiPageSamples,
} from './__mocks__/onvista';

console.error = jest.fn();

describe('Broker: onvista', () => {
  let multiPageResult;
  const allSamples = buySamples
    .concat(dividendsSamples)
    .concat(multiPageSamples)
    .concat(sellSamples);

  describe('Check all documents', () => {
    test('Can the document parsed with onvista', () => {
      allSamples.forEach(samples => {
        expect(samples.some(item => onvista.canParsePage(item, 'pdf'))).toEqual(
          true
        );
      });
    });

    test('Can identify a implementation from the document as onvista', () => {
      allSamples.forEach(samples => {
        const implementations = findImplementation(samples, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(onvista);
      });
    });
  });

  describe('Multiple Pages', () => {
    test('should parse a PDF with multiple bills', () => {
      multiPageResult = onvista.parsePages(multiPageSamples[0]);
      expect(multiPageResult.activities.length).toEqual(2);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Buy', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const result = onvista.parsePages(buySamples[0]);

      expect(result.activities).toEqual([
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
      const result = onvista.parsePages(buySamples[1]);

      expect(result.activities).toEqual([
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
      const result = onvista.parsePages(buySamples[2]);

      expect(result.activities).toEqual([
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

    test('should map pdf data of sample 4 correctly', () => {
      const result = onvista.parsePages(buySamples[3]);

      expect(result.activities).toEqual([
        {
          broker: 'onvista',
          type: 'Buy',
          date: '2010-02-18',
          isin: 'DE0008430026',
          company: 'Münchener Rückvers.-Ges. AG vink.Namens-Aktien o.N.',
          shares: 13,
          price: 110.399,
          amount: 1435.19,
          fee: 1.3,
          tax: 0,
        },
      ]);
    });

    test('should map pdf data of multi-page sample 1 correctly', () => {
      expect(multiPageResult.activities[0]).toEqual({
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
      expect(multiPageResult.activities[1]).toEqual({
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

    test('should map pdf data of sample 1 correctly', () => {
      const result = onvista.parsePages(sellSamples[0]);

      expect(result.activities).toEqual([
        {
          broker: 'onvista',
          type: 'Sell',
          date: '2020-02-27',
          isin: 'CA0585861085',
          company: 'Ballard Power Systems Inc. Registered Shares o.N.',
          shares: 60,
          price: 9.254,
          amount: 555.24,
          fee: 7,
          tax: 0,
        },
        {
          broker: 'onvista',
          type: 'Sell',
          date: '2020-02-27',
          isin: 'DE000A0F5UF5',
          company: 'iShare.NASDAQ-100 UCITS ETF DE Inhaber-Anteile',
          shares: 7,
          price: 78.272,
          amount: 547.9,
          fee: 7,
          tax: 0,
        },
        {
          broker: 'onvista',
          type: 'Sell',
          date: '2020-02-27',
          isin: 'IE00B52VJ196',
          company: 'iShsII-MSCI Europe SRI U.ETF Registered Shs EUR (Acc) o.N.',
          shares: 10,
          price: 47.518,
          amount: 475.18,
          fee: 7,
          tax: 0,
        },
        {
          broker: 'onvista',
          type: 'Sell',
          date: '2020-02-27',
          isin: 'NO0010081235',
          company: 'NEL ASA Navne-Aksjer NK -,20',
          shares: 500,
          price: 0.9855,
          amount: 492.75,
          fee: 7,
          tax: 0,
        },
        {
          broker: 'onvista',
          type: 'Sell',
          date: '2020-02-27',
          isin: 'SE0006425815',
          company: 'PowerCell Sweden AB (publ) Namn-Aktier SK-,022',
          shares: 95,
          price: 20.35,
          amount: 1933.25,
          fee: 7,
          tax: 0,
        },
        {
          broker: 'onvista',
          type: 'Sell',
          date: '2020-02-27',
          isin: 'US55087P1049',
          company: 'Lyft Inc. Registered Shares Cl.A o.N.',
          shares: 10,
          price: 35.71,
          amount: 357.1,
          fee: 7,
          tax: 0,
        },
      ]);
    });

    test('should map pdf data of sample 2 correctly', () => {
      expect(onvista.parsePages(sellSamples[1]).activities).toEqual([
        {
          broker: 'onvista',
          type: 'Sell',
          date: '2018-08-08',
          isin: 'DE000A1TNUT7',
          company: 'Deutsche Beteiligungs AG Namens-Aktien o.N.',
          shares: 72,
          price: 38.05,
          amount: 2739.6,
          fee: 6.5,
          tax: 39.01,
        },
      ]);
    });

    test('should map pdf data of sample 3 correctly', () => {
      expect(onvista.parsePages(sellSamples[2]).activities).toEqual([
        {
          broker: 'onvista',
          type: 'Sell',
          date: '2018-09-27',
          isin: 'IE00B2NPKV68',
          company: 'iShsII-J.P.M.$ EM Bond U.ETF Registered Shares o.N.',
          shares: 57,
          price: 91.024,
          amount: 5188.37,
          fee: 6.5,
          tax: 34.52,
        },
      ]);
    });
  });

  test('should map pdf data of sample 4 correctly', () => {
    expect(onvista.parsePages(sellSamples[3]).activities).toEqual([
      {
        broker: 'onvista',
        type: 'Sell',
        date: '2018-11-27',
        isin: 'DE0007480204',
        company: 'Deutsche EuroShop AG Namens-Aktien o.N.',
        shares: 84,
        price: 28.16,
        amount: 2365.44,
        fee: 6.5,
        tax: 0,
      },
    ]);
  });

  describe('Dividend', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const result = onvista.parsePages(dividendsSamples[0]);

      expect(result.activities).toEqual([
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

    test('should map pdf data of sample 2 correctly', () => {
      const result = onvista.parsePages(dividendsSamples[1]);

      expect(result.activities).toEqual([
        {
          broker: 'onvista',
          type: 'Dividend',
          date: '2019-09-16',
          isin: 'DE000A0F5UF5',
          company: 'iShare.NASDAQ-100 UCITS ETF DE Inhaber-Anteile',
          shares: 4.9438,
          price: 0.028318297665763176,
          amount: 0.14,
          fee: 0,
          tax: 0.03,
        },
      ]);
    });

    test('should map pdf data of sample 3 correctly', () => {
      const result = onvista.parsePages(dividendsSamples[2]);

      expect(result.activities).toEqual([
        {
          broker: 'onvista',
          type: 'Dividend',
          date: '2019-08-22',
          isin: 'LU0635178014',
          company: 'ComSta.-MSCI Em.Mkts.TRN U.ETF Inhaber-Anteile I o.N.',
          shares: 55.7157,
          price: 0.8814391634673889,
          amount: 49.11,
          fee: 0,
          tax: 4.14,
        },
      ]);
    });

    test('should map pdf data of sample 4 correctly', () => {
      expect(onvista.parsePages(dividendsSamples[3]).activities).toEqual([
        {
          broker: 'onvista',
          type: 'Dividend',
          date: '2019-10-15',
          isin: 'DE0002635281',
          company: 'iSh.EO ST.Sel.Div.30 U.ETF DE Inhaber-Anteile',
          shares: 245.3939,
          price: 0.14947396817932312,
          amount: 36.68,
          fee: 0,
          tax: 6.77,
        },
        {
          broker: 'onvista',
          type: 'Dividend',
          date: '2019-10-15',
          isin: 'DE0002635299',
          company: 'iSh.ST.Eur.Sel.Div.30 U.ETF DE Inhaber-Anteile',
          shares: 270.787,
          price: 0.12640931802486827,
          amount: 34.23,
          fee: 0,
          tax: 6.32,
        },
      ]);
    });
  });
});
