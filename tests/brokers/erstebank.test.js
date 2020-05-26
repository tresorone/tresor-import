import { getBroker } from '../../src';
import * as eb from '../../src/brokers/erstebank';
import {
  buySamples,
  sellSamples,
  dividendsSamples,
  // invalidSamples,
} from './__mocks__/erstebank';

console.error = jest.fn();

const {isBuy} = eb.testables

describe('Test Erste Bank', () => {
  test('should identify Buy Statements', () => {
    // const sample = buySamples[0];    
    for (let sample of buySamples.concat(sellSamples, dividendsSamples)) {
      expect(isBuy(sample)).toEqual(true);
    }
  });

  test('should be able to parseData', () => {
    for (let sample of buySamples.concat(sellSamples, dividendsSamples)) {
      expect(eb.canParseData(sample)).toEqual(true);
    }
  });

  test('Should identify Erste Bank as broker', () => {
    for (let sample of buySamples.concat(sellSamples, dividendsSamples)) {
      expect(getBroker(sample)).toEqual(eb);
    }
  });
});
