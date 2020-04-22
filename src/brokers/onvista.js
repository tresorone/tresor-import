import format from 'date-fns/format'
import parse from 'date-fns/parse'
import every from 'lodash/every'
import values from 'lodash/values'

const parseGermanNum = (n) => {
    return parseFloat(n.replace(/\./g, '').replace(',', '.'))
}

const findISIN = (text, span) => {
    const isin = text[text.findIndex(t => t.includes('ISIN')) + span]
    return isin
}

const findCompany = (text, span) => {
    const company = text[text.findIndex(t => t.includes('ISIN')) + span]
    return company
}

const findDateBuySell = (text) => {
    const date = text[text.findIndex(t => t.includes('Handelstag')) + 1]
    return date
}

const findDateDividend = (text) => {
    const date = text[text.findIndex(t => t.includes('Zahltag')) + 1]
    return date
}

const findShares = (text) => {
    const sharesLine = text[text.findIndex(t => t.includes('STK'))]
    const shares = sharesLine.split(' ')[1]
    return parseGermanNum(shares)
}

const findAmount = (text) => {
    let amount = text[text.findIndex(t => t.includes('Kurs')) + 1]
    amount = amount.split('EUR')[1].trim()
    return parseGermanNum(amount)
}

const findPayout = (text) => {
    const amount = text[text.findIndex(t => t.includes('Betrag zu Ihren Gunsten')) + 2]
    return parseGermanNum(amount)
}

const findFee = (text) => {
    let totalTraded = parseGermanNum(text[text.findIndex(t => t.includes('Kurswert')) + 2])
    let totalPrice = parseGermanNum(text[text.findIndex(t => t.includes('Betrag zu Ihren Lasten')) + 2])
    return totalPrice - totalTraded
}

const findTax = (text) => {
    const amount = text[text.findIndex(t => t.includes('Betrag zu Ihren Gunsten')) + 2]
    return parseGermanNum(amount)
}

export const canParseData = (textArr) =>
  textArr.some((t) => t.includes("BELEGDRUCK=J"));

export const parseOnvistaActivity = (text) => {
    const isBuy = text.some(t => t.includes('Wir haben für Sie gekauft'))
    const isSell = text.some(t => t.includes('Wir haben für Sie verkauft')) // TODO: Geraten. Stimmt das?
    const isDividend = text.some(t => t.includes('Erträgnisgutschrift')) || text.some(t => t.includes('Dividendengutschrift'))

    let type, date, isin, company, shares, price, amount, fee

    if (isBuy) {
        type = 'Buy'
        isin = findISIN(text, 1)
        company = findCompany(text, -1)
        date = findDateBuySell(text)
        shares = findShares(text)
        amount = findAmount(text)
        price = amount / shares
        fee = findFee(text)

    } else if (isSell) {
        type = 'Sell'
        isin = findISIN(text, 1)
        company = findCompany(text, -1)
        date = findDateBuySell(text)
        shares = findShares(text)
        amount = findAmount(text)
        price = amount / shares
        fee = findFee(text)

    } else if (isDividend) {
        type = 'Dividend'
        isin = findISIN(text, 1)
        company = findCompany(text, -1)
        date = findDateDividend(text)
        shares = findShares(text)
        amount = findPayout(text)
        price = amount / shares
        fee = 0

    }

    const activity = {
        broker: 'onvista',
        type,
        date: format(parse(date, 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd'),
        isin,
        company,
        shares,
        price,
        amount,
        fee
    }

    const valid = every(values(activity), a => (!!a || a === 0))

    if (!valid) {
        console.error('Error while parsing PDF', activity)
        return undefined
    } else {
        return activity
    }
}