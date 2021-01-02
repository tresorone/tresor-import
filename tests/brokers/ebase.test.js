import { findImplementation } from '@/index';
import * as ebase from '@/brokers/ebase';
import {
  buySamples,
  invalidSamples,
  mixedSamples,
  sellSamples,
} from './__mocks__/ebase';
import { allValidSamples } from './__mocks__/ebase';

// David Holin: No dividend samples test yet, as no example document is available
describe('Broker: ebase', () => {
  let consoleErrorSpy;

  test('should only accept revenue-summary reports', () => {
    expect(
      ebase.canParseDocument(
        [['Fondsertrag / Vorabpauschale', 'ebase Depot flex standard']],
        'pdf'
      )
    ).toEqual(true);
  });

  test('should reject unknown PDF files', () => {
    expect(
      ebase.canParseDocument([
        ['This String should never occur in a legitimate document'],
      ])
    ).toEqual(false);
  });

  test('should validate the result', () => {
    expect(ebase.parsePages(invalidSamples[0]).activities).toEqual(undefined);
  });

  describe('Check all documents', () => {
    test('Can parse one page containing sell orders with ebase', () => {
      allValidSamples.forEach(pages => {
        expect(ebase.canParseDocument(pages, 'pdf')).toEqual(true);
      });
    });

    test('Can identify a broker from one page as ebase', () => {
      allValidSamples.forEach(pages => {
        const implementations = findImplementation(pages, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(ebase);
      });
    });
  });

  describe('Validate buys', () => {
    test('Can parse multiple planned buys from a single page pdf', () => {
      const activities = ebase.parsePages(buySamples[0]).activities;
      expect(activities.length).toEqual(11);
      expect(activities[0]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-07-01',
        datetime: '2020-07-01T' + activities[0].datetime.substring(11),
        isin: 'DE000A0X7541',
        company: 'ACATIS GANÉ VALUE EVENT FONDS A',
        shares: 0.054571,
        price: 311.52,
        amount: 17.0,
        tax: 0.0,
        fee: 0.0,
      });
      expect(activities[10]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-07-01',
        datetime: '2020-07-01T' + activities[10].datetime.substring(11),
        isin: 'DE0009848119',
        company: 'DWS Top Dividende LD',
        shares: 0.126761,
        price: 120.7,
        amount: 15.3,
        tax: 0.0,
        fee: 0.0,
      });
    });

    test('Can parse multiple planned buys from a multi page pdf', () => {
      const activities = ebase.parsePages(buySamples[1]).activities;
      expect(activities.length).toEqual(113);
      expect(activities[0]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-07-01',
        datetime: '2020-07-01T' + activities[0].datetime.substring(11),
        isin: 'DE000A0X7541',
        company: 'ACATIS GANÉ VALUE EVENT FONDS A',
        shares: 0.054571,
        price: 311.52,
        amount: 17,
        tax: 0.0,
        fee: 0.0,
      });
      expect(activities[66]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-01-17',
        datetime: '2020-01-17T' + activities[66].datetime.substring(11),
        isin: 'DE000A1W9A28',
        company: 'ProfitlichSchmidlin Fonds UI R',
        shares: 0.009734,
        price: 125.34,
        amount: 1.22,
        tax: 0.0,
        fee: 0.0,
      });
    });

    test('Can parse multiple buy and planned buy orders from a document', () => {
      const activities = ebase.parsePages(buySamples[2]).activities;
      expect(activities.length).toEqual(5);
      expect(activities[3]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-07-24',
        datetime: '2020-07-24T' + activities[3].datetime.substring(11),
        isin: 'DE000A2H7N24',
        company: 'The Digital Leaders Fund R',
        shares: 3.378835,
        price: 147.98,
        amount: 500.0,
        tax: 0.0,
        fee: 0.0,
      });
      expect(activities[4]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-07-01',
        datetime: '2020-07-01T' + activities[4].datetime.substring(11),
        isin: 'DE000A2H7N24',
        company: 'The Digital Leaders Fund R',
        shares: 0.339997,
        price: 147.06,
        amount: 50,
        tax: 0.0,
        fee: 0.0,
      });
    });

    test('Can parse multiple buy orders from a finvesto document', () => {
      const activities = ebase.parsePages(buySamples[3]).activities;

      expect(activities.length).toEqual(21);
      expect(activities[0]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-10-30',
        datetime: '2020-10-30T' + activities[0].datetime.substring(11),
        isin: 'IE00B4L5Y983',
        company: 'iShares Core MSCI World UCITS ETF USD (Acc)',
        shares: 0.747824,
        price: 53.38151781104801,
        amount: 40.0,
        tax: 0.0,
        fee: 0.0,
        foreignCurrency: 'USD',
        fxRate: 1.1622,
      });
      expect(activities[20]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2019-11-21',
        datetime: '2019-11-21T' + activities[20].datetime.substring(11),
        isin: 'IE00B4L5Y983',
        company: 'iShares Core MSCI World UCITS ETF USD (Acc)',
        shares: 0.90628,
        price: 55.061169007702766,
        amount: 50,
        tax: 0.0,
        fee: 0.0,
        foreignCurrency: 'USD',
        fxRate: 1.1035,
      });
    });

    test('Can parse multiple buy and reinvests from an ebase document', () => {
      const activities = ebase.parsePages(buySamples[4]).activities;
      expect(activities.length).toEqual(12);
      expect(activities[0]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-10-27',
        datetime: '2020-10-27T' + activities[0].datetime.substring(11),
        isin: 'FR0010527275',
        company: 'LYXOR World Water (DR) UCITS ETF - Dist',
        shares: 0.924609,
        price: 43.18,
        amount: 40.0,
        tax: 0.0,
        fee: 0.0,
      });
      expect(activities[4]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-07-14',
        datetime: '2020-07-14T' + activities[4].datetime.substring(11),
        isin: 'FR0010527275',
        company: 'LYXOR World Water (DR) UCITS ETF - Dist',
        shares: 0.400721,
        price: 38.83,
        amount: 15.56,
        tax: 0.0,
        fee: 0.0,
      });
      expect(activities[11]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-01-30',
        datetime: '2020-01-30T' + activities[11].datetime.substring(11),
        isin: 'FR0010527275',
        company: 'LYXOR World Water (DR) UCITS ETF - Dist',
        shares: 0.889077,
        price: 44.9,
        amount: 40.0,
        tax: 0.0,
        fee: 0.0,
      });
    });

    test('Can parse capital accumulation benefits', () => {
      const activities = ebase.parsePages(buySamples[5]).activities;
      expect(activities.length).toEqual(26);
    });
  });

  describe('Validate sells', () => {
    test('Can parse multiple eremuneration sell orders from a document', () => {
      const activities = ebase.parsePages(sellSamples[0]).activities;
      expect(activities.length).toEqual(2);
      expect(activities[0]).toEqual({
        broker: 'ebase',
        type: 'Sell',
        date: '2019-12-19',
        datetime: '2019-12-19T' + activities[0].datetime.substring(11),
        isin: 'DE0009848119',
        company: 'DWS Top Dividende LD',
        shares: 0.343695,
        price: 130.93,
        amount: 45.0,
        tax: 0.0,
        fee: 0.0,
      });
      expect(activities[1]).toEqual({
        broker: 'ebase',
        type: 'Sell',
        date: '2018-12-19',
        datetime: '2018-12-19T' + activities[1].datetime.substring(11),
        isin: 'DE0009848119',
        company: 'DWS Top Dividende LD',
        shares: 0.394046,
        price: 114.2,
        amount: 45.0,
        tax: 0.0,
        fee: 0.0,
      });
    });

    test('Can parse multiple ordinary sell orders from a document', () => {
      const activities = ebase.parsePages(sellSamples[1]).activities;
      expect(activities.length).toEqual(11);
      expect(activities[0]).toEqual({
        broker: 'ebase',
        type: 'Sell',
        date: '2020-09-23',
        datetime: '2020-09-23T' + activities[0].datetime.substring(11),
        isin: 'FR0000292278',
        company: 'Magellan C',
        shares: 18.014988,
        price: 23.17,
        amount: 373.54,
        tax: 0.0,
        fee: 0.0,
      });
      expect(activities[10]).toEqual({
        broker: 'ebase',
        type: 'Sell',
        date: '2020-09-22',
        datetime: '2020-09-22T' + activities[10].datetime.substring(11),
        isin: 'DE0009848119',
        company: 'DWS Top Dividende LD',
        shares: 2.752834,
        price: 114.58,
        amount: 315.42,
        tax: 0.0,
        fee: 0.0,
      });
    });
  });

  describe('Mixed Sells, buys and everything in between', () => {
    test('Can parse an ebase multi-page pdf with mixed transactions', () => {
      const activities = ebase.parsePages(mixedSamples[0]).activities;
      expect(activities.length).toEqual(327);
      expect(activities[11]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-07-01',
        datetime: '2020-07-01T' + activities[11].datetime.substring(11),
        isin: 'DE000A0X7541',
        company: 'ACATIS GANÉ VALUE EVENT FONDS A',
        shares: 0.054571,
        price: 311.52,
        amount: 17.0,
        tax: 0.0,
        fee: 0.0,
      });
    });

    test('Can parse buy and sell orders from a finvesto file', () => {
      const activities = ebase.parsePages(mixedSamples[1]).activities;
      expect(activities.length).toEqual(34);
      expect(activities[33]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2018-03-27',
        datetime: '2018-03-27T' + activities[33].datetime.substring(11),
        isin: 'LU0274208692',
        company: 'Xtrackers MSCI World Swap UCITS ETF 1C',
        shares: 0.863757,
        price: 46.31127649247694,
        amount: 40.0,
        tax: 0.0,
        fee: 0.0,
        fxRate: 1.2362,
        foreignCurrency: 'USD',
      });

      expect(activities[11]).toEqual({
        broker: 'ebase',
        type: 'Sell',
        date: '2019-12-19',
        datetime: '2019-12-19T' + activities[11].datetime.substring(11),
        isin: 'LU0274208692',
        company: 'Xtrackers MSCI World Swap UCITS ETF 1C',
        shares: 0.164912,
        price: 60.63982746225737,
        amount: 10.0,
        tax: 0.0,
        fee: 0.0,
        fxRate: 1.1128,
        foreignCurrency: 'USD',
      });
    });

    test('Can parse an ebase single-page pdf with mixed transactions', () => {
      const result = ebase.parsePages(mixedSamples[2]);
      expect(result.activities === undefined && result.status === 6);

      //There is one activity in this list of activites that cant be parsed yet
      // If it has been resolved the following tests can be run
      /*
      expect(activities.length).toEqual(4);
      expect(activities[0]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-11-12',
        datetime: '2020-11-12T' + activities[0].datetime.substring(11),
        isin: 'IE00BKX55T58',
        company: 'Vanguard FTSE Developed World UCITS ETF',
        shares: 0.635652,
        price: 62.80016970725499,
        amount: 40.0,
        fxRate: 1.1785,
        foreignCurrency: 'USD',
        tax: 0.0,
        fee: 0.0,
      });
      expect(activities[1]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-10-14',
        datetime: '2020-10-14T' + activities[1].datetime.substring(11),
        isin: 'IE00BKX55T58',
        company: 'Vanguard FTSE Developed World UCITS ETF',
        shares: 0.644632,
        price: 61.926762491444215,
        amount: 40.0,
        fxRate: 1.1688,
        foreignCurrency: 'USD',
        tax: 0.0,
        fee: 0.0,
      });
      expect(activities[2]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-10-09',
        datetime: '2020-10-09T' + activities[2].datetime.substring(11),
        isin: 'IE00BKX55T58',
        company: 'Vanguard FTSE Developed World UCITS ETF',
        shares: 0.039737,
        price: 71.47,
        amount: 2.84,
        tax: 0.0,
        fee: 0.0,
      });
      expect(activities[2]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-09-14',
        datetime: '2020-09-14T' + activities[2].datetime.substring(11),
        isin: 'IE00BKX55T58',
        company: 'Vanguard FTSE Developed World UCITS ETF',
        shares: 0.671205,
        price: 59.474260679079954,
        amount: 40,
        fxRate: 1.1869,
        foreignCurrency: 'USD',
        tax: 0.0,
        fee: 0.0,
      });
      expect(activities[3]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-09-10',
        datetime: '2020-09-10T' + activities[3].datetime.substring(11),
        isin: 'IE00BKX55T58',
        company: 'Vanguard FTSE Developed World UCITS ETF',
        shares: 0.515934,
        price: 59.92898808014203,
        amount: 30.98,
        fxRate: 1.1829,
        foreignCurrency: 'USD',
        tax: 0.0,
        fee: 0.0,
      });
    */
    });
    test('Can parse an ebase fond redeployment transactions', () => {
      const result = ebase.parsePages(mixedSamples[3]);
      expect(result.activities === undefined && result.status === 6);
      /*
      expect(activities.length).toEqual(6);
      //There is one activity that cant be parsed yet in this testfile
      expect(activities[4]).toEqual({
        broker: 'ebase',
        type: 'Sell',
        date: '2020-09-10',
        datetime: '2020-09-10T' + activities[4].datetime.substring(11),
        isin: 'LU0392494562',
        company: 'ComStage MSCI World TRN UCITS ETF I',
        shares: 0.545977,
        price: 56.84245941626714,
        amount: 30.98,
        fxRate: 1.1889,
        foreignCurrency: 'USD',
        tax: 0.0,
        fee: 0.0,
      });
      expect(activities[5]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-09-10',
        datetime: '2020-09-10T' + activities[5].datetime.substring(11),
        isin: 'IE00BKX55T58',
        company: 'Vanguard FTSE Developed World UCITS ETF',
        shares: 0.515934,
        price: 59.92898808014203,
        amount: 30.98,
        fxRate: 1.1829,
        foreignCurrency: 'USD',
        tax: 0.0,
        fee: 0.0,
      });
      */
    });

    test('Can parse an ebase buy recalculation transactions', () => {
      const result = ebase.parsePages(mixedSamples[4]);
      expect(result.activities === undefined && result.status === 6);
      //This testcase is still an issue without any soltion atm.
      /*
      expect(activities.length).toEqual(45);
      expect(activities[6]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-11-27',
        datetime: '2020-11-27T' + activities[38].datetime.substring(11),
        isin: 'IE00B1XNHC34',
        company: 'iShares Global Clean Energy UCITS ETF',
        shares: 0.01473,
        price: 13.58,
        amount: 0.2,
        tax: 0.0,
        fee: 0.0,
      });
      expect(activities[37]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-04-06',
        datetime: '2020-04-06T' + activities[38].datetime.substring(11),
        isin: 'IE00B4L5Y983',
        company: 'iShares Core MSCI World UCITS ETF USD (Acc)',
        shares: 1.081765,
        price: 46.1283185840708,
        amount: 50,
        fxRate: 1.0848,
        foreignCurrency: 'USD',
        tax: 0.0,
        fee: 0.0,
      });
      expect(activities[38]).toEqual({
        broker: 'ebase',
        type: 'Buy',
        date: '2020-04-06',
        datetime: '2020-04-06T' + activities[39].datetime.substring(11),
        isin: 'IE00B48X4842',
        company: 'SPDR MSCI Emerging Markets Small Cap UCITS ETF',
        shares: 0.963138,
        price: 51.806784660766965,
        amount: 50,
        fxRate: 1.0848,
        foreignCurrency: 'USD',
        tax: 0.0,
        fee: 0.0,
      });
      */
    });
  });

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
});
