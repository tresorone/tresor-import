import { findImplementation } from '../../src';
import * as baaderBank from '../../src/brokers/baaderBank';
import {
  allSamples,
  buySamples,
  sellSamples,
  dividendSamples,
  accountSamples,
} from './__mocks__/baaderbank';

describe('Broker: scalable.capital', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can the document parsed with scalable.capital', () => {
      allSamples.forEach(pages => {
        expect(baaderBank.canParseDocument(pages, 'pdf')).toEqual(true);
      });
    });

    test('Can identify a implementation from the document as scalable.capital', () => {
      allSamples.forEach(pages => {
        const implementations = findImplementation(pages, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(baaderBank);
      });
    });
  });

  describe('Validate buys', () => {
    test('Can the market order be parsed from the document', () => {
      const activities = baaderBank.parsePages(buySamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'scalablecapital',
        type: 'Buy',
        date: '2020-06-22',
        datetime: '2020-06-22T06:23:57.000Z',
        isin: 'LU0392494562',
        company: 'ComStage-MSCI World TRN U.ETF Inhaber-Anteile I o.N.',
        shares: 9,
        price: 55.568,
        amount: 500.11,
        fee: 0,
        tax: 0,
      });
    });

    test('Can the saving plan order be parsed from the document - vanguard', () => {
      const activities = baaderBank.parsePages(buySamples[1]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'scalablecapital',
        type: 'Buy',
        date: '2020-07-07',
        datetime: '2020-07-07T09:00:05.000Z',
        isin: 'IE00B3RBWM25',
        company: 'Vanguard FTSE All-World U.ETF Registered Shares USD Dis.oN',
        shares: 0.635,
        price: 78.68,
        amount: 49.96,
        fee: 0,
        tax: 0,
      });
    });

    test('Can the saving plan order be parsed from the document - comstage', () => {
      const activities = baaderBank.parsePages(buySamples[2]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'scalablecapital',
        type: 'Buy',
        date: '2020-07-07',
        datetime: '2020-07-07T09:00:19.000Z',
        isin: 'LU0392494562',
        company: 'ComStage-MSCI World TRN U.ETF Inhaber-Anteile I o.N.',
        shares: 0.883,
        price: 56.587,
        amount: 49.97,
        fee: 0,
        tax: 0,
      });
    });

    test('Can the limit order be parsed from the document', () => {
      const activities = baaderBank.parsePages(buySamples[3]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'scalablecapital',
        type: 'Buy',
        date: '2020-09-02',
        datetime: '2020-09-02T07:26:30.000Z',
        isin: 'LU0392494562',
        company: 'ComStage-MSCI World TRN U.ETF Inhaber-Anteile I o.N.',
        shares: 13,
        price: 58.558,
        amount: 761.25,
        fee: 0,
        tax: 0,
      });
    });

    test('Can the BioNTech order be parsed from the document of Gratisbroker', () => {
      const activities = baaderBank.parsePages(buySamples[4]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'gratisbroker',
        type: 'Buy',
        date: '2020-10-05',
        datetime: '2020-10-05T06:08:26.000Z',
        isin: 'US09075V1026',
        company: 'BioNTech SE Nam.-Akt.(sp.ADRs)1/o.N.',
        shares: 34,
        price: 63.92,
        amount: 2173.28,
        fee: 0,
        tax: 0,
      });
    });

    test('Can a order made from Oskar be parsed from the document', () => {
      const activities = baaderBank.parsePages(buySamples[5]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'oskar',
        type: 'Buy',
        date: '2020-09-24',
        datetime: '2020-09-24T14:22:19.000Z',
        isin: 'IE00BZ163L38',
        company: 'Vang.USD Em.Mkts Gov.Bd U.ETF Registered Shares USD Dis.oN',
        shares: 0.01,
        price: 43.87,
        amount: 0.44,
        fee: 0,
        tax: 0,
      });
    });

    test('Can a market order made from Oskar be parsed from the document', () => {
      const activities = baaderBank.parsePages(buySamples[6]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'scalablecapital',
        type: 'Buy',
        date: '2020-02-18',
        datetime: '2020-02-18T11:20:41.000Z',
        isin: 'DE000EWG2LD7',
        company: 'Boerse Stuttgart Securities Gold IHS 2017(17/Und)',
        shares: 0.129,
        price: 47.98,
        amount: 6.19,
        fee: 0,
        tax: 0,
      });
    });

    test('Can parse 2021_azioni_nom containing an italian financial tax', () => {
      const activities = baaderBank.parsePages(buySamples[7]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'scalablecapital',
        type: 'Buy',
        date: '2021-01-04',
        datetime: '2021-01-04T09:01:36.000Z',
        isin: 'IT0003128367',
        company: 'ENEL S.p.A. Azioni nom. EO 1',
        shares: 31,
        price: 8.33,
        amount: 258.23,
        fee: 0,
        tax: 0.26,
      });
    });

    test('Can parse 2021 adidas buy for scalable capital', () => {
      const activities = baaderBank.parsePages(buySamples[8]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'scalablecapital',
        type: 'Buy',
        date: '2021-04-19',
        datetime: '2021-04-19T07:17:55.000Z',
        isin: 'DE000A1EWWW0',
        company: 'adidas AG Namens-Aktien o.N.',
        shares: 4,
        price: 279.8,
        amount: 1119.2,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Validate sells', () => {
    test('Can the order be parsed from the document', () => {
      const activities = baaderBank.parsePages(sellSamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'scalablecapital',
        type: 'Sell',
        date: '2020-06-22',
        datetime: '2020-06-22T06:24:26.000Z',
        isin: 'LU0392494562',
        company: 'ComStage-MSCI World TRN U.ETF Inhaber-Anteile I o.N.',
        shares: 9,
        price: 55.477,
        amount: 499.29,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Validate dividends', () => {
    test('Can the etf dividend be parsed from the document', () => {
      const activities = baaderBank.parsePages(dividendSamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'scalablecapital',
        type: 'Dividend',
        date: '2020-08-25',
        datetime: '2020-08-25T' + activities[0].datetime.substring(11),
        isin: 'LU0392494562',
        company: 'ComStage-MSCI World TRN U.ETF Inhaber-Anteile I o.N.',
        shares: 0.883,
        price: 0.918978163729871,
        amount: 0.81,
        fee: 0,
        tax: 0,
      });
    });

    test('Can the stock dividend in USD with withholding taxes be parsed from the document', () => {
      const activities = baaderBank.parsePages(dividendSamples[1]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'scalablecapital',
        type: 'Dividend',
        date: '2020-09-30',
        datetime: '2020-09-30T' + activities[0].datetime.substring(11),
        isin: 'US3765361080',
        company: 'Gladstone Commercial Corp.',
        shares: 33,
        price: 0.10674047097153871,
        amount: 3.52,
        fee: 0,
        tax: 0.92,
      });
    });

    test('Can the stock dividend from Volkswagen with taxes be parsed from the document of Gratisbroker', () => {
      const activities = baaderBank.parsePages(dividendSamples[2]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'gratisbroker',
        type: 'Dividend',
        date: '2020-10-05',
        datetime: '2020-10-05T' + activities[0].datetime.substring(11),
        isin: 'DE0007664039',
        company: 'Volkswagen AG',
        shares: 12,
        price: 4.86,
        amount: 58.32,
        fee: 0,
        tax: 15.38,
      });
    });
  });

  describe('Validate account statements', () => {
    test('Can parse statement: 2020_scalable_buy_dividend', () => {
      const result = baaderBank.parsePages(accountSamples[0]);
      expect(result.status).toEqual(0);

      const activities = result.activities;
      expect(activities.length).toEqual(2);

      expect(activities[0]).toEqual({
        broker: 'scalablecapital',
        type: 'Buy',
        date: '2020-10-06',
        datetime: '2020-10-06T' + activities[0].datetime.substring(11),
        isin: 'IE00B3RBWM25',
        company: 'VANG.FTSE A.-WO.U.ETF DLD',
        shares: 25.265,
        price: 79.16010290916287,
        amount: 1999.98,
        fee: 0,
        tax: 0,
      });
      expect(activities[1]).toEqual({
        broker: 'scalablecapital',
        type: 'Dividend',
        date: '2020-10-07',
        datetime: '2020-10-07T' + activities[1].datetime.substring(11),
        isin: 'IE00B3RBWM25',
        company: 'VANG.FTSE A.-WO.U.ETF DLD',
        shares: 67.613,
        price: 0.30999955629834497,
        amount: 20.96,
        fee: 0,
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
