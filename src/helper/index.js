import every from 'lodash/every';
import values from 'lodash/values';

export function csvJSON(csv) {
  var lines = csv.trim().split('\n');

  var result = [];

  // NOTE: If your columns contain commas in their values, you'll need
  // to deal with those before doing the next step
  // (you might convert them to &&& or something, then covert them back later)
  // jsfiddle showing the issue https://jsfiddle.net/
  var headers = lines[0].split(';');

  for (var i = 1; i < lines.length; i++) {
    var obj = {};
    var currentline = lines[i].split(';');

    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentline[j];
    }

    result.push(obj);
  }

  //return result; //JavaScript object
  return JSON.stringify(result); //JSON
}

export function parseGermanNum(n) {
  if (!n) {
    return 0;
  }
  return parseFloat(n.replace(/\./g, '').replace(',', '.'));
}

export function validateActivity(activity) {
  // All fields must have a value unequal undefined
  if (!every(values(activity), a => !!a || a === 0)) {
    console.error(
      'The activity for ' + activity.broker + ' has empty fields.',
      activity
    );
    return undefined;
  }

  // The date must be in the past.
  if (activity.date > new Date()) {
    console.error(
      'The activity for ' + activity.broker + ' has to be in the past.',
      activity
    );
    return undefined;
  }

  // The date must be not older than 1990-01-01
  if (activity.date < new Date(1990, 1, 1)) {
    console.error(
      'The activity for ' + activity.broker + ' is older than 1990-01-01.',
      activity
    );
    return undefined;
  }

  if (Number(activity.shares) !== activity.shares || activity.shares <= 0) {
    console.error(
      'The shares in activity for ' +
        activity.broker +
        ' must be a number greater than 0.',
      activity
    );
    return undefined;
  }

  if (Number(activity.price) !== activity.price || activity.price <= 0) {
    console.error(
      'The price in activity for ' +
        activity.broker +
        ' must be a number greater than 0.',
      activity
    );
    return undefined;
  }

  if (Number(activity.amount) !== activity.amount || activity.amount <= 0) {
    console.error(
      'The amount in activity for ' +
        activity.broker +
        ' must be a number greater than 0.',
      activity
    );
    return undefined;
  }

  if (Number(activity.fee) !== activity.fee || activity.fee < 0) {
    console.error(
      'The fee amount in activity for ' +
        activity.broker +
        ' must be a number greater than 0.',
      activity
    );
    return undefined;
  }

  if (Number(activity.tax) !== activity.tax || activity.tax < 0) {
    console.error(
      'The tax amount in activity for ' +
        activity.broker +
        ' must be a number greater than 0.',
      activity
    );
    return undefined;
  }

  if (!/^([A-Z]{2})([A-Z0-9]{9})([0-9]{1})$/.test(activity.isin)) {
    console.error(
      'The activity ISIN for ' +
        activity.broker +
        " can't be valid with an invalid scheme.",
      activity
    );
    return undefined;
  }

  if (!['Buy', 'Sell', 'Dividend'].includes(activity.type)) {
    console.error(
      'The activity type for ' +
        activity.broker +
        " can't be valid with an unknown type.",
      activity
    );
    return undefined;
  }

  return activity;
}
