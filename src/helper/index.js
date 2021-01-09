import every from 'lodash/every';
import values from 'lodash/values';
import { DateTime } from 'luxon';

// Regex to match an ISIN-only string. The country codes taken from https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2#Decoding_table
export const isinRegex = /^(AA|AB|AC|AD|AE|AF|AG|AH|AI|AJ|AK|AL|AM|AN|AO|AP|AQ|AR|AS|AT|AU|AV|AW|AX|AY|AZ|BA|BB|BC|BD|BE|BF|BG|BH|BI|BJ|BK|BL|BM|BN|BO|BP|BQ|BR|BS|BT|BU|BV|BW|BX|BY|BZ|CA|CB|CC|CD|CE|CF|CG|CH|CI|CJ|CK|CL|CM|CN|CO|CP|CQ|CR|CS|CT|CU|CV|CW|CX|CY|CZ|DA|DB|DC|DD|DE|DF|DG|DH|DI|DJ|DK|DL|DM|DN|DO|DP|DQ|DR|DS|DT|DU|DV|DW|DX|DY|DZ|EA|EB|EC|ED|EE|EF|EG|EH|EI|EJ|EK|EL|EM|EN|EO|EP|EQ|ER|ES|ET|EU|EV|EW|EX|EY|EZ|FA|FB|FC|FD|FE|FF|FG|FH|FI|FJ|FK|FL|FM|FN|FO|FP|FQ|FR|FS|FT|FU|FV|FW|FX|FY|FZ|GA|GB|GC|GD|GE|GF|GG|GH|GI|GJ|GK|GL|GM|GN|GO|GP|GQ|GR|GS|GT|GU|GV|GW|GX|GY|GZ|HA|HB|HC|HD|HE|HF|HG|HH|HI|HJ|HK|HL|HM|HN|HO|HP|HQ|HR|HS|HT|HU|HV|HW|HX|HY|HZ|IA|IB|IC|ID|IE|IF|IG|IH|II|IJ|IK|IL|IM|IN|IO|IP|IQ|IR|IS|IT|IU|IV|IW|IX|IY|IZ|JA|JB|JC|JD|JE|JF|JG|JH|JI|JJ|JK|JL|JM|JN|JO|JP|JQ|JR|JS|JT|JU|JV|JW|JX|JY|JZ|KA|KB|KC|KD|KE|KF|KG|KH|KI|KJ|KK|KL|KM|KN|KO|KP|KQ|KR|KS|KT|KU|KV|KW|KX|KY|KZ|LA|LB|LC|LD|LE|LF|LG|LH|LI|LJ|LK|LL|LM|LN|LO|LP|LQ|LR|LS|LT|LU|LV|LW|LX|LY|LZ|MA|MB|MC|MD|ME|MF|MG|MH|MI|MJ|MK|ML|MM|MN|MO|MP|MQ|MR|MS|MT|MU|MV|MW|MX|MY|MZ|NA|NB|NC|ND|NE|NF|NG|NH|NI|NJ|NK|NL|NM|NN|NO|NP|NQ|NR|NS|NT|NU|NV|NW|NX|NY|NZ|OA|OB|OC|OD|OE|OF|OG|OH|OI|OJ|OK|OL|OM|ON|OO|OP|OQ|OR|OS|OT|OU|OV|OW|OX|OY|OZ|PA|PB|PC|PD|PE|PF|PG|PH|PI|PJ|PK|PL|PM|PN|PO|PP|PQ|PR|PS|PT|PU|PV|PW|PX|PY|PZ|QA|QB|QC|QD|QE|QF|QG|QH|QI|QJ|QK|QL|QM|QN|QO|QP|QQ|QR|QS|QT|QU|QV|QW|QX|QY|QZ|RA|RB|RC|RD|RE|RF|RG|RH|RI|RJ|RK|RL|RM|RN|RO|RP|RQ|RR|RS|RT|RU|RV|RW|RX|RY|RZ|SA|SB|SC|SD|SE|SF|SG|SH|SI|SJ|SK|SL|SM|SN|SO|SP|SQ|SR|SS|ST|SU|SV|SW|SX|SY|SZ|TA|TB|TC|TD|TE|TF|TG|TH|TI|TJ|TK|TL|TM|TN|TO|TP|TQ|TR|TS|TT|TU|TV|TW|TX|TY|TZ|UA|UB|UC|UD|UE|UF|UG|UH|UI|UJ|UK|UL|UM|UN|UO|UP|UQ|UR|US|UT|UU|UV|UW|UX|UY|UZ|VA|VB|VC|VD|VE|VF|VG|VH|VI|VJ|VK|VL|VM|VN|VO|VP|VQ|VR|VS|VT|VU|VV|VW|VX|VY|VZ|WA|WB|WC|WD|WE|WF|WG|WH|WI|WJ|WK|WL|WM|WN|WO|WP|WQ|WR|WS|WT|WU|WV|WW|WX|WY|WZ|XA|XB|XC|XD|XE|XF|XG|XH|XI|XJ|XK|XL|XM|XN|XO|XP|XQ|XR|XS|XT|XU|XV|XW|XX|XY|XZ|YA|YB|YC|YD|YE|YF|YG|YH|YI|YJ|YK|YL|YM|YN|YO|YP|YQ|YR|YS|YT|YU|YV|YW|YX|YY|YZ|ZA|ZB|ZC|ZD|ZE|ZF|ZG|ZH|ZI|ZJ|ZK|ZL|ZM|ZN|ZO|ZP|ZQ|ZR|ZS|ZT|ZU|ZV|ZW|ZX|ZY|ZZ)([0-9A-Z]{9})([0-9])$/;

export const timeRegex = withSeconds => {
  return withSeconds ? /[0-2][0-9]:[0-9]{2}:[0-9]{2}/ : /[0-2][0-9]:[0-9]{2}/;
};

export function csvLinesToJSON(content, trimAndSplit = false) {
  let result = [];

  let lines = content;
  if (trimAndSplit) {
    lines = content.trim().split('\n');
  }

  // NOTE: If your columns contain commas in their values, you'll need
  // to deal with those before doing the next step
  // (you might convert them to &&& or something, then covert them back later)
  // jsfiddle showing the issue https://jsfiddle.net/
  let headers = lines[0].split(';');

  for (let i = 1; i < lines.length; i++) {
    let obj = {};
    const currentline = lines[i].split(';');

    for (let j = 0; j < headers.length; j++) {
      // Some .csv files contains leading/trailing " and spaces. We need to replace the double quote at the beginning an
      // the end to get the real value. E.g.: Value for a Starbucks WKN was in a .csv file "884437 ". T1 was unable to
      // found the Holding by WKN because of the double quote. Also we need to trim spaces.

      if (currentline[j] === undefined) {
        obj[headers[j]] = undefined;
        continue;
      }

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

export function findPreviousRegexMatchIdx(arr, idx, regex) {
  let bckwrdIdx = 1;
  while (idx - bckwrdIdx >= 0) {
    if (regex.test(arr[idx - bckwrdIdx])) {
      return idx - bckwrdIdx;
    }
    bckwrdIdx += 1;
  }
  return -1;
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

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  const oldestDate = new Date(1990, 1, 1);
  oldestDate.setUTCHours(0, 0, 0, 0);

  // The date property must be present.
  if (activity.date === undefined) {
    console.error(
      'The activity date for ' + activity.broker + ' must be present.',
      activity
    );
    return undefined;
  }

  // The datetime property must be present.
  if (activity.datetime === undefined) {
    console.error(
      'The activity datetime for ' + activity.broker + ' must be present.',
      activity
    );
    return undefined;
  }

  // The date must be in the past.
  if (activity.date > tomorrow) {
    console.error(
      'The activity date for ' + activity.broker + ' has to be in the past.',
      activity
    );
    return undefined;
  }

  // The date must be not older than 1990-01-01
  if (activity.date < oldestDate) {
    console.error(
      'The activity date for ' + activity.broker + ' is older than 1990-01-01.',
      activity
    );
    return undefined;
  }

  // The datetime must be in the past.
  if (activity.datetime > tomorrow) {
    console.error(
      'The activity datetime for ' +
        activity.broker +
        ' has to be in the past.',
      activity
    );
    return undefined;
  }

  // The datetime must be not older than 1990-01-01
  if (activity.datetime < oldestDate) {
    console.error(
      'The activity datetime for ' +
        activity.broker +
        ' is older than 1990-01-01.',
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

  if (Number(activity.price) !== activity.price || activity.price < 0) {
    console.error(
      'The price in activity for ' +
        activity.broker +
        ' must be a number greater or equal 0.',
      activity
    );
    return undefined;
  }

  if (Number(activity.amount) !== activity.amount || activity.amount < 0) {
    console.error(
      'The amount in activity for ' +
        activity.broker +
        ' must be a number greater or equal than 0.',
      activity
    );
    return undefined;
  }

  if (Number(activity.fee) !== activity.fee) {
    console.error(
      'The fee amount in activity for ' +
        activity.broker +
        ' must be a number that can be positive, negative or 0. ',
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

  if (activity.isin !== undefined && !isinRegex.test(activity.isin)) {
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

export function findFirstIsinIndexInArray(array, offset = 0) {
  const isinIndex = array
    .slice(offset)
    .findIndex(element => isinRegex.test(element));
  return isinIndex === -1 ? undefined : isinIndex + offset;
}

// This function will convert a date (reuqired) and a time (can be undefined) to a formatted date and datetime.
// When no time is present, the current time will be used to ensure the right order of activities after an import
// was processed.
export function createActivityDateTime(
  date,
  time,
  dateFormat = 'dd.MM.yyyy',
  dateTimeFormat = 'dd.MM.yyyy HH:mm',
  zone = 'Europe/Berlin'
) {
  date = date.trim();
  if (time !== undefined) {
    time = time.trim();
  }
  zone = zone.trim();

  let dateTime;
  if (time === undefined || !/[0-2][0-9]:[0-9]{2}(:[0-9]{2}|)/.test(time)) {
    // Append the current local time when to the date that was given from the implementation. The date must match the
    // format in `dateFormat`.
    const currentTime = DateTime.fromObject({ zone: zone });
    time =
      String(currentTime.hour).padStart(2, '0') +
      ':' +
      String(currentTime.minute).padStart(2, '0');
    dateTime = DateTime.fromFormat(date + ' ' + time, dateFormat + ' HH:mm', {
      zone: zone,
    });
  } else {
    // Convert the date and time from the implementation to a datetime value. The values of date and time must match
    // the given format in `dateTimeFormat` concat with an space between.
    dateTime = DateTime.fromFormat(date + ' ' + time, dateTimeFormat, {
      zone: zone,
    });
  }

  return [dateTime.toFormat('yyyy-MM-dd'), dateTime.toUTC().toISO()];
}
