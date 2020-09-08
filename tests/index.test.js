import { getBroker } from '../src';

describe('PDF bandler', () => {
  let consoleErrorSpy;

  describe('getBroker', () => {
    test('should return the matching broker', () => {
      const broker = getBroker(['BIC BYLADEM1001', 'Dividendengutschrift']);
      expect(typeof broker.parseData).toEqual('function');
    });

    test('should throw when no matcher was found', () => {
      try {
        getBroker(['42']);
      } catch (e) {
        expect(e).toEqual('No supported broker found!');
      }
    });
  });

  test('should throw when more than one matcher was found', () => {
    try {
      getBroker(['BIC BYLADEM1001', 'Dividendengutschrift', 'comdirect bank']);
    } catch (e) {
      expect(e).toEqual('Multiple supported brokers found!');
    }
  });

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
});
