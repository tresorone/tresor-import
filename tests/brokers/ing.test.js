import { findImplementation } from '../../src';
import * as ing from '../../src/brokers/ing';
import {
  buySamples,
  sellSamples,
  dividendsSamples,
  invalidSamples,
  paybackSamples,
  depotStatement,
  postboxDepotStatement,
} from './__mocks__/ing';

describe('Broker: ING', () => {
  let consoleErrorSpy;

  const allSamples = buySamples.concat(
    sellSamples,
    dividendsSamples,
    paybackSamples,
    depotStatement
  );

  describe('Check all documents', () => {
    test('Can the document parsed with ING', () => {
      allSamples.forEach(pages => {
        expect(ing.canParseDocument(pages, 'pdf')).toEqual(true);
      });
    });

    test('Can identify a implementation from the document as ING', () => {
      allSamples.forEach(pages => {
        const implementations = findImplementation(pages, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(ing);
      });
    });

    test('Should not identify ing as broker if ing BIC is not present', () => {
      invalidSamples.forEach(pages => {
        const implementations = findImplementation(pages, 'pdf');

        expect(implementations.length).toEqual(0);
      });
    });
  });

  describe('Buy', () => {
    test('Test if buy1 is mapped correctly', () => {
      const activities = ing.parsePages(buySamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Buy',
        date: '2020-03-03',
        datetime: '2020-03-03T16:22:22.000Z',
        isin: 'US5949181045',
        company: 'Microsoft Corp. Registered Shares DL-,00000625',
        shares: 10,
        price: 151.72,
        amount: 1517.2,
        fee: 8.69,
        tax: 0,
      });
    });

    test('Test if buy2 is mapped correctly', () => {
      const activities = ing.parsePages(buySamples[1]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Buy',
        date: '2017-01-10',
        datetime: '2017-01-10T18:54:00.000Z',
        isin: 'US0846707026',
        company: 'Berkshire Hathaway Inc. Reg.Shares B New DL -,00333',
        shares: 5,
        price: 153.48,
        amount: 767.4,
        fee: 9.9,
        tax: 0,
      });
    });

    test('Test if provision-free buy is mapped correctly', () => {
      const activities = ing.parsePages(buySamples[2]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Buy',
        date: '2016-01-22',
        datetime: '2016-01-22T16:47:56.000Z',
        isin: 'US64110L1061',
        company: 'Netflix Inc. Registered Shares DL -,001',
        shares: 11,
        price: 92.09,
        amount: 1012.99,
        fee: 0,
        tax: 0,
      });
    });

    test('Test if investment plan is mapped correctly', () => {
      const activities = ing.parsePages(buySamples[3]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Buy',
        date: '2019-04-15',
        datetime: '2019-04-15T07:04:16.000Z',
        isin: 'LU0274208692',
        company: 'Xtrackers MSCI World Swap Inhaber-Anteile 1C o.N.',
        shares: 4.51124,
        price: 54.464,
        amount: 245.7,
        fee: 4.3,
        tax: 0,
      });
    });

    test('Can parse Buy from 2020 of schroder stock', () => {
      const activities = ing.parsePages(buySamples[4]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Buy',
        date: '2020-12-10',
        datetime: '2020-12-10T' + activities[0].datetime.substring(11),
        isin: 'LU0302446991',
        company: 'Schroder ISF-Gl.Clim.Chan.Equ. Namensanteile B Acc. EUR o.N.',
        shares: 100,
        price: 23.6627,
        amount: 2366.27,
        fee: 0,
        tax: 0,
      });
    });

    test('Can parse savings plan from 2017 of M&G Invest', () => {
      const activities = ing.parsePages(buySamples[5]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Buy',
        date: '2017-12-15',
        datetime: '2017-12-15T' + activities[0].datetime.substring(11),
        isin: 'GB0030932676',
        company: 'M&G Inv.(1)-M&G Global Themes Reg. Shares Euro-Class A o.N.',
        shares: 2.31594,
        price: 34.178576,
        amount: 79.16,
        fee: -4.16,
        tax: 0,
      });
    });

    test('Can parse statement: 2020_ark_etf', () => {
      const activities = ing.parsePages(buySamples[6]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Buy',
        date: '2020-12-29',
        datetime: '2020-12-29T16:52:58.000Z',
        isin: 'US00214Q1040',
        company: 'ARK ETF Trust - Innovation ETF Registered Shares o.N.',
        shares: 11,
        price: 101.86,
        amount: 1120.46,
        fee: 13.6,
        tax: 0,
      });
    });

    test('Can parse statement: 2020_newborn_acquisition', () => {
      const activities = ing.parsePages(buySamples[7]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Buy',
        date: '2020-12-28',
        datetime: '2020-12-28T17:12:00.000Z',
        isin: 'KYG6463T1067',
        company: 'Newborn Acquisition Corp. Registered Shares o.N.',
        shares: 125,
        price: 16.21140859401755,
        amount: 2026.4260742521933,
        fee: 22.47,
        tax: 0,
        fxRate: 1.217661,
        foreignCurrency: 'USD',
      });
    });
  });

  describe('Sell', () => {
    test('Test if sell1 is mapped correctly', () => {
      const activities = ing.parsePages(sellSamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Sell',
        date: '2020-01-14',
        datetime: '2020-01-14T08:03:52.000Z',
        isin: 'FR0010790980',
        company: 'Amundi ETF STOXX Europe 50 Actions au Porteur o.N.',
        shares: 8,
        price: 79.71,
        amount: 637.68,
        fee: 6.49,
        tax: 0,
      });
    });

    test('Test if sell2 is mapped correctly', () => {
      const activities = ing.parsePages(sellSamples[1]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Sell',
        date: '2019-03-06',
        datetime: '2019-03-06T16:21:18.000Z',
        isin: 'US0079031078',
        company: 'Advanced Micro Devices Inc. Registered Shares DL -,01',
        shares: 20,
        price: 20.09,
        amount: 401.8,
        fee: 5.9,
        tax: 0,
      });
    });

    test('Test if sell with taxes is mapped correctly', () => {
      const activities = ing.parsePages(sellSamples[2]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Sell',
        date: '2020-07-21',
        datetime: '2020-07-21T13:59:31.000Z',
        isin: 'US09075V1026',
        company: 'BioNTech SE Nam.-Akt.(sp.ADRs)1/o.N. Nominale',
        shares: 100,
        price: 84,
        amount: 8400,
        fee: 2.9,
        tax: 209.47,
      });
    });

    test('Can parse 2021 morgan stanley document with multiple taxes', () => {
      const result = ing.parsePages(sellSamples[3]);
      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'ing',
        type: 'Sell',
        date: '2021-01-08',
        datetime: '2021-01-08T13:59:58.000Z',
        isin: 'DE000MA0LP65',
        company: 'Morgan Stanley & Co. Intl PLC MiniL O.End E-Wa. Eu 54,96',
        shares: 120,
        price: 10.61,
        amount: 1273.2,
        fee: 11.42,
        tax: 53.23,
      });
    });

    test('Can parse statement: 2020_deutsche_lufthansa', () => {
      const activities = ing.parsePages(sellSamples[4]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Sell',
        date: '2020-12-21',
        datetime: '2020-12-21T08:03:52.000Z',
        isin: 'DE0008232125',
        company: 'Deutsche Lufthansa AG vink.Namens-Aktien o.N.',
        shares: 500,
        price: 9,
        amount: 4500,
        fee: 16.15,
        tax: 156.74,
      });
    });
  });

  describe('Dividend', () => {
    test('Test if dividend1 is mapped correctly', () => {
      const activities = ing.parsePages(dividendsSamples[0]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Dividend',
        date: '2020-03-12',
        datetime: '2020-03-12T' + activities[0].datetime.substring(11),
        isin: 'US5949181045',
        company: 'Microsoft Corp. Registered Shares DL-,00000625',
        shares: 32,
        price: 0.45389737647316397,
        amount: 14.524716047141247,
        fee: 0,
        tax: 2.18,
        foreignCurrency: 'USD',
        fxRate: 1.123602,
      });
    });

    test('Test if dividend2 is mapped correctly', () => {
      const activities = ing.parsePages(dividendsSamples[1]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Dividend',
        date: '2020-03-18',
        datetime: '2020-03-18T' + activities[0].datetime.substring(11),
        isin: 'NL0000388619',
        company: 'Unilever N.V. Aandelen op naam EO -,16',
        shares: 8,
        price: 0.4104,
        amount: 3.28,
        fee: 0,
        tax: 0.49,
      });
    });

    test('Test if dividend3 is mapped correctly', () => {
      const activities = ing.parsePages(dividendsSamples[2]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Dividend',
        date: '2020-05-04',
        datetime: '2020-05-04T' + activities[0].datetime.substring(11),
        isin: 'IE00BZ163G84',
        company: 'Vanguard EUR Corp.Bond U.ETF Registered Shares EUR Dis.oN',
        shares: 29,
        price: 0.020034,
        amount: 0.58,
        fee: 0,
        tax: 0,
      });
    });

    test('Test if dividend4 is mapped correctly', () => {
      const activities = ing.parsePages(dividendsSamples[3]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Dividend',
        date: '2020-04-15',
        datetime: '2020-04-15T' + activities[0].datetime.substring(11),
        isin: 'DE000A0F5UH1',
        company: 'iSh.ST.Gl.Sel.Div.100 U.ETF DE Inhaber-Anteile',
        shares: 34,
        price: 0.177136,
        amount: 6.02,
        fee: 0,
        tax: 0,
      });
    });

    test('Test if dividend5 is mapped correctly', () => {
      const activities = ing.parsePages(dividendsSamples[4]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Dividend',
        date: '2020-04-08',
        datetime: '2020-04-08T' + activities[0].datetime.substring(11),
        isin: 'IE00B3RBWM25',
        company: 'Vanguard FTSE All-World U.ETF Registered Shares USD Dis.oN',
        shares: 270,
        price: 0.37524009432835165,
        amount: 101.31291390424165,
        fee: 0,
        tax: 18.7,
        foreignCurrency: 'USD',
        fxRate: 1.088114,
      });
    });

    test('Test if dividend_etf is mapped correctly', () => {
      const activities = ing.parsePages(dividendsSamples[5]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Dividend',
        date: '2018-08-23',
        datetime: '2018-08-23T' + activities[0].datetime.substring(11),
        isin: 'LU0392494562',
        company: 'ComStage-MSCI World TRN U.ETF Inhaber-Anteile I o.N.',
        shares: 12,
        price: 0.9411004908292431,
        amount: 11.28907259106174,
        fee: 0,
        tax: 0,
        foreignCurrency: 'USD',
        fxRate: 1.1613,
      });
    });

    test('Test if dividend with taxes from a ETF is mapped correctly', () => {
      const activities = ing.parsePages(dividendsSamples[6]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Dividend',
        date: '2020-09-15',
        datetime: '2020-09-15T' + activities[0].datetime.substring(11),
        isin: 'DE0006289382',
        company: 'iSh.DJ Glob.Titans 50 U.ETF DE Inhaber-Anteile',
        shares: 53,
        price: 0.055626,
        amount: 2.95,
        fee: 0,
        tax: 0.54,
      });
    });

    test('Test if dividend with taxes from a stock is mapped correctly', () => {
      const activities = ing.parsePages(dividendsSamples[7]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Dividend',
        date: '2020-09-18',
        datetime: '2020-09-18T' + activities[0].datetime.substring(11),
        isin: 'US94106L1098',
        company: 'Waste Management Inc. (Del.) Registered Shares DL -,01',
        shares: 6,
        price: 0.4608279344592755,
        amount: 2.764967606755653,
        fee: 0,
        tax: 0.7,
        foreignCurrency: 'USD',
        fxRate: 1.182654,
      });
    });

    test('Can parse dividend in HKD from BYD Co Ltd', () => {
      const activities = ing.parsePages(dividendsSamples[8]).activities;

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        broker: 'ing',
        type: 'Dividend',
        date: '2016-12-30',
        datetime: '2016-12-30T' + activities[0].datetime.substring(11),
        isin: 'CNE100000296',
        company: 'BYD Co. Ltd. Registered Shares H YC 1',
        shares: 130,
        price: 0.0508580526359423,
        amount: 6.611716280761334,
        fee: 0,
        tax: 1.7,
        fxRate: 8.262605,
        foreignCurrency: 'HKD',
      });
    });
  });

  describe('Payback', () => {
    test('Can parse a 2021 turbo knockout payback', () => {
      const result = ing.parsePages(paybackSamples[0]);
      expect(result.status).toEqual(0);
      expect(result.activities[0]).toEqual({
        broker: 'ing',
        type: 'Sell',
        date: '2021-01-08',
        datetime: '2021-01-08T' + result.activities[0].datetime.substring(11),
        isin: 'DE000TT5B8L8',
        company: 'HSBC Trinkaus & Burkhardt AG TurboC O.End EO/DL',
        shares: 4000,
        price: 0.001,
        amount: 4,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Depot Statement', () => {
    test('Can parse 2021_ing_depot_statement', () => {
      const result = ing.parsePages(depotStatement[0]);
      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(13);
      expect(result.activities[0]).toEqual({
        broker: 'ing',
        type: 'TransferIn',
        date: '2021-01-18',
        datetime: '2021-01-18T17:20:00.000Z',
        isin: 'US0378331005',
        company: 'APPLE INC.',
        shares: 17,
        price: 105.9,
        amount: 1800.3,
        fee: 0,
        tax: 0,
      });

      expect(result.activities[12]).toEqual({
        broker: 'ing',
        type: 'TransferIn',
        date: '2021-01-18',
        datetime: '2021-01-18T17:20:00.000Z',
        isin: 'IE00BQ70R696',
        company: 'IM-I.NASDAQ BIOTECH A',
        shares: 15,
        price: 42.385333333333335,
        amount: 635.78,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Postbox Depot Statement', () => {
    test('Can parse postboxDepotStatement 1', () => {
      const result = ing.parsePages(postboxDepotStatement[0]);
      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(17);
      expect(result.activities[0]).toEqual({
        broker: 'ing',
        type: 'TransferIn',
        date: '2021-03-31',
        datetime: '2021-03-31T21:59:00.000Z',
        isin: 'US64110L1061',
        company: 'Netflix Inc.',
        shares: 2,
        price: 443.95,
        amount: 887.9,
        fee: 0,
        tax: 0,
      });

      expect(result.activities[13]).toEqual({
        broker: 'ing',
        type: 'TransferIn',
        date: '2021-03-31',
        datetime: '2021-03-31T21:59:00.000Z',
        isin: 'US74767V1098',
        company: 'QuantumScape Corp.',
        shares: 25,
        price: 38.1664,
        amount: 954.16,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Postbox Depot Statement', () => {
    test('Can parse postboxDepotStatement 2', () => {
      const result = ing.parsePages(postboxDepotStatement[1]);
      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(24);
      expect(result.activities[0]).toEqual({
        broker: 'ing',
        type: 'TransferIn',
        date: '2020-12-31',
        datetime: '2020-12-31T22:59:00.000Z',
        isin: 'GB0031215220',
        company: 'Carnival PLC',
        shares: 500,
        price: 15.31,
        amount: 7655,
        fee: 0,
        tax: 0,
      });

      expect(result.activities[5]).toEqual({
        broker: 'ing',
        type: 'TransferIn',
        date: '2020-12-31',
        datetime: '2020-12-31T22:59:00.000Z',
        isin: 'US5949181045',
        company: 'Microsoft Corp.',
        shares: 25,
        price: 182.94,
        amount: 4573.5,
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
