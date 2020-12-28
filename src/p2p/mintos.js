import Big from 'big.js';
import {
  validateActivity,
  createActivityDateTime,
} from '@/helper';

const getType = details => {
	if (details.includes("repurchased") || details.includes("principal")) {
		return "transferOut";
	} else if (details.includes("investment")) {
		return "transferIn";
	} else if (details.includes("interest")) {
		return "Dividend";
	}
}

const normalizeActivity = activity => {
  const [parsedDate, parsedDateTime] = createActivityDateTime(
    activity.Date.substring(0, 10),
    activity.Date.substring(11, 16),
    'yyyy-MM-dd',
    'yyyy-MM-dd HH:mm'
  );

  const amount = +Big(Math.abs(parseFloat(activity.Turnover)));
  activity = {
	broker: 'mintos',
    type: getType(activity.Details),
	shares: 1.,
	amount,
	price: amount,
	company: 'Mintos',
	tax: 0,
	fee: 0,
	foreignCurrency: activity.Currency,
    date: parsedDate,
    datetime: parsedDateTime,
  };

  return activity;
};

const validate = activity => {
  // transform transferOut to Sell
  if (activity.type === 'transferOut') {
    activity.type = 'Sell';
  }

  // transform transferIn to Buy
  if (activity.type === 'transferIn') {
    activity.type = 'Buy';
  }

  // filter cash movements and other non-supported types
  if (!['Buy', 'Sell', 'Dividend'].includes(activity.type)) {
    return [];
  }

  if (activity.amount <= 0) {
    // remove negative values from sales
    activity.amount = Math.abs(activity.amount);
  }

  activity = validateActivity(activity, true);
  if (activity === undefined) {
    return [];
  }

  return [activity];
};

export const canParseFirstPage = (content, extension) =>
  extension === 'csv' &&
  content.some(
    line =>
        line.includes('Date') &&
        line.includes('Transaction ID:') &&
        line.includes('Details') &&
        line.includes('Turnover') &&
        line.includes('Balance') &&
        line.includes('Currency')
  );

export const parsePages = content => {
  if (content.length === 0) {
    return {
      activities: [],
      status: 5,
    };
  }

  const activities = content
    .map(normalizeActivity)
    .flatMap(validate);

  return {
    activities,
    status: 0,
  };
};
