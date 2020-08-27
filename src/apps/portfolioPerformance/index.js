import format from 'date-fns/format';
import Big from 'big.js';

import { parseGermanNum } from '@/helper';
import { detectLocale, getKeyMap, getTypeMap, keyNormalizer } from './utils';

const activityNormalizer = typeKeyMap => activity => {
  const type = Object.keys(typeKeyMap).find(
    key => typeKeyMap[key] === activity.type
  );
  const normalizedNumericFields = [
    'shares',
    'amount',
    'grossAmount',
    'tax',
    'fee',
    'exchangeRate',
  ].reduce(
    (prev, curr) => ({
      ...prev,
      [curr]: parseGermanNum(activity[curr]),
    }),
    {}
  );

  return {
    ...activity,
    type,
    ...normalizedNumericFields,
    date: format(new Date(activity.date), 'yyyy-MM-dd'),
  };
};

const validateActivity = activity => {
  const supportedTypes = ['Buy', 'Sell', 'Dividend'];

  // Filter "Buy" cash oposite
  if (activity.type === 'Buy' && activity.amount < 0) {
    return [];
  }

  // filter "Sell" cash opposite
  if (activity.type === 'Sell' && activity.amount > 0) {
    return [];
  }

  // transform transferOut to Sell
  if (activity.type === 'transferOut') {
    activity.type = 'Sell';
  }

  // transform transferIn to Buy
  if (activity.type === 'transferIn') {
    activity.type = 'Buy';
  }

  // filter cash movements and other non-supported types
  if (!supportedTypes.includes(activity.type)) {
    return [];
  }

  if (activity.amount <= 0) {
    // remove negative values from sales
    activity.amount = Math.abs(activity.amount);
  }

  // PP exports net amounts for Sales. Add fees and taxes again to it
  // so a sale represents the actual value of the stock once it was sold
  // so shares * price === amount is true
  const bigFee = Big(activity.fee);
  const bigTax = Big(activity.tax);
  const delta = bigFee.plus(bigTax);

  if (activity.type === 'Sell') {
    activity.amount = +Big(activity.amount).plus(delta);
  } else if (activity.type === 'Buy') {
    activity.amount = +Big(activity.amount).minus(delta);
  } else if (activity.type === 'Dividend') {
    activity.amount = +Big(activity.amount).plus(delta);
  }

  // calculate price (Kurs)
  if (activity.shares > 0) {
    activity.price = +Big(activity.amount).div(Big(activity.shares));
  }

  activity.parsed = true;

  return [activity];
};

export const parse = transactions => {
  console.log(`processing ${transactions.length} transactions...`);

  const locale = detectLocale(transactions);
  if (!locale) {
    throw new Error('Locale could not be detected!');
  }

  const keyMap = getKeyMap(locale);
  const typeMap = getTypeMap(locale);
  if (!keyMap || !typeMap) {
    throw new Error(`'${locale}' not yet supported!`);
  }

  const normalizeKeys = keyNormalizer(keyMap);
  const normalizeActivity = activityNormalizer(typeMap);

  const activities = transactions
    .map(normalizeKeys)
    .filter(({ shares }) => shares !== undefined)
    .filter(({ type }) => Boolean(type))
    .map(normalizeActivity)
    .flatMap(validateActivity);

  console.log(`found ${activities.length} valid activities 🎉`);
  console.table(activities);

  return activities;
};
