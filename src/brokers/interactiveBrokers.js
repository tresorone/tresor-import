export const canParseDocument = (pages, extension) =>
  extension === 'csv' &&
  pages
    .flat()
    .some(
      line =>
        line.includes('Transaktionen,Data,Order,Aktien,') ||
        line.includes('Transactions,Data,Order,Stock,')
    );

const findType = fields => {
  if (fields[16].includes('O')) return 'Buy';
  if (fields[16].includes('C')) return 'Sell';
  return 'Unknown';
};

const findAmount = fields => {
  return parseFloat(fields[13]);
};

const findShares = fields => {
  return parseFloat(fields[8]);
};

const findPrice = fields => {
  return parseFloat(fields[9]);
};
const findSymbol = fields => {
  return fields[5];
};
const findDate = fields => {
  return fields[6].replace(/^"|"$/g, '');
};
const findDatetime = fields => {
  return (
    fields[6].replace(/^"|"$/g, '') +
    'T' +
    fields[7].replace(/^"|"$/g, '').trimStart() +
    '.000Z'
  );
};
const findCurrency = fields => {
  return fields[4];
};
const findFee = fields => {
  return parseFloat(fields[12]);
};

const findActivity = line => {
  let fields = line.split(',');
  let activity = {
    broker: 'interactiveBroker',
    type: '',
    tax: 0,
  };

  activity.type = findType(fields);
  activity.amount = findAmount(fields);
  activity.shares = findShares(fields);
  activity.price = findPrice(fields);
  activity.symbol = findSymbol(fields);
  activity.date = findDate(fields);
  activity.datetime = findDatetime(fields);
  activity.currency = findCurrency(fields);
  activity.fee = findFee(fields);
  activity.company = activity.symbol;
  return activity;
};

export const parsePages = contentOriginal => {
  const content = contentOriginal[0];
  if (content.length === 0) {
    return {
      activities: [],
      status: 5,
    };
  }

  const filteredContent = content.filter(line =>
    line.includes('Transaktionen,Data,Order,Aktien,')
  );
  let activities = [];
  filteredContent.forEach(line => {
    let activity = findActivity(line);
    activities.push(activity);
  });

  return {
    activities,
    status: 0,
  };
};
