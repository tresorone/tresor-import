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

  const isin_testcases = [
    [samples[0], 'AT0000A05HR3'],
    [samples[1], 'AT0000A08SH5'],
    [samples[2], 'AT0000660600'],
    [samples[3], 'AT0000707674'],
    [samples[4], 'AT0000A11F86'],
    [samples[5], 'AT0000753504'],
    [samples[6], 'AT0000705678'],
    [samples[7], 'AT0000680970'],
    [samples[8], 'AT0000A296E8'],
  ];
  test.each(isin_testcases)(
    'should be able to findISIN in Sample %#',
    (sample, expected) => {
      expect(findISIN(sample, 1)).toBe(expected);
    }
  );

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
