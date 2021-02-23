import { findImplementation } from '../../src';
import * as smartbroker from '../../src/brokers/smartbroker';
import {
  allSamples,
  buySamples,
  sellSamples,
  dividendSamples,
  transferInSamples,
  ignoredSamples,
} from './__mocks__/smartbroker';

describe('Smartbroker broker test', () => {
  let consoleErrorSpy;

  describe('Check all documents', () => {
    test('Can the document parsed with smartbroker', () => {
      allSamples.forEach(pages => {
        expect(smartbroker.canParseDocument(pages, 'pdf')).toEqual(true);
      });
    });

    test('Can identify a implementation from the document as smartbroker', () => {
      allSamples.forEach(sample => {
        const implementations = findImplementation(sample, 'pdf');
        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(smartbroker);
      });
    });
  });

  describe('Buy', () => {
    test('should map pdf data of sample 1 correctly', () => {
      const activities = smartbroker.parsePages(buySamples[0]).activities;

      expect(activities[0]).toEqual({
        broker: 'smartbroker',
        type: 'Buy',
        date: '2020-06-24',
        datetime: '2020-06-24T15:33:00.000Z',
        isin: 'US0028241000',
        company: 'Abbott Laboratories Registered Shares o.N.',
        shares: 14,
        price: 77.86,
        amount: 1090.04,
        fee: 0,
        tax: 0,
      });
    });

    test('should map pdf data of sample 1 correctly', () => {
      const result = smartbroker.parsePages(buySamples[1]);
      expect(result).toEqual({
        status: 0,
        activities: [
          {
            broker: 'smartbroker',
            type: 'Buy',
            date: '2021-02-18',
            datetime: '2021-02-18T08:28:00.000Z',
            isin: 'DE000A0M93V6',
            company: 'Advanced Blockchain AG Inhaber-Aktien o.N.',
            shares: 25,
            price: 20.8,
            amount: 520,
            fee: 6.3,
            tax: 0,
          },
        ],
      });
    });
  });

  describe('Sell', () => {
    test('should map pdf data of sell comission vanguard correctly', () => {
      const activities = smartbroker.parsePages(sellSamples[0]).activities;

      expect(activities[0]).toEqual({
        broker: 'smartbroker',
        type: 'Sell',
        date: '2020-11-05',
        datetime: '2020-11-05T08:48:00.000Z',
        isin: 'IE00B3RBWM25',
        company: 'Vanguard FTSE All-World U.ETF Registered Shares USD Dis.oN',
        shares: 26,
        price: 82.3,
        amount: 2139.8,
        fee: 0,
        tax: 27.57,
      });
    });

    test('Should parse a knocked out turbo from 2021', () => {
      const result = smartbroker.parsePages(sellSamples[1]);

      expect(result).toEqual({
        status: 0,
        activities: [
          {
            broker: 'smartbroker',
            type: 'Sell',
            date: '2021-02-04',
            datetime: '2021-02-04' + result.activities[0].datetime.substr(10),
            isin: 'DE000LS8Z9Z4',
            company: 'Lang & Schwarz AG TurboC O.End XinyiSol 1,8',
            shares: 100,
            price: 0.001,
            amount: 0.1,
            fee: 0,
            tax: -13.16,
          },
        ],
      });
    });

    test('Should parse a goldman Sachs Bayer sell from 2020', () => {
      const result = smartbroker.parsePages(sellSamples[2]);

      expect(result).toEqual({
        status: 0,
        activities: [
          {
            broker: 'smartbroker',
            type: 'Sell',
            date: '2020-12-10',
            datetime: '2020-12-10T16:18:00.000Z',
            isin: 'DE000GF3VUV0',
            company:
              'Goldman Sachs Wertpapier GmbH FaktL O.End Bayer 46,24619999',
            shares: 100,
            price: 0.65,
            amount: 65,
            fee: 4,
            tax: -25.04,
          },
        ],
      });
    });

    test('Should parse a societe generale TUI turbo Sell that contains tax returns', () => {
      const result = smartbroker.parsePages(sellSamples[3]);
      expect(result).toEqual({
        status: 0,
        activities: [
          {
            broker: 'smartbroker',
            type: 'Sell',
            date: '2020-12-09',
            datetime: '2020-12-09' + result.activities[0].datetime.substr(10),
            isin: 'DE000SB73VN1',
            company: 'Société Générale Effekten GmbH TurboL O.End TUI 5,452667',
            shares: 150,
            price: 0.001,
            amount: 0.15,
            fee: 0,
            tax: -17.76,
          },
        ],
      });
    });
  });

  describe('Dividend', () => {
    test('should parse dividend_etf_usd correctly', () => {
      const activities = smartbroker.parsePages(dividendSamples[0]).activities;

      expect(activities[0]).toEqual({
        broker: 'smartbroker',
        type: 'Dividend',
        date: '2020-10-07',
        datetime: '2020-10-07T' + activities[0].datetime.substring(11),
        isin: 'IE00BZ163L38',
        company: 'Vang.USD Em.Mkts Gov.Bd U.ETF Registered Shares USD Dis.oN',
        shares: 445,
        price: 0.16416553710606574,
        amount: 73.05366401219925,
        fee: 0,
        tax: 20.45,
        foreignCurrency: 'USD',
        fxRate: 1.1804,
      });
    });

    test('should parse dividend_stock_usd correctly', () => {
      const activities = smartbroker.parsePages(dividendSamples[1]).activities;

      expect(activities[0]).toEqual({
        broker: 'smartbroker',
        type: 'Dividend',
        date: '2020-09-30',
        datetime: '2020-09-30T' + activities[0].datetime.substring(11),
        isin: 'US7134481081',
        company: 'PepsiCo Inc. Registered Shares DL -,0166',
        shares: 9,
        price: 0.8755030396438052,
        amount: 7.879527356794247,
        fee: 0,
        tax: 2.0716080143847933,
        foreignCurrency: 'USD',
        fxRate: 1.1679,
      });
    });

    test('should parse dividend_stock_usd_2 correctly', () => {
      const activities = smartbroker.parsePages(dividendSamples[2]).activities;

      expect(activities[0]).toEqual({
        broker: 'smartbroker',
        type: 'Dividend',
        date: '2020-10-30',
        datetime: '2020-10-30T' + activities[0].datetime.substring(11),
        isin: 'US5021751020',
        company: 'LTC Properties Inc. Registered Shares DL -,01',
        shares: 32,
        price: 0.16073090263091108,
        amount: 5.143388884189155,
        fee: 0,
        tax: 1.339816428390153,
        foreignCurrency: 'USD',
        fxRate: 1.1821,
      });
    });

    test('Should parse the document correctly: 2020_pan_american_silver', () => {
      const activities = smartbroker.parsePages(dividendSamples[3]).activities;

      expect(activities[0]).toEqual({
        broker: 'smartbroker',
        type: 'Dividend',
        date: '2020-11-27',
        datetime: '2020-11-27T' + activities[0].datetime.substring(11),
        isin: 'CA6979001089',
        company: 'Pan American Silver Corp. Registered Shares o.N.',
        shares: 25,
        price: 0.05879388543591466,
        amount: 1.4698471358978664,
        fee: 0,
        tax: 0.5295615655971779,
        foreignCurrency: 'USD',
        fxRate: 1.1906,
      });
    });

    test('Should parse the document correctly: 2020_ishares_global_clean_energy', () => {
      const activities = smartbroker.parsePages(dividendSamples[4]).activities;

      expect(activities[0]).toEqual({
        broker: 'smartbroker',
        type: 'Dividend',
        date: '2020-11-25',
        datetime: '2020-11-25T' + activities[0].datetime.substring(11),
        isin: 'IE00B1XNHC34',
        company: 'iShsII-Gl.Clean Energy U.ETF Registered Shares o.N.',
        shares: 140,
        price: 0.03461166883689671,
        amount: 4.845633637165539,
        fee: 0,
        tax: 1.09,
        foreignCurrency: 'USD',
        fxRate: 1.19035,
      });
    });

    test('Should parse the document correctly: 2021_ish_eo_st.json', () => {
      const activities = smartbroker.parsePages(dividendSamples[5]).activities;

      expect(activities[0]).toEqual({
        broker: 'smartbroker',
        type: 'Dividend',
        date: '2021-01-15',
        datetime: '2021-01-15T' + activities[0].datetime.substring(11),
        isin: 'DE0002635281',
        company: 'iSh.EO ST.Sel.Div.30 U.ETF DE Inhaber-Anteile',
        shares: 260,
        price: 0.074652,
        amount: 19.40952,
        fee: 0,
        tax: 0,
      });
    });

    test('Should parse the document correctly: 2021_wp_carey_inc.json', () => {
      const activities = smartbroker.parsePages(dividendSamples[6]).activities;

      expect(activities[0]).toEqual({
        broker: 'smartbroker',
        type: 'Dividend',
        date: '2021-01-15',
        datetime: '2021-01-15T' + activities[0].datetime.substring(11),
        isin: 'US92936U1097',
        company: 'W.P. Carey Inc. Registered Shares DL -,01',
        shares: 55,
        price: 0.8531810766721044,
        amount: 46.92495921696574,
        fee: 0,
        tax: 7.039151712887439,
        fxRate: 1.226,
        foreignCurrency: 'USD',
      });
    });

    test('Can parse 2020_realty_income USD dividend', () => {
      const result = smartbroker.parsePages(dividendSamples[7]);
      expect(result).toEqual({
        status: 0,
        activities: [
          {
            broker: 'smartbroker',
            type: 'Dividend',
            date: '2020-12-15',
            datetime: '2020-12-15' + result.activities[0].datetime.substr(10),
            isin: 'US7561091049',
            company: 'Realty Income Corp. Registered Shares DL 1',
            shares: 20,
            price: 0.1923393062633569,
            amount: 3.846786125267138,
            fee: 0,
            tax: 0.5753739930955121,
            fxRate: 1.2166,
            foreignCurrency: 'USD',
          },
        ],
      });
    });
  });

  describe('TransferIn', () => {
    test('Should parse ADO properties TransferIn correctly', () => {
      const result = smartbroker.parsePages(transferInSamples[0]);
      expect(result).toEqual({
        status: 0,
        activities: [
          {
            broker: 'smartbroker',
            type: 'TransferIn',
            date: '2020-07-21',
            datetime: '2020-07-21' + result.activities[0].datetime.substr(10),
            isin: 'LU1250154413',
            company: 'ADO Properties S.A. Actions Nominatives o.N.',
            shares: 5,
            price: 14.6,
            amount: 73,
            fee: 0.5,
            tax: 0,
          },
        ],
      });
    });

    test('Should parse caterpillar TransferIn correctly', () => {
      const result = smartbroker.parsePages(transferInSamples[1]);
      expect(result).toEqual({
        status: 0,
        activities: [
          {
            broker: 'smartbroker',
            type: 'TransferIn',
            date: '2020-03-18',
            datetime: '2020-03-18' + result.activities[0].datetime.substr(10),
            isin: 'US1491231015',
            company: 'Caterpillar Inc. Registered Shares DL 1',
            shares: 2,
            price: 84.49,
            amount: 168.98,
            fee: 9.3,
            tax: 0,
          },
        ],
      });
    });
  });

  describe('Validate all ignored statements', () => {
    test('The statement should be ignored: 2020_cost_information.json', () => {
      ignoredSamples.forEach(pages => {
        expect(smartbroker.parsePages(pages).status).toEqual(7);
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
