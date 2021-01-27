import { findImplementation } from '../../src';
import * as onvista from '../../src/brokers/onvista';
import Big from 'big.js';
import {
  buySamples,
  sellSamples,
  dividendsSamples,
  multiPageSamples,
  ignoredSamples,
  accountStatementSamples,
  allSamples,
} from './__mocks__/onvista';

console.error = jest.fn();

describe('Broker: onvista', () => {
  let multiPageResult;

  describe('Check all documents', () => {
    test('Can the document parsed with onvista', () => {
      allSamples.forEach(pages => {
        expect(onvista.canParseDocument(pages, 'pdf')).toEqual(true);
      });
    });

    test('Can identify a implementation from the document as onvista', () => {
      allSamples.forEach(pages => {
        const implementations = findImplementation(pages, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(onvista);
      });
    });
  });

  describe('Multiple Pages', () => {
    test('should parse a PDF with multiple bills', () => {
      multiPageResult = onvista.parsePages(multiPageSamples[0]);
      expect(multiPageResult.activities.length).toEqual(2);
    });
  });

  describe('Buy', () => {
    test('Can parse ComSta MSCI EM 2019', () => {
      const result = onvista.parsePages(buySamples[0]);

      expect(result.activities).toEqual([
        {
          broker: 'onvista',
          type: 'Buy',
          date: '2019-12-16',
          datetime: '2019-12-16T08:04:00.000Z',
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

    test('Can parse Vanguard FTSE All-World 2020', () => {
      const result = onvista.parsePages(buySamples[1]);

      expect(result.activities).toEqual([
        {
          broker: 'onvista',
          type: 'Buy',
          date: '2020-04-15',
          datetime: '2020-04-15T07:04:00.000Z',
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

    test('Can parse 2018 ComStage MSCI World', () => {
      const result = onvista.parsePages(buySamples[2]);

      expect(result.activities).toEqual([
        {
          broker: 'onvista',
          type: 'Buy',
          date: '2018-11-09',
          datetime: '2018-11-09T09:35:00.000Z',
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

    test('Can parse 2010 Münchener Rück', () => {
      const result = onvista.parsePages(buySamples[3]);

      expect(result.activities).toEqual([
        {
          broker: 'onvista',
          type: 'Buy',
          date: '2010-02-18',
          datetime: '2010-02-18T15:58:00.000Z',
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
        datetime: '2019-12-27T09:35:00.000Z',
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
        datetime: '2019-12-27T09:28:00.000Z',
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
          datetime: '2020-02-27T07:52:00.000Z',
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
          datetime: '2020-02-27T11:42:00.000Z',
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
          datetime: '2020-02-27T11:43:00.000Z',
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
          datetime: '2020-02-27T11:40:00.000Z',
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
          datetime: '2020-02-27T07:59:00.000Z',
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
          datetime: '2020-02-27T11:44:00.000Z',
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
          datetime: '2018-08-08T10:03:00.000Z',
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
          datetime: '2018-09-27T07:42:00.000Z',
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

    test('should map pdf data of sample 4 correctly', () => {
      expect(onvista.parsePages(sellSamples[3]).activities).toEqual([
        {
          broker: 'onvista',
          type: 'Sell',
          date: '2018-11-27',
          datetime: '2018-11-27T16:22:00.000Z',
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

    test('Can parse Sell in USD from epam systems', () => {
      const activities = onvista.parsePages(sellSamples[4]).activities;

      expect(activities[0]).toEqual({
        broker: 'onvista',
        type: 'Sell',
        date: '2021-01-04',
        datetime: '2021-01-04T' + activities[0].datetime.substring(11),
        isin: 'US29414B1044',
        company: 'EPAM Systems Inc. Registered Shares DL -,001',
        shares: 10,
        price: 277.60741822903987,
        amount: 2776.0733706679653,
        fee: 14.998782566350133,
        tax: 0,
        fxRate: 1.2321,
        foreignCurrency: 'USD',
      });
    });
  });

  describe('Dividend', () => {
    test('Can parse dividend for 2020_Vanguard_FTSE_All_World', () => {
      const activities = onvista.parsePages(dividendsSamples[0]).activities;

      expect(activities).toEqual([
        {
          broker: 'onvista',
          type: 'Dividend',
          date: '2020-04-08',
          datetime: '2020-04-08T' + activities[0].datetime.substring(11),
          isin: 'IE00B3RBWM25',
          company: 'Vanguard FTSE All-World U.ETF Registered Shares USD Dis.oN',
          shares: 222.9756,
          price: 0.37582587511817436527,
          amount: 83.8,
          fee: 0,
          tax: 0,
          foreignCurrency: 'USD',
          fxRate: 1.0864,
        },
      ]);
    });

    test('Can parse dividend for 2019_iShare.NASDAQ-100', () => {
      const activities = onvista.parsePages(dividendsSamples[1]).activities;

      expect(activities).toEqual([
        {
          broker: 'onvista',
          type: 'Dividend',
          date: '2019-09-16',
          datetime: '2019-09-16T' + activities[0].datetime.substring(11),
          isin: 'DE000A0F5UF5',
          company: 'iShare.NASDAQ-100 UCITS ETF DE Inhaber-Anteile',
          shares: 4.9438,
          price: 0.028318297665763176,
          amount: 0.14,
          fee: 0,
          tax: 0.03,
          foreignCurrency: 'USD',
          fxRate: 1.1078,
        },
      ]);
    });

    test('Can parse dividend for 2019_ComSta._MSCI_Em.Mkts', () => {
      const activities = onvista.parsePages(dividendsSamples[2]).activities;

      expect(activities).toEqual([
        {
          broker: 'onvista',
          type: 'Dividend',
          date: '2019-08-22',
          datetime: '2019-08-22T' + activities[0].datetime.substring(11),
          isin: 'LU0635178014',
          company: 'ComSta.-MSCI Em.Mkts.TRN U.ETF Inhaber-Anteile I o.N.',
          shares: 55.7157,
          price: 0.8814391634673889,
          amount: 49.11,
          fee: 0,
          tax: 4.14,
          foreignCurrency: 'USD',
          fxRate: 1.1129,
        },
      ]);
    });

    test('Can parse dividend for 2019_iSh.EO_ST.Sel.Div.30', () => {
      const activities = onvista.parsePages(dividendsSamples[3]).activities;

      expect(activities).toEqual([
        {
          broker: 'onvista',
          type: 'Dividend',
          date: '2019-10-15',
          datetime: '2019-10-15T' + activities[0].datetime.substring(11),
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
          datetime: '2019-10-15T' + activities[0].datetime.substring(11),
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

    test('Can map the dividend file correctly: 2019_MetLife', () => {
      const activities = onvista.parsePages(dividendsSamples[4]).activities;

      expect(activities).toEqual([
        {
          broker: 'onvista',
          type: 'Dividend',
          date: '2019-06-13',
          datetime: '2019-06-13T' + activities[0].datetime.substring(11),
          isin: 'US59156R1086',
          company: 'MetLife Inc. Registered Shares DL -,01',
          shares: 6,
          price: 0.38666666666666666,
          amount: 2.32,
          fee: 0,
          tax: 0.38,
          foreignCurrency: 'USD',
          fxRate: 1.1373,
        },
      ]);
    });
  });

  describe('Account Statement', () => {
    test('Can parse 2020_account_statement_1', () => {
      const result = onvista.parsePages(accountStatementSamples[0]);
      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(11);
      expect(result.activities[0]).toEqual({
        broker: 'onvista',
        type: 'Buy',
        date: '2020-12-03',
        datetime: '2020-12-03T' + result.activities[0].datetime.substring(11),
        isin: 'US09075V1026',
        company: 'BIONTECH SE SPON. ADRS 1',
        shares: 4,
        price: +Big(428.6).div(4),
        amount: 428.6,
        fee: 0,
        tax: 0,
      });

      expect(result.activities[10]).toEqual({
        broker: 'onvista',
        type: 'Buy',
        date: '2020-12-30',
        datetime: '2020-12-30T' + result.activities[0].datetime.substring(11),
        isin: 'NL0015436031',
        company: 'CUREVAC N.V. O.N.',
        shares: 5,
        price: +Big(376.6).div(5),
        amount: 376.6,
        fee: 0,
        tax: 0,
      });
    });

    test('Can parse 2020_account_statement_2', () => {
      const result = onvista.parsePages(accountStatementSamples[1]);
      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(3);
      expect(result.activities[0]).toEqual({
        broker: 'onvista',
        type: 'Buy',
        date: '2020-03-06',
        datetime: '2020-03-06T' + result.activities[0].datetime.substring(11),
        isin: 'NO0010081235',
        company: 'NEL ASA NK-,20',
        shares: 40,
        price: +Big(52.96).div(40),
        amount: 52.96,
        fee: 0,
        tax: 0,
      });
    });

    test('Can parse 2016_account_statement', () => {
      const result = onvista.parsePages(accountStatementSamples[2]);
      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(2);
      expect(result.activities[0]).toEqual({
        broker: 'onvista',
        type: 'Buy',
        date: '2016-12-12',
        datetime: '2016-12-12T' + result.activities[0].datetime.substring(11),
        isin: 'GB00B128C026',
        company: 'AIR BERLIN PLC',
        shares: 100,
        price: +Big(64.5).div(100),
        amount: 64.5,
        fee: 0,
        tax: 0,
      });
      expect(result.activities[1]).toEqual({
        broker: 'onvista',
        type: 'Sell',
        date: '2016-12-23',
        datetime: '2016-12-23T' + result.activities[0].datetime.substring(11),
        isin: 'GB00B128C026',
        company: 'AIR BERLIN PLC',
        shares: 100,
        price: +Big(51.95).div(100),
        amount: 51.95,
        fee: 0,
        tax: 0,
      });
    });

    test('Can parse 2017_account_statement_1', () => {
      const result = onvista.parsePages(accountStatementSamples[3]);
      expect(result.status).toEqual(5);
      expect(result.activities.length).toEqual(0);
    });

    test('Can parse 2017_account_statement_2', () => {
      const result = onvista.parsePages(accountStatementSamples[4]);
      expect(result.status).toEqual(5);
      expect(result.activities.length).toEqual(0);
    });

    test('Can parse 2020_account_statement_3', () => {
      const result = onvista.parsePages(accountStatementSamples[5]);
      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(7);
      expect(result.activities[0]).toEqual({
        broker: 'onvista',
        type: 'Buy',
        date: '2020-01-06',
        datetime: '2020-01-06T' + result.activities[0].datetime.substring(11),
        isin: 'LU0392494562',
        company: 'COMS.-MSCI WORL.T.U.ETF I',
        shares: 4.1985,
        price: +Big(250).div(4.1985),
        amount: 250,
        fee: 0,
        tax: 0,
      });
      expect(result.activities[6]).toEqual({
        broker: 'onvista',
        type: 'Dividend',
        date: '2020-03-16',
        datetime: '2020-03-16T' + result.activities[0].datetime.substring(11),
        isin: 'DE000A0F5UF5',
        company: 'ISHARES NASDAQ-100 U.ETF',
        shares: 4.9438,
        price: +Big(0.39).div(4.9438),
        amount: 0.39,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Validate all ignored statements', () => {
    test('The statement should be ignored: 2020_cost_information.json', () => {
      const result = onvista.parsePages(ignoredSamples[0]);

      expect(result.status).toEqual(7);
      expect(result.activities.length).toEqual(0);
    });
  });
});
