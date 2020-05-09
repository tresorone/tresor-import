import { parseData, canParseData } from '../../src/brokers/flatex';
import { buySamples, dividendsSamples } from './__mocks__/flatex';

describe('Flatex broker', () => {
  let consoleErrorSpy;

  test('should accept Buy, Sell, Div Flatex PDFs only', () => {
    expect(canParseData(['flatex Bank AG'])).toEqual(true);
  });

  test('should not accept any PDFs', () => {
    expect(canParseData(['42'])).toEqual(false);
  });

  // No clue what this does yet, copied from the dkb test
  test('should validate the result', () => {
    const invalidSample = buySamples[0].filter(item => item !== 'Stück 36');
    const activity = parseData(invalidSample);

    expect(activity).toEqual(undefined);
    expect(console.error).toHaveBeenLastCalledWith('Error while parsing PDF', {
      amount: 4428,
      broker: 'dkb',
      company: 'Kurswert',
      date: '2019-01-25',
      fee: 10,
      isin: null,
      price: 123,
      shares: NaN,
      type: 'Buy',
    });
  });

  describe('Buy', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const activity = parseData(buySamples[0]);

      expect(activity).toEqual({
        broker: 'flatex',
        type: 'Buy',
        date: '2019-05-16',
        isin: 'US0378331005',
        company: 'APPLE INC.',
        shares: 4,
        price: 170,
        amount: 680,
        fee: 5.9 + 0.85,
      });
    });

    test('should map pdf data of sample 2 correctly', () => {
      const activity = parseData(buySamples[1]);

      expect(activity).toEqual({
        broker: 'flatex',
        type: 'Buy',
        date: '2019-10-17',
        isin: 'US5949181045',
        company: 'MICROSOFT',
        shares: 12,
        price: 125.5,
        amount: 1506,
        fee: 5.9 + 0.85,
      });
    });

    test('should map pdf data of sample 3 correctly', () => {
      const activity = parseData(buySamples[2]);

      expect(activity).toEqual({
        broker: 'flatex',
        type: 'Buy',
        date: '2020-03-05',
        isin: 'US4642863926',
        company: 'ISHS-ISHARES MSCI WLD ETF',
        shares: 20,
        price: 82.4959,
        amount: 1649.92,
        fee: 5.9,
      });
    });
  });

  /*
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
      });
    });
  });
  */

  describe('Dividend', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const activity = parseData(dividendsSamples[0]);

      // Can add tax here
      expect(activity).toEqual({
        broker: 'flatex',
        type: 'Dividend',
        date: '2020-02-13',
        isin: 'US5949181045',
        company: 'MICROSOFT',
        shares: 16,
        price: NaN, // wrong, only available in USD. Can maybe be calculated with the tax
        amount: NaN,
        fee: 0,
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
