import { parseData } from '@/brokers/traderepublic';

const stockSingleBuy = require('./mocks/traderepublic/buy/single_buy_stock_1.json');
const stockSingleLimitBuy = require('./mocks/traderepublic/buy/single_limit_buy_stock_1.json');
const stockSingleLimitBuyFinancialTransactionTax = require('./mocks/traderepublic/buy/single_limit_buy_stock_financial_transaction_tax_1.json');
const stockSingleLimitBuyWithoutExplicitISIN = require('./mocks/traderepublic/buy/single_limit_buy_stock_no_explicit_isin_1.json');
const etfSavingsPlanBuy = require('./mocks/traderepublic/buy/savings_plan_buy_etf_1.json');
const stockSell = [
  require('./mocks/traderepublic/sell/sell_stock_1.json'),
  require('./mocks/traderepublic/sell/sell_stock_2.json')
];
const stockDividend = [
  require('./mocks/traderepublic/dividend/dividend_1.json'),
  require('./mocks/traderepublic/dividend/dividend_2.json'),
  require('./mocks/traderepublic/dividend/dividend_3.json')
];
const etfDividend = require('./mocks/traderepublic/dividend/earnings_payout_1.json');

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
        price: 5.63,
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
        price: 26.11,
        amount: 35.0,
        fee: 0,
        tax: 0,
      });
    });
  });

  describe('Stock Sell', () => {
    test('should map the pdf data correctly', () => {
      const activity = parseData(stockSell[0]);

      expect(activity).toEqual({
        amount: 2550,
        broker: 'traderepublic',
        company: 'Tesla Inc.',
        date: '2020-02-04',
        fee: 1,
        isin: 'US88160R1014',
        price: 850.0,
        shares: 3,
        tax: 36.47,
        type: 'Sell',
      });
    });

    test('should map the pdf data correctly', () => {
      const activity = parseData(stockSell[1]);

      expect(activity).toEqual({
        amount: 16723.08,
        broker: 'traderepublic',
        company: 'Stryker Corp.',
        date: '2020-07-21',
        fee: 1,
        isin: 'US8636671013',
        price: 168.92,
        shares: 99,
        tax: 52.97,
        type: 'Sell',
      });
    });
  });

  describe('Stock Dividend', () => {
    test('should map the pdf data correctly', () => {
      const activity = parseData(stockDividend[0]);

      expect(activity).toEqual({
        amount: 118.21,
        broker: 'traderepublic',
        company: 'Royal Dutch Shell',
        date: '2020-03-23',
        fee: 0,
        isin: 'GB00B03MLX29',
        price: 0.41929992970035224,
        shares: 382,
        tax: 41.96499384432018,
        type: 'Dividend',
      });
    });

    test('should map the pdf data correctly', () => {
      const activity = parseData(stockDividend[1]);

      expect(activity).toEqual({
        amount: 9.67,
        broker: 'traderepublic',
        company: 'iSh.ST.Eur.Sel.Div.30 U.ETF DE',
        date: '2020-07-15',
        fee: 0,
        isin: 'DE0002635299',
        price: 0.27,
        shares: 43.9634,
        tax: 2.2,
        type: 'Dividend',
      });
    });

    test('should map the pdf data correctly', () => {
      const activity = parseData(stockDividend[2]);

      expect(activity).toEqual({
        amount: 8.34,
        broker: 'traderepublic',
        company: 'iSh.EO ST.Sel.Div.30 U.ETF DE',
        date: '2020-07-15',
        fee: 0,
        isin: 'DE0002635281',
        price: 0.234,
        shares: 43.6532,
        tax: 1.89,
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
        date: '2020-02-26',
        fee: 0,
        isin: 'IE00B1FZS350',
        price: 0.17252514069563613,
        shares: 141,
        tax: 6.81,
        type: 'Dividend',
      });
    });

    test('Should map the pdf data correctly for: Gazprom with third party expenses and withholding tax', () => {
      const activities = traderepublic.parsePages(dividendSamples[4]);

      expect(activities.length).toEqual(1);
      expect(activities[0]).toEqual({
        amount: 12.54,
        broker: 'traderepublic',
        company: 'Gazprom PJSC',
        date: '2020-08-18',
        fee: 0.7582778667116017,
        isin: 'US3682872078',
        price: 0.3479652877243239,
        shares: 45,
        tax: 2.350661386805965,
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
