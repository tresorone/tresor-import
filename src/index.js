import { csvLinesToJSON } from '@/helper';
import pdfjs from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import * as brokers from './brokers';
import * as apps from './apps';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const findImplementation = (pages, extension) => {
  // The broker or app will be selected by the content of the first page
  const selectdBrokers = Object.values(brokers).filter(broker =>
    broker.canParsePage(pages[0], extension)
  );

  const selectedApps = Object.values(apps).filter(app =>
    app.canParsePage(pages[0], extension)
  );

  return [...selectdBrokers, ...selectedApps];
};

const parseActivitiesFromPages = (pages, extension) => {
  const implementations = findImplementation(pages, extension);
  if (implementations === undefined || implementations.length < 1) {
    status = 1;
  } else if (implementations.length === 1) {
    if (extension === 'pdf') {
      return implementations[0].parsePages(pages);
    } else if (extension === 'csv') {
      return implementations[0].parsePages(
        JSON.parse(csvLinesToJSON(pages[0]))
      );
    } else {
      status = 4;
    }
  } else if (implementations.length > 2) {
    status = 2;
  }

  return {
    activities: undefined,
    status,
  };
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
