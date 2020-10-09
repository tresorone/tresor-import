import every from 'lodash/every';
import values from 'lodash/values';

export function csvLinesToJSON(content, trimAndSplit = false) {
  var result = [];

  let lines = content;
  if (trimAndSplit) {
    lines = content.trim().split('\n');
  }

  // NOTE: If your columns contain commas in their values, you'll need
  // to deal with those before doing the next step
  // (you might convert them to &&& or something, then covert them back later)
  // jsfiddle showing the issue https://jsfiddle.net/
  var headers = lines[0].split(';');

  for (var i = 1; i < lines.length; i++) {
    var obj = {};
    var currentline = lines[i].split(';');

    for (var j = 0; j < headers.length; j++) {
      // Some .csv files contains leading/trailing " and spaces. We need to replace the double quote at the beginning an
      // the end to get the real value. E.g.: Value for a Starbucks WKN was in a .csv file "884437 ". T1 was unable to
      // found the Holding by WKN because of the double quote. Also we need to trim spaces.
      obj[headers[j]] = currentline[j].replace(/^"(.+)"$/, '$1').trim();
    }

    result.push(obj);
  }

  return JSON.stringify(result);
}

export function parseGermanNum(n) {
  if (!n) {
    return 0;
  }
  return parseFloat(n.replace(/\./g, '').replace(',', '.'));
}

export function validateActivity(activity, findSecurityAlsoByCompany = false) {
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

  if (Number(activity.tax) !== activity.tax) {
    console.error(
      'The tax amount in activity for ' +
        activity.broker +
        ' must be a number that can be positive, negative or zero.',
      activity
    );
    return undefined;
  }

  // Tresor One will search the security for PDF Documents with ISIN or WKN. For Imports of .csv File from Portfolio Performance
  // T1 can search the security also by the Company.
  if (
    ((findSecurityAlsoByCompany && activity.company === undefined) ||
      !findSecurityAlsoByCompany) &&
    activity.isin === undefined &&
    activity.wkn === undefined
  ) {
    console.error(
      'The activity for ' +
        activity.broker +
        ' must have at least a' +
        (findSecurityAlsoByCompany ? ' company,' : 'n') +
        ' ISIN or WKN.',
      activity
    );
    return undefined;
  }

  if (
    activity.isin !== undefined &&
    !/^([A-Z]{2})([A-Z0-9]{9})([0-9]{1})$/.test(activity.isin)
  ) {
    console.error(
      'The activity ISIN for ' +
        activity.broker +
        " can't be valid with an invalid scheme.",
      activity
    );
    return undefined;
  }

  if (activity.wkn !== undefined && !/^([A-Z0-9]{6})$/.test(activity.wkn)) {
    console.error(
      'The activity WKN for ' +
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

export function findFirstIsinIndexInArray(array) {
  const regex = /^(AD|AE|AF|AG|AI|AL|AM|AO|AQ|AR|AS|AT|AU|AW|AX|AZ|BA|BB|BD|BE|BF|BG|BH|BI|BJ|BL|BM|BN|BO|BQ|BR|BS|BT|BV|BW|BY|BZ|CA|CC|CD|CF|CG|CH|CI|CK|CL|CM|CN|CO|CR|CU|CV|CW|CX|CY|CZ|DE|DJ|DK|DM|DO|DZ|EC|EE|EG|EH|ER|ES|ET|FI|FJ|FK|FM|FO|FR|GA|GB|GD|GE|GF|GG|GH|GI|GL|GM|GN|GP|GQ|GR|GS|GT|GU|GW|GY|HK|HM|HN|HR|HT|HU|ID|IE|IL|IM|IN|IO|IQ|IR|IS|IT|JE|JM|JO|JP|KE|KG|KH|KI|KM|KN|KP|KR|KW|KY|KZ|LA|LB|LC|LI|LK|LR|LS|LT|LU|LV|LY|MA|MC|MD|ME|MF|MG|MH|MK|ML|MM|MN|MO|MP|MQ|MR|MS|MT|MU|MV|MW|MX|MY|MZ|NA|NC|NE|NF|NG|NI|NL|NO|NP|NR|NU|NZ|OM|PA|PE|PF|PG|PH|PK|PL|PM|PN|PR|PS|PT|PW|PY|QA|RE|RO|RS|RU|RW|SA|SB|SC|SD|SE|SG|SH|SI|SJ|SK|SL|SM|SN|SO|SR|SS|ST|SV|SX|SY|SZ|TC|TD|TF|TG|TH|TJ|TK|TL|TM|TN|TO|TR|TT|TV|TW|TZ|UA|UG|UM|US|UY|UZ|VA|VC|VE|VG|VI|VN|VU|WF|WS|YE|YT|ZA|ZM|ZW)([0-9A-Z]{9})([0-9])$/;
  const isinIndex = array.findIndex(element => regex.test(element));
  return (isinIndex === -1) ? undefined : isinIndex
}