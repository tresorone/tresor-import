import format from "date-fns/format";
import parse from "date-fns/parse";
import Big from 'big.js';

import { parseGermanNum, validateActivity } from '@/helper';


const isForeignCurrencyBuy = pageArray =>
  pageArray.some(element => element.includes('umgerechneter FW - Endwert'))

const findIsin = pageArray => {
  const isinIndex = pageArray.findIndex(line => line.includes('Ihr Auftrag vom'))+1;
  return pageArray[isinIndex].split(/\s/)[0]
}

const findCompany = pageArray => {
  const companyIndex = pageArray.findIndex(line => line.includes('Ihr Auftrag vom'))+1;
  return pageArray[companyIndex].split(/(\s+)/).slice(2).join('')
}

const findDate = pageArray => {
  const dateIndex = pageArray.findIndex(line => line.includes('Verrechnungskonto'))-1;
  const date = pageArray[dateIndex].split(/(\s+)/)[6];
  return format(parse(date, 'dd.MM.yyyy', new Date()), 'yyyy-MM-dd');
}

const findAmount = pageArray => {
  // Two occurrences of Kurswert are expected; we are interested in the first
  let amountLineIndex = pageArray.findIndex(line => line.includes('Kurswert'))+1;
  // If the amount is in a foreign currency, the EUR amount will be 2 lines later
  if (isForeignCurrencyBuy(pageArray)) {
    amountLineIndex += 2;
  }
  const amount = pageArray[amountLineIndex].split(/\s+/)[4];
  return parseGermanNum(amount);


}

const findShares = pageArray => {
  const sharesLineIndex = pageArray.findIndex(line => line.includes('ckzahl'))+1;
  const sharesLineArray = pageArray[sharesLineIndex].split(/\s+/);
  return parseGermanNum(sharesLineArray[1]);
}

const findFee = pageArray => {
  // For foreign buy the fees are located somewhere else

  const feeIndex = pageArray.indexOf('Summe Kosten und Geb');
  // if the transaction is in EUR
  if (feeIndex > 0) {
    return parseGermanNum(pageArray[feeIndex+2].split(/\s+/)[1]);
  }
  // if the transaction is in another currency
  else {
    const sharesLineIndex = pageArray.findIndex(line => line.includes('Gesamtkosten und -gebühren'));
    const feeLineArray = pageArray[sharesLineIndex].split(/\s+/);
    return parseGermanNum(feeLineArray[3]);
  }


}

const isBuy = pageArray => {
  return pageArray.some(line => line.includes('uf Marktplatz vom'))
}

export const canParsePage = (pageArray, extension) =>
  extension === 'pdf' &&
  pageArray.some(line => line.includes('ATU63358299')) &&
  isBuy(pageArray);


export const parsePages = content => {
  const pdfPagesConcat = [].concat.apply([], content);
  let activity;
  const broker = "ersteBank"
  if (isBuy(pdfPagesConcat)) {
    const amount = findAmount(pdfPagesConcat);
    const shares = findShares(pdfPagesConcat);
    activity = {
      broker: broker,
      type: 'Buy',
      isin: findIsin(pdfPagesConcat),
      company: findCompany(pdfPagesConcat),
      date: findDate(pdfPagesConcat),
      amount: amount,
      shares: shares,
      price: +Big(amount).div(shares),
      tax: 0,
      fee: findFee(pdfPagesConcat),
    }
  }
  const activities = [validateActivity(activity)]


  return {
    //Has to be an array
    activities,
    status: 0,
  };
};



