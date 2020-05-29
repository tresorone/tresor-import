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

    }

describe('Test public functions for Erste Bank Parser', () => {
  test.each(samples.map(samples => [samples, true]))(
    'should be able to parseData from Sample %#',
    (sample, expected) => {
      expect(eb.canParseData(sample)).toEqual(expected);
    }
  );

  test.each(samples.map(samples => [samples, true]))(
    'Should identify Erste Bank as broker from Sample %#',
    sample => {
      expect(getBroker(sample)).toEqual(eb);
    }
  );
});
