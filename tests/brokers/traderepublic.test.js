import { parseData } from '../../src/brokers/traderepublic';

const stockSingleBuy = require('./__mocks__/traderepublic/stock_single_buy.json');
const stockSingleLimitBuy = require('./__mocks__/traderepublic/stock_single_limit_buy.json');
const stockSingleLimitBuyFinancialTransactionTax = require('./__mocks__/traderepublic/stock_single_limit_buy_financial_transaction_tax.json');
const stockSingleLimitBuyWithoutExplicitISIN = require('./__mocks__/traderepublic/stock_single_limit_buy_without_explicit_ISIN.json');
const etfSavingsPlanBuy = require('./__mocks__/traderepublic/etf_savings_plan_buy.json');
const stockSell = require('./__mocks__/traderepublic/stock_sell.json');
const stockDividend = require('./__mocks__/traderepublic/stock_dividend.json');
const etfDividend = require('./__mocks__/traderepublic/etf_dividend.json');

describe('TradeRepublic broker', () => {
  let consoleErrorSpy;

  describe('Stock Single Buy', () => {
    test('should map the pdf data correctly', () => {
      const activity = parseData(stockSingleLimitBuy);

      expect(activity).toEqual({
        broker: 'traderepublic',
        type: 'Buy',
        date: '2020-02-24',
        isin: 'US88160R1014',
        company: 'Tesla Inc.',
        shares: 3,
        price: 768.1,
        amount: 2304.3,
        fee: 1,
        tax: 0,
      });
    });
  });

  describe('Stock Single Limit Buy', () => {
    test('should map the pdf data correctly', () => {
      const activity = parseData(stockSingleBuy);

      expect(activity).toEqual({
        broker: 'traderepublic',
        type: 'Buy',
        date: '2019-11-29',
        isin: 'GB00B03MLX29',
        company: 'Royal Dutch Shell',
        shares: 382,
        price: 26.14,
        amount: 9985.48,
        fee: 1,
        tax: 0,
      });
    });
  });

  describe('Stock Single Buy with financial transaction tax', () => {
    test('should map the pdf data correctly', () => {
      expect(parseData(stockSingleLimitBuyFinancialTransactionTax)).toEqual({
        broker: 'traderepublic',
        type: 'Buy',
        date: '2020-06-09',
        isin: 'FR0000031122',
        company: 'Air France-KLM S.A.',
        shares: 100,
        price: 5.632,
        amount: 563.2,
        fee: 1,
        tax: 1.69,
      });
    });
  });

  describe('Stock Single Limit Buy without explicit ISIN', () => {
    test('should map the pdf data correctly', () => {
      const activity = parseData(stockSingleLimitBuyWithoutExplicitISIN);

      expect(activity).toEqual({
        broker: 'traderepublic',
        type: 'Buy',
        date: '2019-07-19',
        isin: 'DE000SHL1006',
        company: 'Siemens Healthineers AG',
        shares: 14,
        price: 35.7,
        amount: 499.8,
        fee: 1,
        tax: 0,
      });
    });
  });

  describe('ETF Savings Plan Buy', () => {
    test('should map the pdf data correctly', () => {
      const activity = parseData(etfSavingsPlanBuy);

      expect(activity).toEqual({
        broker: 'traderepublic',
        type: 'Buy',
        date: '2020-01-16',
        isin: 'IE00B1YZSC51',
        company: 'iShsII-Core MSCI Europe U.ETF',
        shares: 1.3404,
        price: 26.111608475082065,
        amount: 35.0,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Stock Sell', () => {
    test('should map the pdf data correctly', () => {
      const activity = parseData(stockSell);

      expect(activity).toEqual({
        amount: 2512.53,
        broker: 'traderepublic',
        company: 'Tesla Inc.',
        date: '2020-02-04',
        fee: 1,
        isin: 'US88160R1014',
        price: 837.51,
        shares: 3,
        tax: 36.47,
        type: 'Sell',
      });
    });
  });

  describe('Stock Dividend', () => {
    test('should map the pdf data correctly', () => {
      const activity = parseData(stockDividend);

      expect(activity).toEqual({
        amount: 118.21,
        broker: 'traderepublic',
        company: 'Royal Dutch Shell',
        date: '2020-02-13',
        fee: 0,
        isin: 'GB00B03MLX29',
        price: 0.3094502617801047,
        shares: 382,
        tax: 17.94,
        type: 'Dividend',
      });
    });
  });

  describe('ETF Dividend', () => {
    test('should map the pdf data correctly', () => {
      const activity = parseData(etfDividend);

      expect(activity).toEqual({
        amount: 17.52,
        broker: 'traderepublic',
        company: 'iShsII-Dev.Mkts Prop.Yld U.ETF',
        date: '2020-02-13',
        fee: 0,
        isin: 'IE00B1FZS350',
        price: 0.12425531914893617,
        shares: 141,
        tax: 6.81,
        type: 'Dividend',
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
