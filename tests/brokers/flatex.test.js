import { parseData, canParseData } from '../../src/brokers/flatex';
import { buySamples, dividendsSamples } from './__mocks__/flatex';
import Big from "big.js";

describe('Flatex broker', () => {
    let consoleErrorSpy;

    test('should accept Buy, Sell, Div Flatex PDFs only', () => {
        expect(canParseData(['flatex Bank AG', 'Kauf'])).toEqual(true);
        expect(canParseData(['FinTech Group Bank AG', 'Kauf'])).toEqual(true); // old bank name
        expect(canParseData(['flatex Bank AG', 'Verkauf'])).toEqual(true);
        expect(canParseData(['flatex Bank AG', 'Dividendengutschrift'])).toEqual(true);
    });

    test('should not accept any PDFs', () => {
        expect(canParseData(['42'])).toEqual(false);
    });

    // No clue what this does yet, copied from the dkb test
    // test('should validate the result', () => {
    //     const invalidSample = buySamples[0].filter(item => item !== 'Stück 36');
    //     const activity = parseData(invalidSample);
    //
    //     expect(activity).toEqual(undefined);
    //     expect(console.error).toHaveBeenLastCalledWith('Error while parsing PDF', {
    //         amount: 4428,
    //         broker: 'dkb',
    //         company: 'Kurswert',
    //         date: '2019-01-25',
    //         fee: 10,
    //         isin: null,
    //         price: 123,
    //         shares: NaN,
    //         type: 'Buy',
    //     });
    // });

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
                date: '2020-03-05',
                isin: 'US4642863926',
                company: 'ISHS-ISHARES MSCI WLD ETF',
                shares: 20,
                price: 82.4959,
                amount: 1649.92,
                fee: 5.9,
            });

        });

        test('should map pdf data of sample 3 correctly', () => {
            const activity = parseData(buySamples[2]);

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

        test('should map pdf data of sample 5 correctly', () => {

            const activity = parseData(buySamples[4]);

            expect(activity).toEqual({
                broker: 'flatex',
                type: 'Buy',
                date: '2018-04-03',
                isin: 'US88160R1014',
                company: 'TESLA INC.',
                shares: 1,
                price: 207.83,
                amount: 207.83,
                fee: 5.9 + 0.71,
            });
        });
    });

    /*
    TODO: test sell orders
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
                isin: 'US0378331005',
                company: 'APPLE INC.',
                shares: 7,
                amount: 4.96,
                price: 4.96 / 7,
                fee: +Big(4.96).minus(Big(3.60)) // calculate from Bemessungsgrundlage - Endbetrag
            });
        });

        test('should map pdf data of sample 2 correctly', () => {
            const activity = parseData(dividendsSamples[1]);

            // Can add tax here
            expect(activity).toEqual({
                broker: 'flatex',
                type: 'Dividend',
                date: '2019-12-12',
                isin: 'US5949181045',
                company: 'MICROSOFT',
                shares: 16,
                amount: 6.23, // only available in USD, thus using net dividend in EUR
                price: 6.23 / 16,
                fee: 0, // skip bc only available in USD
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