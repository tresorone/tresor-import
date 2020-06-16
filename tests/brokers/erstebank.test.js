import { getBroker } from '../../src';
import * as eb from '../../src/brokers/erstebank';
import {
  buySamples,
  sellSamples,
  dividendsSamples,
  // invalidSamples,
} from './__mocks__/erstebank';

console.error = jest.fn();

const {
  isBuy,
  isDividend,
  findISIN,
  findCompany,
  findDateBuySell,
  parseGermanNum,
  findAmount,
  findShares,
  findFee,
  findDividendDate,
  findDividendShares,
  findDividendPayout,
} = eb.testables;

const samples = buySamples.concat(sellSamples, dividendsSamples);

// INTERNAL FUNCTIONS
describe('Test internal functions for Erste Bank Parser', () => {
  const TTisBuy = [
    [samples[0], true],
    [samples[1], true],
    [samples[2], true],
    [samples[3], true],
    [samples[4], true],
    [samples[5], true],
    [samples[6], true],
    [samples[7], true],
    [samples[8], true],
    [samples[9], false],
    [samples[10], false],
    [samples[11], false],
  ];
  test.each(TTisBuy)(
    'should identify Buy Statements in Sample %#',
    (sample, expected) => {
      expect(isBuy(sample)).toEqual(expected);
    }
  );

  const TTisDividend = [
    [samples[0], false],
    [samples[1], false],
    [samples[2], false],
    [samples[3], false],
    [samples[4], false],
    [samples[5], false],
    [samples[6], false],
    [samples[7], false],
    [samples[8], false],
    [samples[9], true],
    [samples[10], true],
    [samples[11], true],
  ];
  test.each(TTisDividend)(
    'should identify Dividend Statements in Sample %#',
    (sample, expected) => {
      expect(isDividend(sample)).toEqual(expected);
    }
  );

  const TTfindISIN = [
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
  test.each(TTfindISIN)(
    'should be able to findISIN in Sample %#',
    (sample, expected) => {
      expect(findISIN(sample, 1)).toBe(expected);
    }
  );

  const TTfindCompany = [
    [samples[0], 'ERSTE BOND EMERGING MARKETS CORPOR.'],
    [samples[1], 'ERSTE IMMOBILIENFONDS'],
    [samples[2], 'ESPA SELECT BOND (T)'],
    [samples[3], 'ESPA BEST OF WORLD'],
    [samples[4], 'YOU INVEST ACTIVE EUR R T'],
    [samples[5], 'ERSTE STOCK TECHNO EUR R T'],
    [samples[6], 'ERSTE WWF STOCK ENV EUR R T'],
    [samples[7], 'ERSTE STOCK EM GLOBAL EUR R T'],
    [samples[8], 'ERSTE FUTURE INVEST EUR R T'],
  ];
  test.each(TTfindCompany)(
    'should be able to findCompany in Sample %#',
    (sample, expected) => {
      expect(findCompany(sample, 1)).toBe(expected);
    }
  );

  const TTparseGermanNum = [
    ['99.735,77', 99735.77],
    ['99.833,64', 99833.64],
    ['123456,50', 123456.5],
    ['90783496', 90783496],
    ['99,495,00', 99.495],
    ['+123456,50', 123456.5],
    ['-123456,50', -123456.5],
    ['123456,50+', 123456.5],
    ['123456,50-', 123456.5],
    ['+ 123456,50', 123456.5],
    ['- 123456,50', -123456.5],
    ['123456,50 +', 123456.5],
    ['123456,50 -', 123456.5],
    ['hallo', NaN],
    ['Tresor', NaN],
  ];
  test.each(TTparseGermanNum)(
    'should be able to parseGermanNum in Sample %#',
    (sample, expected) => {
      expect(parseGermanNum(sample)).toBe(expected);
    }
  );

  const TTfindDateBuySell = [
    [samples[0], '02.03.2017'],
    [samples[1], '01.03.2017'],
    [samples[2], '02.03.2017'],
    [samples[3], '02.03.2017'],
    [samples[4], '12.05.2020'],
    [samples[5], '11.05.2020'],
    [samples[6], '11.05.2020'],
    [samples[7], '12.05.2020'],
    [samples[8], '12.05.2020'],
  ];
  test.each(TTfindDateBuySell)(
    'should be able to findDateBuySell in Sample %#',
    (sample, expected) => {
      expect(findDateBuySell(sample)).toBe(expected);
    }
  );

    [samples[0], 99735.77],
    [samples[1], 99833.64],
    [samples[2], 99637.5],
    [samples[3], 99024.06],
    [samples[4], 97495.0],
    [samples[5], 99001.88],
    [samples[6], 99086.64],
    [samples[7], 9505.9],
    [samples[8], 99289.02],
  const TTfindAmount = [
  ];
  test.each(TTfindAmount)(
    'should be able to findAmount in Sample %#',
    (sample, expected) => {
      expect(findAmount(sample)).toBe(expected);
    }
  );

  test.each(buySamples.map(buySamples => [buySamples, 999.0]))(
    'should find Shares Count in Sample %#',
    (sample, expected) => {
      expect(findShares(sample)).toEqual(expected);
    }
  );

  const TTfindFee = [
    [samples[0], 0],
    [samples[1], 0],
    [samples[2], 0],
    [samples[3], 0],
    [samples[4], 2029.86],
    [samples[5], 360.07],
    [samples[6], 435.12],
    [samples[7], 234.21],
    [samples[8], 550.4],
  ];
  test.each(TTfindFee)('should find fees in Sample %#', (sample, expected) => {
    expect(findFee(sample)).toEqual(expected);
  });

  const TTfindDividendDate = [
    [samples[9], '03.07.2017'],
    [samples[10], '02.07.2018'],
    [samples[11], '01.07.2019'],
  ];
  test.each(TTfindDividendDate)(
    'should be able to findDividendDate in Sample %#',
    (sample, expected) => {
      expect(findDividendDate(sample)).toBe(expected);
    }
  );

  const TTfindDividendShares = [
    [samples[9], 138],
    [samples[10], 138],
    [samples[11], 138],
  ];
  test.each(TTfindDividendShares)(
    'should be able to findDividendShares in Sample %#',
    (sample, expected) => {
      expect(findDividendShares(sample)).toBe(expected);
    }
  );

    [samples[9], 205.11],
    [samples[10], 203.3],
    [samples[11], 202.58],
  const TTfindDividendPayout = [
  ];
  test.each(TTfindDividendPayout)(
    'should be able to findDividendPayout in Sample %#',
    (sample, expected) => {
      expect(findDividendPayout(sample)).toBe(expected);
    }
  );
});

// PUBLIC FUNCTIONS
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
