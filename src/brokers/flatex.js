import format from 'date-fns/format';
import parse from 'date-fns/parse';
import every from 'lodash/every';
import values from 'lodash/values';
import {Big} from "big.js";

const parseGermanNum = n =>
    parseFloat(n.replace(/[-+]$/, '').replace(/\./g, '').replace(',', '.'));

const getTableValueByKey = (textArr, key) => {
    const finding = textArr.find(t => t.includes(key + " "));
    const result = finding ? finding.match(new RegExp(key + '\\s+:\\s+((\\s?\\S+\\s?\\S*)+)\\s*')) : null;
    return result ? result[1] : null;
};

const getHeaderValueByKey = (textArr, key) => {
    const result = textArr.find(t => t.includes(key + " "));
    return result ? result.match(new RegExp(key + '\\s\\s+(.+)'))[1] : null;
};

const findTableIndex = textArr => textArr.findIndex(t => /Nr.\d+(\/\d)?/.test(t));

const findISIN = textArr => {
    const isinStr = textArr[findTableIndex(textArr)].trim();
    const isinMatch = isinStr.match(/([A-Z]{2})((?![A-Z]{10})[A-Z0-9]{10})/);
    return isinMatch ? isinMatch[0] : null;
};

const findCompany = textArr => {
    const companyStr = textArr[findTableIndex(textArr)].trim();
    const companyMatch = companyStr.match(/Nr.\d+(\/\d)?\s+(Kauf|Verkauf)?\s+((\S+\s?\S*)+)\s+(\(|DL)/);
    return companyMatch ? companyMatch[3].trim() : null;
};

const findDateBuySell = textArr =>
    getTableValueByKey(textArr, 'Schlusstag')
        ? getTableValueByKey(textArr, 'Schlusstag').split(', ')[0] // standard stock
        : getHeaderValueByKey(textArr, 'Handelstag'); // etf

const findShares = textArr =>
    parseGermanNum(
        getTableValueByKey(textArr, 'Ordervolumen')
            ? getTableValueByKey(textArr, 'Ordervolumen').split(' ')[0] // stock
            : getTableValueByKey(textArr, 'Ausgeführt')
                ? getTableValueByKey(textArr, 'Ausgeführt').split(' ')[0] // etf
                : getTableValueByKey(textArr, 'St.').split(' ')[0] // dividend
    );

const findPrice = textArr =>
    parseGermanNum(getTableValueByKey(textArr, 'Kurs').split(' ')[0]);

const findAmount = textArr =>
    parseGermanNum(getTableValueByKey(textArr, 'Kurswert').split(' ')[0]);

const findFee = textArr => {
    const provision = getTableValueByKey(textArr, 'Provision') ? parseGermanNum(getTableValueByKey(textArr, 'Provision').split(' ')[0]) : 0;
    const ownExpenses = getTableValueByKey(textArr, 'Eigene Spesen') ? parseGermanNum(getTableValueByKey(textArr, 'Eigene Spesen').split(' ')[0]) : 0;
    const foreignExpenses = getTableValueByKey(textArr, 'Fremde Spesen') ? parseGermanNum(getTableValueByKey(textArr, 'Fremde Spesen').split(' ')[0]) : 0;

    return provision + ownExpenses + foreignExpenses;
};

const findDividendFee = textArr => {
    const assessmentBasis = getTableValueByKey(textArr, 'grundlage') ? parseGermanNum(getTableValueByKey(textArr, 'grundlage').split(' ')[0]) : 0; // Bemessungsgrundlage
    const netDividend = getTableValueByKey(textArr, 'Endbetrag') ? parseGermanNum(getTableValueByKey(textArr, 'Endbetrag').split(' ')[0]) : 0;

    return assessmentBasis > 0 ? +Big(assessmentBasis).minus(Big(netDividend)) : 0;
};


const findDateDividend = textArr =>
    getTableValueByKey(textArr, 'Zahlungstag');

const findPayout = textArr => {
    const assessmentBasis = getTableValueByKey(textArr, 'grundlage') ? parseGermanNum(getTableValueByKey(textArr, 'grundlage').split(' ')[0]) : 0; // Bemessungsgrundlage
    const netDividend = getTableValueByKey(textArr, 'Endbetrag') ? parseGermanNum(getTableValueByKey(textArr, 'Endbetrag').split(' ')[0]) : 0;

    return assessmentBasis > 0 ? assessmentBasis : netDividend;
};

const isBuy = textArr =>
    textArr.some(t => t.includes('Kauf'));

const isSell = textArr =>
    textArr.some(t => t.includes('Verkauf'));

const isDividend = textArr =>
    textArr.some(t => t.includes('Dividendengutschrift'));

export const canParseData = textArr =>
    textArr.some(t => t.includes('flatex Bank AG') || t.includes('FinTech Group Bank AG')) &&
    (isBuy(textArr) ||
        isSell(textArr) ||
        isDividend(textArr));

export const parseData = textArr => {
    let type, date, isin, company, shares, price, amount, fee;

    if (isBuy(textArr)) {
        type = 'Buy';
        isin = findISIN(textArr);
        company = findCompany(textArr);
        date = findDateBuySell(textArr);
        shares = findShares(textArr);
        amount = findAmount(textArr);
        price = findPrice(textArr);
        fee = findFee(textArr);
    } else if (isSell(textArr)) { // TODO: testing needed
        type = 'Sell';
        isin = findISIN(textArr);
        company = findCompany(textArr);
        date = findDateBuySell(textArr);
        shares = findShares(textArr);
        amount = findAmount(textArr);
        price = findPrice(textArr);
        fee = findFee(textArr);
    } else if (isDividend(textArr)) {
        type = 'Dividend';
        isin = findISIN(textArr);
        company = findCompany(textArr);
        date = findDateDividend(textArr);
        shares = findShares(textArr);
        amount = findPayout(textArr);
        price = amount / shares;
        fee = findDividendFee(textArr);
    } else {
        console.error('Type could not be determined!');
        return undefined;
    }

    const activity = {
        broker: 'flatex',
        type,
        date: format(parse(date, 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd'),
        isin,
        company,
        shares,
        price,
        amount,
        fee,
    };

    const valid = every(values(activity), a => !!a || a === 0);

    if (!valid) {
        console.error('Error while parsing PDF', activity);
        return undefined;
    } else {
        return activity;
    }
};

export const parsePages = contents => {
    // parse first page has activity data
    const activity = parseData(contents[0]);
    return [activity];
};
