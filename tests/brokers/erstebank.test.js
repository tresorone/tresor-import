import { getBroker } from '../../src';
import * as eb from '../../src/brokers/erstebank';
import {
  buySamples,
  sellSamples,
  dividendsSamples,
  // invalidSamples,
} from './__mocks__/erstebank';

console.error = jest.fn();

const { isBuy, findISIN, findCompany } = eb.testables;

const samples = buySamples.concat(sellSamples, dividendsSamples);

describe('Test internal functions for Erste Bank Parser', () => {
  test.each(samples.map(samples => [samples, true]))(
    'should identify Buy Statements in Sample %#',
    (sample, expected) => {
      expect(isBuy(sample)).toEqual(expected);
    }
  );

  test('should be able to parseData', () => {
    for (let sample of buySamples.concat(sellSamples, dividendsSamples)) {
      expect(eb.canParseData(sample)).toEqual(true);
    }
  });

  test('Should identify Erste Bank as broker', () => {
    for (let sample of buySamples.concat(sellSamples, dividendsSamples)) {
describe('Test public functions for Erste Bank Parser', () => {
      expect(getBroker(sample)).toEqual(eb);
    }
  });
});
