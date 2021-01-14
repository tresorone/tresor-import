import { findImplementation } from '@/index';
import { allSamples, dividendSamples, unsupportedSamples } from './__mocks__/deutscheBank';
import {deutschebank} from "../../src/brokers";


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

            expect(result.status).toEqual(0)
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

            expect(result.status).toEqual(0)
            expect(result.activities.length).toEqual(1);
            expect(result.activities[0]).toEqual({
                broker: 'deutschebank',
                type: 'Dividend',
                date: '2020-12-10',
                datetime: '2020-12-10T' + result.activities[0].datetime.substr(11),
                isin: 'US4781601046',
                wkn: '853260',
                company: 'JOHNSON & JOHNSON REGISTERED SHARES DL 1',
                shares: 3.249500,
                price: 0.830897061086321,
                amount: 2.70,
                fee: 0,
                tax: 0.69,
                foreignCurrency: 'USD',
                fxRate: 1.2161,
            });
        });

    });

    describe('Check unsupported files from Deutsche Bank', () =>  {

        test('Every unsupported file is marked as such with status code 7', () => {
            unsupportedSamples.forEach(sample => {
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
