import pdfjs from 'pdfjs-dist/webpack';

import { parseComdirectActivity } from './brokers/comdirect'

const getActivity = (textArr) => {
  const broker = identifyBroker(textArr)

  if (broker === 'comdirect') {
    return parseComdirectActivity(textArr)
  } else {
    console.log('Unsupported broker')
    return;
  }
}

const identifyBroker = (textArr) => {
  const isComdirect = textArr.some(t => t.includes('comdirect bank'));

  if (isComdirect) {
    return 'comdirect'
  } else {
    return;
  }
}

export const extractActivity = async (e) => {
  let activity;
  let textArr;

  const result = new Uint8Array(e.currentTarget.result);
  const pdf = await pdfjs.getDocument(result).promise;
  const page = await pdf.getPage(1);
  const tc = await page.getTextContent();

  var out = [];
  for (let c of tc.items) {
    out.push(c.str.trim());
  }
  textArr = out.filter(i => i.length > 0);
  console.log(textArr);

  try {
    activity = getActivity(textArr)
  } catch (error) {
    console.error(error)
  }

  if (!activity) {
    activity = { parserError: true };
  }

  return activity
}