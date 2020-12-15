import * as helper from '../../src/helper';

describe('Helper functions', () => {
  let consoleErrorSpy;

  describe('Function: validateActivity', () => {
    test('Is a valid activity with ISIN', () => {
      const activity = {
        broker: 'traderepublic',
        type: 'Sell',
        date: new Date(2000, 1, 1),
        datetime: new Date(),
        isin: 'DETRESOR1042',
        company: 'Tresor 1 Inc.',
        shares: 42,
        price: 42,
        amount: 1764,
        fee: 1,
        tax: 0,
      };

      expect(activity).toEqual(helper.validateActivity(activity));
    });

    test('Is a valid activity with WKN', () => {
      const activity = {
        broker: 'traderepublic',
        type: 'Sell',
        date: new Date(2000, 1, 1),
        datetime: new Date(),
        wkn: 'T10000',
        company: 'Tresor 1 Inc.',
        shares: 42,
        price: 42,
        amount: 1764,
        fee: 1,
        tax: 0,
      };

      expect(activity).toEqual(helper.validateActivity(activity));
    });

    test('Is a valid activity with ISIN and WKN', () => {
      const activity = {
        broker: 'traderepublic',
        type: 'Sell',
        date: new Date(2000, 1, 1),
        datetime: new Date(),
        isin: 'DETRESOR1042',
        wkn: 'T10000',
        company: 'Tresor 1 Inc.',
        shares: 42,
        price: 42,
        amount: 1764,
        fee: 1,
        tax: 0,
      };

      expect(activity).toEqual(helper.validateActivity(activity));
    });

    test('Is a valid activity with a tax return', () => {
      const activity = {
        broker: 'traderepublic',
        type: 'Sell',
        date: new Date(2000, 1, 1),
        datetime: new Date(),
        isin: 'DETRESOR1042',
        wkn: 'T10000',
        company: 'Tresor 1 Inc.',
        shares: 42,
        price: 42,
        amount: 1764,
        fee: 1,
        tax: -200,
      };

      expect(activity).toEqual(helper.validateActivity(activity));
    });

    test('Is a valid activity with a tax payout', () => {
      const activity = {
        broker: 'traderepublic',
        type: 'Sell',
        date: new Date(2000, 1, 1),
        datetime: new Date(),
        isin: 'DETRESOR1042',
        wkn: 'T10000',
        company: 'Tresor 1 Inc.',
        shares: 42,
        price: 42,
        amount: 1764,
        fee: 1,
        tax: 200,
      };

      expect(activity).toEqual(helper.validateActivity(activity));
    });

    test('Activity without broker should be invalid', () => {
      const activity = {
        broker: undefined,
        type: 'Sell',
        date: new Date(2000, 1, 1),
        datetime: new Date(),
        isin: 'DETRESOR1042',
        company: 'Tresor 1 Inc.',
        shares: 42,
        price: 42,
        amount: 1764,
        fee: 1,
        tax: 0,
      };

      expect(helper.validateActivity(activity)).toEqual(undefined);
      expect(console.error).toHaveBeenLastCalledWith(
        'The activity for undefined has empty fields.',
        activity
      );
    });

    test('Activity without type should be invalid', () => {
      const activity = {
        broker: 'traderepublic',
        type: undefined,
        date: new Date(2000, 1, 1),
        datetime: new Date(),
        isin: 'DETRESOR1042',
        company: 'Tresor 1 Inc.',
        shares: 42,
        price: 42,
        amount: 1764,
        fee: 1,
        tax: 0,
      };

      expect(helper.validateActivity(activity)).toEqual(undefined);
      expect(console.error).toHaveBeenLastCalledWith(
        'The activity for traderepublic has empty fields.',
        activity
      );
    });

    test('Activity with a date newer than today should be invalid', () => {
      var today = new Date();

      const activity = {
        broker: 'comdirect',
        type: 'Sell',
        date: today.setDate(today.getDate() + 1),
        datetime: new Date(),
        isin: 'DETRESOR1042',
        company: 'Tresor 1 Inc.',
        shares: 42,
        price: 42,
        amount: 1764,
        fee: 1,
        tax: 0,
      };

      expect(helper.validateActivity(activity)).toEqual(undefined);
      expect(console.error).toHaveBeenLastCalledWith(
        'The activity date for comdirect has to be in the past.',
        activity
      );
    });

    test('Activity with a date older than 1990-01-01 should be invalid', () => {
      var now = new Date();

      const activity = {
        broker: 'comdirect',
        type: 'Sell',
        date: new Date(1989, 12, 31),
        datetime: now,
        isin: 'DETRESOR1042',
        company: 'Tresor 1 Inc.',
        shares: 42,
        price: 42,
        amount: 1764,
        fee: 1,
        tax: 0,
      };

      expect(helper.validateActivity(activity)).toEqual(undefined);
      expect(console.error).toHaveBeenLastCalledWith(
        'The activity date for comdirect is older than 1990-01-01.',
        activity
      );
    });

    test('Activity with a datetime newer than today should be invalid', () => {
      var today = new Date();

      const activity = {
        broker: 'comdirect',
        type: 'Sell',
        date: new Date(),
        datetime: today.setDate(today.getDate() + 1),
        isin: 'DETRESOR1042',
        company: 'Tresor 1 Inc.',
        shares: 42,
        price: 42,
        amount: 1764,
        fee: 1,
        tax: 0,
      };

      expect(helper.validateActivity(activity)).toEqual(undefined);
      expect(console.error).toHaveBeenLastCalledWith(
        'The activity datetime for comdirect has to be in the past.',
        activity
      );
    });

    test('Activity with a datetime older than 1990-01-01 should be invalid', () => {
      const activity = {
        broker: 'comdirect',
        type: 'Sell',
        date: new Date(),
        datetime: new Date(1989, 1, 1),
        isin: 'DETRESOR1042',
        company: 'Tresor 1 Inc.',
        shares: 42,
        price: 42,
        amount: 1764,
        fee: 1,
        tax: 0,
      };

      expect(helper.validateActivity(activity)).toEqual(undefined);
      expect(console.error).toHaveBeenLastCalledWith(
        'The activity datetime for comdirect is older than 1990-01-01.',
        activity
      );
    });

    test('Activity with a negative number of shares should be invalid', () => {
      const activity = {
        broker: 'comdirect',
        type: 'Sell',
        date: new Date(),
        datetime: new Date(),
        isin: 'DETRESOR1042',
        company: 'Tresor 1 Inc.',
        shares: -42,
        price: 42,
        amount: 1764,
        fee: 1,
        tax: 0,
      };

      expect(helper.validateActivity(activity)).toEqual(undefined);
      expect(console.error).toHaveBeenLastCalledWith(
        'The shares in activity for comdirect must be a number greater than 0.',
        activity
      );
    });

    test('Activity with a string value as shares should be invalid', () => {
      const activity = {
        broker: 'comdirect',
        type: 'Sell',
        date: new Date(),
        datetime: new Date(),
        isin: 'DETRESOR1042',
        company: 'Tresor 1 Inc.',
        shares: '42',
        price: 42,
        amount: 1764,
        fee: 1,
        tax: 0,
      };

      expect(helper.validateActivity(activity)).toEqual(undefined);
      expect(console.error).toHaveBeenLastCalledWith(
        'The shares in activity for comdirect must be a number greater than 0.',
        activity
      );
    });

    test('Activity with a negative price per shares should be invalid', () => {
      const activity = {
        broker: 'comdirect',
        type: 'Sell',
        date: new Date(),
        datetime: new Date(),
        isin: 'DETRESOR1042',
        company: 'Tresor 1 Inc.',
        shares: 42,
        price: -42,
        amount: 1764,
        fee: 1,
        tax: 0,
      };

      expect(helper.validateActivity(activity)).toEqual(undefined);
      expect(console.error).toHaveBeenLastCalledWith(
        'The price in activity for comdirect must be a number greater or equal 0.',
        activity
      );
    });

    test('Activity with a string value as price per shares should be invalid', () => {
      const activity = {
        broker: 'comdirect',
        type: 'Sell',
        date: new Date(),
        datetime: new Date(),
        isin: 'DETRESOR1042',
        company: 'Tresor 1 Inc.',
        shares: 42,
        price: '42',
        amount: 1764,
        fee: 1,
        tax: 0,
      };

      expect(helper.validateActivity(activity)).toEqual(undefined);
      expect(console.error).toHaveBeenLastCalledWith(
        'The price in activity for comdirect must be a number greater or equal 0.',
        activity
      );
    });

    test('Activity with a negative amount should be invalid', () => {
      const activity = {
        broker: 'comdirect',
        type: 'Sell',
        date: new Date(),
        datetime: new Date(),
        isin: 'DETRESOR1042',
        company: 'Tresor 1 Inc.',
        shares: 42,
        price: 42,
        amount: -1764,
        fee: 1,
        tax: 0,
      };

      expect(helper.validateActivity(activity)).toEqual(undefined);
      expect(console.error).toHaveBeenLastCalledWith(
        'The amount in activity for comdirect must be a number greater or equal than 0.',
        activity
      );
    });

    test('Activity with a string value as amount should be invalid', () => {
      const activity = {
        broker: 'comdirect',
        type: 'Sell',
        date: new Date(),
        datetime: new Date(),
        isin: 'DETRESOR1042',
        company: 'Tresor 1 Inc.',
        shares: 42,
        price: 42,
        amount: '1764',
        fee: 1,
        tax: 0,
      };

      expect(helper.validateActivity(activity)).toEqual(undefined);
      expect(console.error).toHaveBeenLastCalledWith(
        'The amount in activity for comdirect must be a number greater or equal than 0.',
        activity
      );
    });

    test('Activity with an unknown ISIN sheme should be invalid', () => {
      const activity = {
        broker: 'comdirect',
        type: 'Dividend',
        date: new Date(),
        datetime: new Date(),
        isin: 'DE123456789',
        company: 'Tresor 1 Inc.',
        shares: 42,
        price: 42,
        amount: 1764,
        fee: 1,
        tax: 0,
      };

      expect(helper.validateActivity(activity)).toEqual(undefined);
      expect(console.error).toHaveBeenLastCalledWith(
        "The activity ISIN for comdirect can't be valid with an invalid scheme.",
        activity
      );
    });

    test('Activity with an unknown type should be invalid', () => {
      const activity = {
        broker: 'comdirect',
        type: 'WaynTrain',
        date: new Date(),
        datetime: new Date(),
        isin: 'DETRESOR1042',
        company: 'Tresor 1 Inc.',
        shares: 42,
        price: 42,
        amount: 1764,
        fee: 1,
        tax: 0,
      };

      expect(helper.validateActivity(activity)).toEqual(undefined);
      expect(console.error).toHaveBeenLastCalledWith(
        "The activity type for comdirect can't be valid with an unknown type.",
        activity
      );
    });

    test('Activity with an invalid wkn should be invalid', () => {
      const activity = {
        broker: 'comdirect',
        type: 'Buy',
        date: new Date(),
        datetime: new Date(),
        wkn: 'TRESOR1',
        company: 'Tresor 1 Inc.',
        shares: 42,
        price: 42,
        amount: 1764,
        fee: 1,
        tax: 0,
      };

      expect(helper.validateActivity(activity)).toEqual(undefined);
      expect(console.error).toHaveBeenLastCalledWith(
        "The activity WKN for comdirect can't be valid with an invalid scheme.",
        activity
      );
    });

    test('Activity without an isin or wkn should be invalid', () => {
      const activity = {
        broker: 'comdirect',
        type: 'Buy',
        date: new Date(),
        datetime: new Date(),
        shares: 42,
        price: 42,
        amount: 1764,
        fee: 1,
        tax: 0,
      };

      expect(helper.validateActivity(activity)).toEqual(undefined);
      expect(console.error).toHaveBeenLastCalledWith(
        'The activity for comdirect must have at least an ISIN or WKN.',
        activity
      );
    });

    test('Activity without an company, isin or wkn should be invalid', () => {
      const activity = {
        broker: 'comdirect',
        type: 'Buy',
        date: new Date(),
        datetime: new Date(),
        shares: 42,
        price: 42,
        amount: 1764,
        fee: 1,
        tax: 0,
      };

      expect(helper.validateActivity(activity, true)).toEqual(undefined);
      expect(console.error).toHaveBeenLastCalledWith(
        'The activity for comdirect must have at least a company, ISIN or WKN.',
        activity
      );
    });
  });

  describe('Function: findFirstIsinIndexInArray', () => {
    test('Can find first ISIN in array', () => {
      const testArray = ['foo', 'DE0005140008', 'bar'];
      expect(helper.findFirstIsinIndexInArray(testArray)).toEqual(1);
    });

    test('Can find first ISIN in array when multiple isins are present', () => {
      const testArray = ['foo', 'zap', 'DE0005140008', 'DE0005140009', 'bar'];
      expect(helper.findFirstIsinIndexInArray(testArray)).toEqual(2);
    });

    test('Returns undefined when no ISINs are present', () => {
      const testArray = ['foo', 'bar'];
      expect(helper.findFirstIsinIndexInArray(testArray)).toEqual(undefined);
    });
  });

  describe('Regex: isinRegex works as expected', () => {
    test('Matches for valid ISINs', () => {
      const validIsinValues = ['US0005141111', 'DE0005140008', 'GB0011140008'];
      validIsinValues.forEach(isin =>
        expect(helper.isinRegex.test(isin)).toEqual(true)
      );
    });
    test('Does not match for invalid ISINs', () => {
      const invalidIsinValues = [
        'XX023440008',
        '120005140008',
        '023456708GB',
        '0011140008',
      ];
      invalidIsinValues.forEach(isin =>
        expect(helper.isinRegex.test(isin)).toEqual(false)
      );
    });
  });

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
});
