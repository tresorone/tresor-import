import { findImplementation } from '@/index';
import * as commerzbank from '../../src/brokers/commerzbank';
import {
  allSamples,
  buySamples,
  dividendSamples,
  transactionReport,
  ignoredSamples,
} from './__mocks__/commerzbank';

describe('Broker: commerzbank', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can pdf file be parsed with commerzbank', () => {
      allSamples.forEach(pages => {
        expect(commerzbank.canParseDocument(pages, 'pdf')).toEqual(true);
      });
    });

    test('Can identify a broker from a single page as commerzbank', () => {
      allSamples.forEach(sample => {
        const implementations = findImplementation(sample, 'pdf');
        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(commerzbank);
      });
    });
  });

  describe('Validate buys', () => {
    test('Can a buy order for A1T8FV_1 be parsed', () => {
      const result = commerzbank.parsePages(buySamples[0]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'commerzbank',
        type: 'Buy',
        date: '2020-01-02',
        datetime: '2020-01-02T' + result.activities[0].datetime.substring(11),
        wkn: 'A1T8FV',
        company: 'Vang.FTSE A.-Wo.Hi.Di.Yi.U.ETF',
        shares: 4.76,
        price: 52.62,
        amount: 250.47,
        fee: 0,
        tax: 0,
      });
    });

    test('Can split buy A1JX51 order 1 be parsed', () => {
      const result = commerzbank.parsePages(buySamples[1]);
      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'commerzbank',
        type: 'Buy',
        date: '2020-01-02',
        datetime: '2020-01-02T' + result.activities[0].datetime.substring(11),
        wkn: 'A1JX51',
        company: 'Vanguard FTSE Em.Markets U.ETF',
        shares: 0.906,
        price: 55.68912,
        amount: 50.45,
        fee: 0,
        tax: 0,
      });
    });

    test('Can split buy A1JX51 order 2 be parsed', () => {
      const result = commerzbank.parsePages(buySamples[2]);
      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'commerzbank',
        type: 'Buy',
        date: '2020-01-15',
        datetime: '2020-01-15T' + result.activities[0].datetime.substring(11),
        wkn: 'A1JX51',
        company: 'Vanguard FTSE Em.Markets U.ETF',
        shares: 0.899,
        price: 56.14911,
        amount: 50.48,
        fee: 0,
        tax: 0,
      });
    });

    test('Can split buy A1JX52 order 1 be parsed', () => {
      const result = commerzbank.parsePages(buySamples[3]);
      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'commerzbank',
        type: 'Buy',
        date: '2020-01-02',
        datetime: '2020-01-02T' + result.activities[0].datetime.substring(11),
        wkn: 'A1JX52',
        company: 'Vanguard FTSE All-World U.ETF',
        shares: 2.975,
        price: 84.17887,
        amount: 250.43,
        fee: 0,
        tax: 0,
      });
    });

    test('Can split buy A1JX52 order 2 be parsed', () => {
      const result = commerzbank.parsePages(buySamples[4]);
      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'commerzbank',
        type: 'Buy',
        date: '2020-01-15',
        datetime: '2020-01-15T' + result.activities[0].datetime.substring(11),
        wkn: 'A1JX52',
        company: 'Vanguard FTSE All-World U.ETF',
        shares: 2.949,
        price: 84.94253,
        amount: 250.5,
        fee: 0,
        tax: 0,
      });
    });

    test('Can split buy A1T8FV order 1 be parsed', () => {
      const result = commerzbank.parsePages(buySamples[5]);
      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'commerzbank',
        type: 'Buy',
        date: '2020-01-15',
        datetime: '2020-01-15T' + result.activities[0].datetime.substring(11),
        wkn: 'A1T8FV',
        company: 'Vang.FTSE A.-Wo.Hi.Di.Yi.U.ETF',
        shares: 4.776,
        price: 52.44102,
        amount: 250.46,
        fee: 0,
        tax: 0,
      });
    });

    test('Can split buy for comstage MSCI World be parsed', () => {
      const result = commerzbank.parsePages(buySamples[6]);
      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'commerzbank',
        type: 'Buy',
        date: '2020-11-03',
        datetime: '2020-11-03T' + result.activities[0].datetime.substring(11),
        wkn: 'ETF110',
        company: 'ComStage-MSCI World TRN U.ETF',
        shares: 0.665,
        price: 56.30721,
        amount: 37.44,
        fee: 2.59,
        tax: 0,
      });
    });

    test('Can a savings plan buy for AGIF all be parsed', () => {
      const result = commerzbank.parsePages(buySamples[7]);
      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'commerzbank',
        type: 'Buy',
        date: '2020-11-02',
        datetime: '2020-11-02T' + result.activities[0].datetime.substring(11),
        wkn: 'A2DKAR',
        company: 'AGIF-All.Gl.Artif.Intelligence',
        shares: 0.241,
        price: 212.331,
        amount: 51.17,
        fee: -1.22,
        tax: 0,
      });
    });
  });

  describe('Validate dividends', () => {
    test('Can the dividend for IE00B3RBWM25_1 be parsed', () => {
      const result = commerzbank.parsePages(dividendSamples[0]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'commerzbank',
        type: 'Dividend',
        date: '2020-04-14',
        datetime: '2020-04-14T' + result.activities[0].datetime.substring(11),
        isin: 'IE00B3RBWM25',
        wkn: 'A1JX52',
        company: 'VANG.FTSE A.-WO.U.ETF',
        shares: 57.247,
        price: 0.3745174419620242,
        amount: 21.44,
        fee: 0,
        tax: 3.95,
      });
    });

    test('Can the dividend for IE00B8GKDB10_2 be parsed', () => {
      const result = commerzbank.parsePages(dividendSamples[5]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'commerzbank',
        type: 'Dividend',
        date: '2020-06-26',
        datetime: '2020-06-26T' + result.activities[0].datetime.substring(11),
        isin: 'IE00B8GKDB10',
        wkn: 'A1T8FV',
        company: 'VA.FTSE A.W.H.D.Y.UETFDLD',
        shares: 91.984,
        price: 0.35614889546008,
        amount: 32.76,
        fee: 0,
        tax: 6.04,
      });
    });

    test('Can the foreign dividend for IE00B3RBWM25_1 be parsed', () => {
      const result = commerzbank.parsePages(dividendSamples[6]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'commerzbank',
        type: 'Dividend',
        date: '2020-06-26',
        datetime: '2020-06-26T' + result.activities[0].datetime.substring(11),
        isin: 'IE00B3RBWM25',
        wkn: 'A1JX52',
        company: 'Vanguard FTSE All-World U.ETF',
        shares: 74.93,
        price: 0.33618043507273454,
        amount: 25.19,
        fee: 0,
        tax: 0,
        foreignCurrency: 'USD',
        fxRate: 1.1337,
      });
    });

    test('Can the foreign dividend for IE00B8GKDB10_2 be parsed', () => {
      const result = commerzbank.parsePages(dividendSamples[11]);

      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'commerzbank',
        type: 'Dividend',
        date: '2020-04-14',
        datetime: '2020-04-14T' + result.activities[0].datetime.substring(11),
        isin: 'IE00B8GKDB10',
        wkn: 'A1T8FV',
        company: 'Vang.FTSE A.-Wo.Hi.Di.Yi.U.ETF',
        shares: 60.986,
        price: 0.3658216639884564,
        amount: 22.31,
        fee: 0,
        tax: 0,
        foreignCurrency: 'USD',
        fxRate: 1.0901,
      });
    });
  });

  describe('Validate transaction records', () => {
    test('Can multiple transactions from a transaction record be parsed', () => {
      const result = commerzbank.parsePages(transactionReport[0]);

      expect(result.activities.length).toEqual(43);
      // Buy in home currency
      expect(result.activities[0]).toEqual({
        broker: 'commerzbank',
        type: 'Buy',
        date: '2020-11-18',
        datetime: '2020-11-18T' + result.activities[0].datetime.substring(11),
        isin: 'US69608A1088',
        wkn: 'A2QA4J',
        company: 'PALANTIR TECHNOLOGIES INC',
        shares: 200,
        price: 13.7,
        amount: 2740,
        fee: 15.45,
        tax: 0,
      });
      // Buy in USD which is a foreign currency
      expect(result.activities[3]).toEqual({
        broker: 'commerzbank',
        type: 'Buy',
        date: '2020-11-12',
        datetime: '2020-11-12T' + result.activities[0].datetime.substring(11),
        isin: 'US29786A1060',
        wkn: 'A14P98',
        company: 'ETSY INC. DL-,001',
        shares: 20,
        price: 111.25647778438535,
        amount: 2225.13,
        foreignCurrency: 'USD',
        fxRate: 1.1771,
        fee: 11.9,
        tax: 0,
      });
      // Sell in home currency
      expect(result.activities[9]).toEqual({
        broker: 'commerzbank',
        type: 'Sell',
        date: '2020-11-04',
        datetime: '2020-11-04T' + result.activities[0].datetime.substring(11),
        isin: 'DE000TT3W567',
        wkn: 'TT3W56',
        company: 'HSBC T+B TURBOP DAX',
        shares: 500,
        price: 10.74,
        amount: 5370,
        fee: 0,
        tax: 24.25,
      });
      // Payout in foreign currency (USD)
      expect(result.activities[4]).toEqual({
        broker: 'commerzbank',
        type: 'Dividend',
        date: '2020-11-16',
        datetime: '2020-11-16T' + result.activities[0].datetime.substring(11),
        isin: 'US0378331005',
        wkn: '865985',
        company: 'APPLE INC.',
        shares: 50,
        price: 0.17314189189189189,
        amount: 8.657094594594595,
        foreignCurrency: 'USD',
        fxRate: 1.184,
        fee: 0,
        tax: 1.297094594594595,
      });
      // Payout in home currency (Here EUR)
      expect(result.activities[8]).toEqual({
        broker: 'commerzbank',
        type: 'Dividend',
        date: '2020-11-13',
        datetime: '2020-11-13T' + result.activities[0].datetime.substring(11),
        isin: 'NL0010273215',
        wkn: 'A1J4U4',
        company: 'ASML HOLDING EO -,09',
        shares: 8,
        price: 1.2,
        amount: 9.6,
        fee: 0,
        tax: 1.44,
      });

      /*// TransferIn test
      expect(result.activities[40]).toEqual({
        broker: 'commerzbank',
        type: 'TransferIn',
        date: '2020-09-02',
        isin: 'US88160R1014',
        wkn: 'A1CX3T',
        company: 'TESLA INC. DL -,001',
        shares: 50,
        fee: 0,
        tax: 0,
      });
      // TransferOut; for some reason it contains a fxRate but no price/amount/currency
      expect(result.activities[41]).toEqual({
        broker: 'commerzbank',
        type: 'TransferOut',
        date: '2020-09-02',
        isin: 'US88160R1014',
        wkn: 'A1J4U4',
        company: 'TESLA INC. DL -,001',
        shares: 10,
        fxRate: 1.192,
        fee: 0,
        tax: 0,
      }); */
    });
  });


  describe('Validate all ignored statements', () => {
    test('All ignored statements return status 7 and no activities', () => {
      ignoredSamples.forEach(pages => {
        const result = commerzbank.parsePages(pages);
        expect(result.status).toEqual(7);
        expect(result.activities.length).toEqual(0);
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
