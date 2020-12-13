import { csvLinesToJSON } from '@/helper';
import pdfjs from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import * as brokers from './brokers';
import * as apps from './apps';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const allImplementations = [
  ...Object.values(brokers),
  ...Object.values(apps),
];

export const findImplementation = (pages, extension) => {
  // The broker or app will be selected by the content of the first page
  return allImplementations.filter(implementation =>
    implementation.canParsePage(pages[0], extension)
  );
};

export const parseActivitiesFromPages = (pages, extension) => {
  let status;
  const implementations = findImplementation(pages, extension);

  try {
    // Status 1, no broker could be found
    if (implementations === undefined || implementations.length < 1) {
      status = 1;
    } else if (implementations.length === 1) {
      if (extension === 'pdf') {
        return filterResultActivities(implementations[0].parsePages(pages));
      } else if (extension === 'csv') {
        return filterResultActivities(
          implementations[0].parsePages(JSON.parse(csvLinesToJSON(pages[0])))
        );
      }
      // Invalid Filetype
      else {
        status = 4;
      }
    }
    // More than one broker found
    else if (implementations.length > 1) {
      status = 2;
    }
  } catch (error) {
    // Critical Error occurred
    console.error(error);
    status = 3;
  }

  return {
    activities: undefined,
    status,
  };
};

const filterResultActivities = result => {
  if (result.activities !== undefined) {
    result.activities = result.activities.filter(
      activity => activity !== undefined
    );

    // If no activity exists, set the status code to 5
    const numberOfActivities = result.activities.length;
    result.activities =
      numberOfActivities === 0 ? undefined : result.activities;
    result.status =
      numberOfActivities === 0 && result.status == 0 ? 5 : result.status;
  }

  return result;
};

const parsePageToContent = async page => {
  const parsedContent = [];
  const content = await page.getTextContent();

  for (const currentContent of content.items) {
    parsedContent.push(currentContent.str.trim());
  }

  return parsedContent.filter(item => item.length > 0);
};

export default file => {
  return new Promise(resolve => {
    try {
      const extension = file.name.split('.').pop().toLowerCase();
      const reader = new FileReader();

      reader.onload = async e => {
        let fileContent, pdfDocument;
        let pages = [];

        if (extension === 'pdf') {
          fileContent = new Uint8Array(e.currentTarget.result);
          pdfDocument = await pdfjs.getDocument(fileContent).promise;

          const loopHelper = Array.from(Array(pdfDocument.numPages)).entries();
          for (const [pageIndex] of loopHelper) {
            pages.push(
              await parsePageToContent(await pdfDocument.getPage(pageIndex + 1))
            );
          }
        } else {
          pages.push(e.currentTarget.result.trim().split('\n'));
        }

        const result = parseActivitiesFromPages(pages, extension);

        resolve({
          file: file.name,
          activities: result.activities,
          status: result.status,
          successful: result.activities !== undefined && result.status === 0,
        });
      };

      if (extension === 'pdf') {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    } catch (error) {
      console.error(error);
    }
  });
};
