import { parseData, canParseData } from '../../src/brokers/dkb';
import { buySamples, sellSamples, dividendsSamples } from './__mocks__/dkb';

describe('DKB broker', () => {
  let consoleErrorSpy;

  test('should accept Buy, Sell, Div DKB PDFs only', () => {
    expect(canParseData(['BIC BYLADEM1001', 'Dividendengutschrift'])).toEqual(
      true
    );
  });

  test('should not accept any PDFs', () => {
    expect(canParseData(['42'])).toEqual(false);
  });

  test('should validate the result', () => {
    const invalidSample = buySamples[0].filter(item => item !== 'Stück 36');
    const activity = parseData(invalidSample);

    expect(activity).toEqual(undefined);
    expect(console.error).toHaveBeenLastCalledWith(
      'The activity for dkb has empty fields.',
      {
        amount: 4428,
        broker: 'dkb',
        company: 'Kurswert',
        date: '2019-01-25',
        fee: 10,
        isin: null,
        price: 123,
        shares: NaN,
        type: 'Buy',
        tax: 0,
      }
    );
  });

  describe('Buy', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const activity = parseData(buySamples[0]);

      expect(activity).toEqual({
        broker: 'dkb',
        type: 'Buy',
        date: '2019-01-25',
        isin: 'US0378331005',
        company: 'APPLE INC.',
        shares: 36,
        price: 123,
        amount: 4428,
        fee: 10,
        tax: 0,
      });
    });

    test('should map pdf data of sample 2 correctly', () => {
      const activity = parseData(buySamples[1]);

      expect(activity).toEqual({
        broker: 'dkb',
        type: 'Buy',
        date: '2016-10-10',
        isin: 'US88160R1014',
        company: 'TESLA MOTORS INC.',
        shares: 1,
        price: 177.85,
        amount: 177.85,
        fee: 10,
        tax: 0,
      });
    });

    test('should map pdf data of sample 3 correctly', () => {
      const activity = parseData(buySamples[2]);

      expect(activity).toEqual({
        broker: 'dkb',
        type: 'Buy',
        date: '2016-10-18',
        isin: 'LU0302296495',
        company: 'DNB FD-DNB TECHNOLOGY',
        shares: 0.7419,
        price: 353.8346,
        amount: 262.5,
        fee: 1.5,
        tax: 0,
      });
    });
  });

  describe('Sell', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const activity = parseData(sellSamples[0]);

      expect(activity).toEqual({
        broker: 'dkb',
        type: 'Sell',
        date: '2020-01-27',
        isin: 'LU1861132840',
        company: 'AIS - AMUNDI STOXX GL.ART.INT.',
        shares: 36,
        price: 123,
        amount: 4428,
        fee: 10,
        tax: 0,
      });
    });
  });

  describe('Dividend', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const activity = parseData(dividendsSamples[0]);

      expect(activity).toEqual({
        broker: 'dkb',
        type: 'Dividend',
        date: '2020-02-13',
        isin: 'US0378331005',
        company: 'APPLE INC.',
        shares: 36,
        price: 0.7080555555555555,
        amount: 25.49,
        fee: 0,
        tax: 3.82,
      });
    });

    test('should map pdf data of sample 2 correctly', () => {
      const activity = parseData(dividendsSamples[1]);

      expect(activity).toEqual({
        broker: 'dkb',
        type: 'Dividend',
        date: '2016-03-10',
        isin: 'US5949181045',
        company: 'MICROSOFT CORP.',
        shares: 5,
        price: 0.32599999999999996,
        amount: 1.63,
        fee: 0,
        tax: 0.24,
      });
    });
    test('should map pdf data of sample 3 correctly', () => {
      const activity = parseData(dividendsSamples[2]);

      expect(activity).toEqual({
        broker: 'dkb',
        type: 'Dividend',
        date: '2020-04-08',
        isin: 'IE00B3RBWM25',
        company: 'VANGUARD FTSE ALL-WORLD U.ETF',
        shares: 12,
        price: 0.375,
        amount: 4.5,
        fee: 0,
        tax: 0,
      });
    });
    test('should map pdf data of sample 4 correctly', () => {
      const activity = parseData(dividendsSamples[3]);

      expect(activity).toEqual({
        broker: 'dkb',
        type: 'Dividend',
        date: '2020-04-08',
        isin: 'IE00B3RBWM25',
        company: 'VANGUARD FTSE ALL-WORLD U.ETF',
        shares: 12,
        price: 0.375,
        amount: 4.5,
        fee: 0,
        tax: 0.83,
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
