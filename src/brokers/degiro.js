import Big from 'big.js';
import {
  parseGermanNum,
  validateActivity,
  createActivityDateTime,
  isinRegex,
} from '@/helper';

export const canParsePage = (content, extension) =>
  extension === 'pdf' && content.includes('www.degiro.de');

const parseActivity = (content, index) => {
  // Is it possible that the transaction logs contains dividends?

  let span = 0;
  let company = content[index + 2];
  while (!isinRegex.test(content[index + 3 + span]) && span < 5) {
    // It's possible that the name of a company use more than one line. To prevent
    // an infinity loop, we break this after 5 lines we tested for an ISIN.
    company += ' ' + content[index + 3 + span];
    span++;
  }

  const isin = content[index + 3 + span];
  const shares = Big(parseGermanNum(content[index + 5 + span])).abs();
  const amount = Big(parseGermanNum(content[index + 11 + span])).abs();

  const currency = content[index + 6 + span];
  const baseCurrency = content[index + 10 + span];

  let fxRate = undefined;
  if (currency !== baseCurrency) {
    fxRate = parseGermanNum(content[index + 12 + span]);
    // For foreign currency we need to go one line ahead for the following fields.
    span++;
  }

  const type = shares > 0 ? 'Buy' : 'Sell';
  const price = amount.div(shares.abs());
  const fee = Math.abs(parseGermanNum(content[index + 13 + span]));

  const [parsedDate, parsedDateTime] = createActivityDateTime(
    content[index],
    content[index + 1],
    'dd-MM-yyyy',
    'dd-MM-yyyy HH:mm'
  );

  const activity = {
    broker: 'degiro',
    date: parsedDate,
    datetime: parsedDateTime,
    company,
    isin,
    shares: +shares,
    amount: +amount,
    type,
    price: +price,
    fee,
    tax: 0,
  };

  if (fxRate !== undefined) {
    activity.fxRate = fxRate;
  }

  if (currency !== baseCurrency) {
    activity.foreignCurrency = currency;
  }

  return validateActivity(activity);
};

export const parsePages = contents => {
  let activities = [];
  for (let content of contents) {
    let transactionIndex = content.indexOf('Gesamt') + 1;
    while (transactionIndex > 0 && content.length - transactionIndex > 15) {
      // Entries might have a longer length (by 1) if there is a currency rate
      // this checks that the entry is a date in the expected format
      if (!content[transactionIndex].match(/^[0-9]{2}-[0-9]{2}-[0-9]{4}$/)) {
        transactionIndex += 1;
        continue;
      }

      try {
        activities.push(parseActivity(content, transactionIndex));
      } catch (exception) {
        console.error('Error while parsing page (degiro)', exception, content);
      }

      // Always go forward, not only in case of success, to prevent an infinity loop
      // A normal activity w/o currency rates spans 16 lines from date to date, but some have missing
      // lines for fxRate and fee. So we need to check 14 lines ahead (and more) for the next activity.
      transactionIndex += 14;
    }
  }

  return {
    activities,
    status: 0,
  };
};
