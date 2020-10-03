import * as helper from '../../src/helper';

describe('Heler functions', () => {
  let consoleErrorSpy;

  describe('Function: validateActivity', () => {
    test('Is a valid activity with ISIN', () => {
      const activity = {
        broker: 'traderepublic',
        type: 'Sell',
        date: new Date(2000, 1, 1),
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

    test('Activity without broker should be invalid', () => {
      const activity = {
        broker: undefined,
        type: 'Sell',
        date: new Date(2000, 1, 1),
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
        'The activity for comdirect has to be in the past.',
        activity
      );
    });

    test('Activity with a date older than 1990-01-01 should be invalid', () => {
      const activity = {
        broker: 'comdirect',
        type: 'Sell',
        date: new Date(1989, 12, 31),
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
        'The activity for comdirect is older than 1990-01-01.',
        activity
      );
    });

    test('Activity with a negative number of shares should be invalid', () => {
      const activity = {
        broker: 'comdirect',
        type: 'Sell',
        date: new Date(),
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
        'The price in activity for comdirect must be a number greater than 0.',
        activity
      );
    });

    test('Activity with a string value as price per shares should be invalid', () => {
      const activity = {
        broker: 'comdirect',
        type: 'Sell',
        date: new Date(),
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
        'The price in activity for comdirect must be a number greater than 0.',
        activity
      );
    });

    test('Activity with a negative amount should be invalid', () => {
      const activity = {
        broker: 'comdirect',
        type: 'Sell',
        date: new Date(),
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
        'The amount in activity for comdirect must be a number greater than 0.',
        activity
      );
    });

    test('Activity with a string value as amount should be invalid', () => {
      const activity = {
        broker: 'comdirect',
        type: 'Sell',
        date: new Date(),
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
        'The amount in activity for comdirect must be a number greater than 0.',
        activity
      );
    });

    test('Activity with an unknown ISIN sheme should be invalid', () => {
      const activity = {
        broker: 'comdirect',
        type: 'Dividend',
        date: new Date(),
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

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
});
