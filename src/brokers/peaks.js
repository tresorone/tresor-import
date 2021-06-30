import {
  createActivityDateTime,
  parseGermanNum,
  validateActivity,
} from '../helper';

const removeUnnecessaryPages = pages => {
  // remove pages until string 'ISIN' is found in an array
  while (!pages[0].some(str => /ISIN/.test(str))) {
    pages.shift();
  }
  // remove last page: glossary
  if (pages[pages.length - 1].some(str => /Glossar/.test(str))) {
    pages.pop();
  }

  return pages;
};

const getType = (type, amount) => {
  if (type === 'Kauf') {
    return 'Buy';
  }
  if (type === 'Verkauf') {
    return 'Sell';
  }
  if (type === 'Unbekannt') {
    if (amount < 0) {
      return 'Sell';
    } else {
      return 'Buy';
    }
  }
};

const formatDate = date => {
  return date.replace(/-/g, '.');
};

const findTransaction = element => {
  // transaction details start with the date entry dd-MM-yyyy
  return /([0-9]{2}-){2}[0-9]{4}/.test(element);
};

const parseNum = n => {
  if (n.charAt(n.length - 3) === '.') {
    return parseFloat(n.replace(',', ''));
  }

  return parseGermanNum(n);
};

const parseShares = s => {
  if (s.includes('.')) {
    return parseFloat(s);
  }

  return parseGermanNum(s);
};

const parseTransaction = (transaction, typeCategory) => {
  let activity = {
    broker: 'peaks',
    fee: 0,
    tax: 0,
  };

  let date = formatDate(transaction[0]);
  let activities = [];

  activity.type = getType(transaction[2], parseNum(transaction[9]));
  [activity.date, activity.datetime] = createActivityDateTime(
    date,
    transaction[1]
  );
  activity.isin = transaction[4];
  activity.company = transaction[3];
  activity.shares = parseShares(transaction[7]);
  activity.price = parseNum(transaction[8]);
  activity.amount = Math.abs(parseNum(transaction[9]));
  if (typeCategory === 'Kosten für Peaks') {
    // fees for the Peaks app are paid through the sale of shares
    activity.fee = activity.amount;
  }
  activities.push(validateActivity(activity));
  if (typeCategory === 'Auszahlung Dividenden') {
    // dividends are reinvested.
    // Copy the activity, set one to 'Dividend' and the other to 'Buy'
    let secondActivity = {};
    Object.assign(secondActivity, activity);
    secondActivity.type = 'Dividend';
    activities.push(validateActivity(secondActivity));
  }

  return activities;
};

export const canParseDocument = (pages, extension) => {
  const firstPageContent = pages[0];
  return (
    extension === 'pdf' &&
    firstPageContent.some(line => line.toLowerCase().includes('peaks'))
  );
};

export const parsePages = contents => {
  let pages = removeUnnecessaryPages(contents);
  let activities = [];
  let typeCategory;

  pages.forEach(page => {
    let index = 0;
    let dateHeaderIndex;

    while (index > -1) {
      index = page.findIndex(findTransaction);
      dateHeaderIndex = page.findIndex(element => {
        return element === 'Datum';
      });

      if (dateHeaderIndex < index && dateHeaderIndex >= 0) {
        typeCategory = page[dateHeaderIndex - 2];
      }
      // remove unnecessary elements
      page.splice(0, index);
      // split up transaction from page
      let transaction = page.splice(0, 10);
      let activity = parseTransaction(transaction, typeCategory);
      activities = activities.concat(activity);
      //activities = activities.flat();
      // find next date entry on page
      index = page.findIndex(findTransaction);
    }
  });

  return { activities, status: 0 };
};
