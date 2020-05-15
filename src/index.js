import pdfjs from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import * as brokers from './brokers';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const getActivity = contents => {
  // identify broker from first page
  const broker = getBroker(contents[0]);

  if (broker) {
    // get activities from all pages
    return broker.parsePages(contents);
  } else {
    // no supported broker found in PDF
    return [];
  }
};

export const getBroker = textArr => {
  const supportedBrokers = Object.values(brokers).filter(broker =>
    broker.canParseData(textArr)
  );

  if (supportedBrokers.length > 1) {
    console.error('Multiple supported brokers found!');
    return false;
  }

  if (supportedBrokers.length === 0) {
    console.error('No supported broker found!');
    return false;
  }

  return supportedBrokers[0];
};

const parsePage = async page => {
  // extract content of page as an array of strings
  let textArr;

  const tc = await page.getTextContent();

  var out = [];
  for (let c of tc.items) {
    out.push(c.str.trim());
  }
  textArr = out.filter(i => i.length > 0);

  return textArr;
};

export const extractActivities = async e => {
  const result = new Uint8Array(e.currentTarget.result);
  const pdf = await pdfjs.getDocument(result).promise;

  // get contents of all pages as array of textArrays
  const contents = [];
  const loopHelper = Array.from(Array(pdf.numPages)).entries();

  for (const [i] of loopHelper) {
    const pageNum = i + 1;
    const page = await pdf.getPage(pageNum);
    const textArr = await parsePage(page);
    contents.push(textArr);
  }

  console.log(contents);

  // get activities out of entire PDF (all pages)
  let activities = [];

  try {
    activities = getActivity(contents);
  } catch (error) {
    console.error(error);
  }

  return activities;
};
