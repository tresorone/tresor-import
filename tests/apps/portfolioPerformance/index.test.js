import { csvJSON } from '@/helper';
import glob from 'glob';
import fs from 'fs';
import { parsePortfolioPerformanceExport } from '../../../src/apps';

// hide table output to be less verbose
global.console.table = () => {};

describe('Portfolio Performance', () => {
  const testCases = glob.sync(`${__dirname}/__mocks__/*.csv`);

  test.each(testCases)('should parse CSVs correctly: %s', testFile => {
    const activityFile = testFile.replace(/\.csv$/, '.json');
    const expectedActivities = JSON.parse(
    fs.readFileSync(activityFile, 'utf8')
    );
    const testData = JSON.parse(csvJSON(fs.readFileSync(testFile, 'utf8')));

    const activities = parsePortfolioPerformanceExport(testData);

    // uncomment to update expected activities
    // fs.writeFileSync(activityFile, JSON.stringify(activities, null, 2));

    expect(activities).toMatchObject(expectedActivities);
  });
});
