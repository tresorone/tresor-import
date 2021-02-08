import { findImplementation } from '@/index';
import {
  allSamples,
  dividendSamples,
  depotStatusSamples,
  ignoredSamples,
  transactionLogSamples,
} from './__mocks__/deutscheBank';
import { deutschebank } from '../../src/brokers';

describe('Broker: Deutsche Bank', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can parse all valid Deutsche Bank Samples', () => {
      allSamples.forEach(pages => {
        expect(deutschebank.canParseDocument(pages, 'pdf')).toEqual(true);
      });
    });

    test('Samples can be parsed by Deutsche Bank only!', () => {
      allSamples.forEach(pages => {
        const implementations = findImplementation(pages, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(deutschebank);
      });
    });
  });

  describe('Validate Dividend', () => {
    test('Can the transactions be parsed from: 2020_agnc_invest.json', () => {
      const result = deutschebank.parsePages(dividendSamples[0]);

      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'deutschebank',
        type: 'Dividend',
        date: '2020-01-14',
        datetime: '2020-01-14T' + result.activities[0].datetime.substr(11),
        isin: 'US00123Q1040',
        wkn: 'A2AR58',
        company: 'AGNC INVESTMENT CORP.RG.SH. DL -,001',
        shares: 60,
        price: 0.1435,
        amount: 8.61,
        fee: 0,
        tax: 1.29,
        foreignCurrency: 'USD',
        fxRate: 1.1144,
      });
    });

    test('Can the transactions be parsed from: 2020_johnson_johnson.json', () => {
      const result = deutschebank.parsePages(dividendSamples[1]);

      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(1);
      expect(result.activities[0]).toEqual({
        broker: 'deutschebank',
        type: 'Dividend',
        date: '2020-12-10',
        datetime: '2020-12-10T' + result.activities[0].datetime.substr(11),
        isin: 'US4781601046',
        wkn: '853260',
        company: 'JOHNSON & JOHNSON REGISTERED SHARES DL 1',
        shares: 3.2495,
        price: 0.830897061086321,
        amount: 2.7,
        fee: 0,
        tax: 0.69,
        foreignCurrency: 'USD',
        fxRate: 1.2161,
      });
    });
  });

  describe('Validate Depot Status', () => {
    test('Can the TransferIns be parsed from: 2021_depot_status_standard.json', () => {
      const result = deutschebank.parsePages(depotStatusSamples[0]);

      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(5);
      expect(result.activities[0]).toEqual({
        broker: 'deutschebank',
        type: 'TransferIn',
        date: '2021-01-03',
        datetime: '2021-01-03T12:33:00.000Z',
        wkn: '984811',
        company: 'DWS TOP DIVIDENDE INHABER-ANTEILE LD',
        shares: 3.2861,
        price: 115.35,
        amount: 379.05,
        fee: 0,
        tax: 0,
      });

      expect(result.activities[4]).toEqual({
        broker: 'deutschebank',
        type: 'TransferIn',
        date: '2021-01-03',
        datetime: '2021-01-03T12:33:00.000Z',
        wkn: 'A0RPWJ',
        company: 'ISHSIII-MSCI EM USD(ACC) FUNDS',
        shares: 13.2059,
        price: 34.85558,
        amount: 460.3,
        fee: 0,
        tax: 0,
      });
    });

    test('Can the TransferIns be parsed from: 2021_sepot_status_with_prices.json', () => {
      const result = deutschebank.parsePages(depotStatusSamples[1]);

      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(3);
      expect(result.activities[0]).toEqual({
        broker: 'deutschebank',
        type: 'TransferIn',
        date: '2021-02-06',
        datetime: '2021-02-06T16:25:00.000Z',
        wkn: 'A1XB5U',
        company: 'X(IE)-MSCI WORLD 1C FUNDS',
        shares: 15.902,
        price: 60.62319,
        amount: 1097.48,
        fee: 0,
        tax: 0,
      });

      expect(result.activities[1]).toEqual({
        broker: 'deutschebank',
        type: 'TransferIn',
        date: '2021-02-06',
        datetime: '2021-02-06T16:25:00.000Z',
        wkn: 'A0F5UF',
        company: 'ISHARE.NASDAQ-100 UCITS ETF DE',
        shares: 1.3843,
        price: 102.94734,
        amount: 152.16,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Validate TransactionLog', () => {
    test('Can the Transaction Logs be parsed from: 2020_buy_dividend_transaction_log.json', () => {
      const result = deutschebank.parsePages(transactionLogSamples[0]);

      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(21);
      expect(result.activities[0]).toEqual({
        broker: 'deutschebank',
        type: 'Buy',
        date: '2020-12-23',
        datetime: '2020-12-23T' + result.activities[0].datetime.substr(11),
        wkn: 'A0F5UF',
        company: 'ISHARE.NASDAQ-100 UCITS ETF DE INHABER-ANT.',
        shares: 0.485,
        price: 101.76,
        amount: 50.02,
        fee: 0,
        tax: 0,
      });
    });

    test('Can the Transaction Logs be parsed from: 2019_sell_transaction_log.json', () => {
      const result = deutschebank.parsePages(transactionLogSamples[1]);

      expect(result.status).toEqual(0);
      expect(result.activities.length).toEqual(3);
      expect(result.activities[0]).toEqual({
        broker: 'deutschebank',
        type: 'Sell',
        date: '2019-04-08',
        datetime: '2019-04-08T' + result.activities[0].datetime.substr(11),
        wkn: 'DBX1MW',
        company: 'XTRACKERS MSCI WORLD SWAP INH.ANT.1C O.N.',
        shares: 14,
        price: 54.31,
        amount: 738.94,
        fee: 0,
        tax: 0,
      });

      expect(result.activities[1]).toEqual({
        broker: 'deutschebank',
        type: 'Sell',
        date: '2019-04-08',
        datetime: '2019-04-08T' + result.activities[1].datetime.substr(11),
        wkn: 'DBX1ET',
        company: 'XTRACKERS EURO STOXX 50 INH.ANT. 1C O.N.',
        shares: 14,
        price: 49.34,
        amount: 669.36,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Check unsupported files from Deutsche Bank', () => {
    test('Every unsupported file is marked as such with status code 7', () => {
      ignoredSamples.forEach(sample => {
        expect(deutschebank.parsePages(sample).status).toEqual(7);
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
