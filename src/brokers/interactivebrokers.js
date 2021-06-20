import {
    createActivityDateTime,
    validateActivity,
} from '@/helper';

export const canParseDocument = (pages, extension) => {
    const firstPageContent = pages[0];
    return (
        extension === 'csv' &&
        firstPageContent.includes('Statement,Data,BrokerName,Interactive Brokers') &&
        getDocumentType(firstPageContent) !== DocumentType.Unsupported
    );
};

export const parsePages = pages => {
    const allPages = pages.flat();
    const typeOfDocument = getDocumentType(allPages);

    switch (typeOfDocument) {
        case DocumentType.Unsupported:
            // We know this type and we don't want to support it.
            return {
                activities: [],
                status: 7,
            };
        case DocumentType.ActivityStatement:
            return {
                activities: parseActivityStatement(allPages),
                status: 0,
            };
    }
}

const DocumentType = {
    ActivityStatement: 'ActivityStatement',
    Unsupported: 'Unsupported'
};

const getDocumentType = content => {
    if (content.includes('Statement,Data,Title,Umsatzübersicht')) {
        return DocumentType.ActivityStatement;
    }

    return DocumentType.Unsupported;
};

const parseActivityStatement = content => {
    let info = parseFinancialInstrumentInformation(content);

    let activities = parseTrades(content, info);

    return activities;
}

const parseTrades = (content, info) => {
    let tradeSectionHeader = content.filter(t => t.includes('Transaktionen,Header,DataDiscriminator,'));
    let isMultiAccount = tradeSectionHeader.length > 0 && tradeSectionHeader[0].includes('Account');

    let tradeSection = content.filter(t => t.includes('Transaktionen,Data,'));
    let trades = tradeSection.map(trade => parseTrade(trade, info, isMultiAccount));
    trades = trades.filter(x => x); // Remove null and other invalid values  
    return trades;
}

const parseTrade = (trade, info, isMultiAccount) => {
    let activity = {
        broker: 'interactivebrokers',
        tax: 0,
    };

    // Split at comma, but not inside quoted strings
    const regex = /,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/gm;
    let tradeValues = trade.split(regex);
    let o = isMultiAccount ? 1 : 0; // Offset for extra 5th column ('Account') in multi-account report

    // Security Information
    if (!info.has(tradeValues[5 + o]))
        return null; // Skip trades which don't have an ISIN
    activity.company = info.get(tradeValues[5 + o]).name;
    activity.isin = info.get(tradeValues[5 + o]).isin;

    // Number of shares
    let shares = parseFloat(tradeValues[7 + o].replace('"', '').replace(',', '')); // remove quotes and 1000s separator
    activity.type = shares > 0 ? 'Buy' : 'Sell';
    activity.shares = Math.abs(shares);

    // Price and Costs
    activity.price = parseFloat(tradeValues[8 + o]);
    activity.amount = Math.abs(tradeValues[10 + o]);
    activity.fee = -tradeValues[11 + o];

    // Date / Time
    let timeValues = tradeValues[6 + o].slice(1, -1).split(', ');
    let [parsedDate, parsedDateTime] = createActivityDateTime(timeValues[0], timeValues[1], 'yyyy-MM-dd', 'yyyy-MM-dd HH:mm:ss');
    activity.date = parsedDate;
    activity.datetime = parsedDateTime;

    // Currency
    activity.foreignCurrency = tradeValues[4];
    activity.fxRate = 1; //unknown;

    return validateActivity(activity);
}

const parseFinancialInstrumentInformation = content => {
    let infoContent = content.filter(t => t.includes('Informationen zum Finanzinstrument,Data,'));

    let info = new Map();
    infoContent.forEach(line => {
        let lineValues = line.split(',');
        info.set(lineValues[3], { name: lineValues[4], isin: lineValues[6] });
    });

    return info;
}