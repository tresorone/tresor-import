import {
  allImplementations,
  findImplementation,
  parseActivitiesFromPages,
} from '../src';
import * as onvista from '../src/brokers/onvista';

describe('PDF bandler', () => {
  let consoleErrorSpy;

  describe('allImplementations', () => {
    test('All implementations must export (only) the functions canParseDocument and parsePages', () => {
      allImplementations.forEach(implementation => {
        if (implementation !== onvista) {
          // The smartbroker implementation is extending onvista. So it's valid, that onvista exports more than two functions. No check required.
          expect(Object.keys(implementation).length).toEqual(2);
        }

        expect(typeof implementation.canParseDocument).toEqual('function');
        expect(typeof implementation.parsePages).toEqual('function');
      });
    });
  });

  describe('findImplementation', () => {
    test('Should return the matching implementation', () => {
      const implementations = findImplementation(
        [['BIC BYLADEM1001', 'Dividendengutschrift']],
        'pdf'
      );
      expect(implementations.length).toEqual(1);
    });

    test('should return no implementation for invalid content', () => {
      expect(findImplementation([['42']]).length).toEqual(0);
    });

    test('data should return two implementations', () => {
      const data = [
        ['BIC BYLADEM1001', 'Dividendengutschrift', 'comdirect bank'],
      ];
      const dataExtension = 'pdf';

      const implementations = findImplementation(data, dataExtension);
      expect(implementations.length).toEqual(2);
    });
  });

  describe('parseActivitiesFromPages', () => {
    test('data with two implementations should not parse any activities', () => {
      const data = [
        ['BIC BYLADEM1001', 'Dividendengutschrift', 'comdirect bank'],
      ];
      const dataExtension = 'pdf';

      const result = parseActivitiesFromPages(data, dataExtension);
      expect(result.activities).toEqual(undefined);
      expect(result.status).toEqual(2);
    });
  });

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
});
