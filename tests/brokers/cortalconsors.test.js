import { findImplementation } from '@/index';
import * as cortalconsors from '../../src/brokers/cortalconsors';
import {
  allSamples,
  buySamples,
  sellSamples,
  dividendSamples,
} from './__mocks__/cortalconsors';

describe('Broker: Cortal Consors', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can one page parsed with cortal consors', () => {
      allSamples.forEach(pages => {
        expect(cortalconsors.canParseDocument(pages, 'pdf')).toEqual(true);
      });
    });

    test('Can identify a broker from one page as cortal consors', () => {
      allSamples.forEach(pages => {
        const implementations = findImplementation(pages, 'pdf');

        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(cortalconsors);
      });
    });
  });

  describe('Buy', () => {
    test('Can parse 2005 Acatis buy', () => {
      const activities = cortalconsors.parsePages(buySamples[0]).activities;

      expect(activities).toEqual([
        {
          broker: 'cortalconsors',
          type: 'Buy',
          date: '2005-10-17',
          datetime: '2005-10-17T' + activities[0].datetime.substr(11),
          wkn: '978174',
          company: 'ACATIS AKT.GLOB.FONDS UI',
          shares: 0.31273,
          price: 163.78345537684265,
          amount: 51.22,
          fee: -1.22,
          tax: 0,
        },
      ]);
    });

    test('Should map the document correctly: 2014_allianz', () => {
      const activities = cortalconsors.parsePages(buySamples[1]).activities;

      expect(activities).toEqual([
        {
          broker: 'cortalconsors',
          type: 'Buy',
          date: '2014-03-07',
          datetime: '2014-03-07T17:20:51.000Z',
          wkn: '840400',
          isin: 'DE0008404005',
          company: 'ALLIANZ SE VNA O.N.',
          shares: 23,
          price: 124.9,
          amount: 2872.7,
          fee: 6.9,
          tax: 0,
        },
      ]);
    });

    test('Should map the document correctly: 2014_ishares_etf_with_commission.json', () => {
      const activities = cortalconsors.parsePages(buySamples[2]).activities;

      expect(activities).toEqual([
        {
          broker: 'cortalconsors',
          type: 'Buy',
          date: '2014-02-17',
          datetime: '2014-02-17T07:02:48.000Z',
          wkn: '251124',
          isin: 'DE0002511243',
          company: 'ISHS-EO CO.BD LA.C.UTS DZ',
          shares: 0.38007,
          price: 129.60770384402872,
          amount: 49.26,
          fee: 0.74,
          tax: 0,
        },
      ]);
    });

    test('Can parse 2007 Acatis buy', () => {
      const activities = cortalconsors.parsePages(buySamples[3]).activities;

      expect(activities).toEqual([
        {
          broker: 'cortalconsors',
          type: 'Buy',
          date: '2007-11-15',
          datetime: '2007-11-15T' + activities[0].datetime.substr(11),
          wkn: '978174',
          company: 'ACATIS AKT. GLO. FDS UI A',
          shares: 0.27399,
          price: 186.94112923829337,
          amount: 51.22,
          fee: -1.22,
          tax: 0,
        },
      ]);
    });
  });

  describe('Sell', () => {
    test('Should map the document correctly: 2014_allianz', () => {
      const activities = cortalconsors.parsePages(sellSamples[0]).activities;

      expect(activities).toEqual([
        {
          broker: 'cortalconsors',
          type: 'Sell',
          date: '2014-12-05',
          datetime: '2014-12-05T20:04:14.000Z',
          wkn: '840400',
          isin: 'DE0008404005',
          company: 'ALLIANZ SE VNA O.N.',
          shares: 23,
          price: 138.15521739130435,
          amount: 3177.57,
          fee: 4.95,
          tax: 77.28,
        },
      ]);
    });
  });

  describe('Dividend', () => {
    test('Should map the document correctly: 2014_allianz', () => {
      const activities = cortalconsors.parsePages(dividendSamples[0])
        .activities;

      expect(activities).toEqual([
        {
          broker: 'cortalconsors',
          type: 'Dividend',
          date: '2014-05-08',
          datetime: '2014-05-08T' + activities[0].datetime.substring(11),
          wkn: '840400',
          company: 'Allianz SE',
          shares: 23,
          price: 5.3,
          amount: 121.9,
          fee: 0,
          tax: 32.15,
        },
      ]);
    });

    test('Should map the document correctly: 2014_etf_x-tracke', () => {
      const activities = cortalconsors.parsePages(dividendSamples[1])
        .activities;

      expect(activities).toEqual([
        {
          broker: 'cortalconsors',
          type: 'Dividend',
          date: '2014-07-31',
          datetime: '2014-07-31T' + activities[0].datetime.substring(11),
          wkn: 'DBX0NH',
          company: 'db x-tracke.DAX U.ETF(DR)-Inc.',
          shares: 7.45056,
          price: 3.469537860241378,
          amount: 25.85,
          fee: 0,
          tax: 0,
        },
      ]);
    });
  });

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
});
