import { findImplementation } from '../../../src';
import { csvLinesToJSON } from '@/helper';
import glob from 'glob';
import fs from 'fs';
import * as portfolioPerformance from '../../../src/apps/portfolioPerformance';

describe('Portfolio Performance', () => {
  const testCases = glob.sync(`${__dirname}/__mocks__/*.csv`);

  describe('Check all documents', () => {
    test('Can the document parsed with Portfolio Performance', () => {
      testCases.forEach(sample => {
        expect(
          portfolioPerformance.canParseFirstPage(
            readTestFile(sample, false)[0],
            'csv'
          )
        ).toEqual(true);
      });
    });

    test('Can identify a implementation from the document as Portfolio Performance', () => {
      testCases.forEach(sample => {
        const implementations = findImplementation(
          readTestFile(sample, false),
          'csv'
        );

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(portfolioPerformance);
      });
    });
  });

  test.each(testCases)('should parse CSVs correctly: %s', testFile => {
    const activityFile = testFile.replace(/\.csv$/, '.json');
    const expectedActivities = JSON.parse(
      fs.readFileSync(activityFile, 'utf8')
    );

    const result = portfolioPerformance.parsePages(
      readTestFile(testFile, true)
    );

    // uncomment to update expected activities
    // fs.writeFileSync(activityFile, JSON.stringify(result.activities, null, 2));

    expect(result.activities).toMatchObject(expectedActivities);
  });

  const readTestFile = (file, parseAsJson) => {
    const content = fs.readFileSync(file, 'utf8');
    return parseAsJson
      ? JSON.parse(csvLinesToJSON(content, parseAsJson))
      : [content.trim().split('\n')];
  };
});
