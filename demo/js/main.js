import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import parse from 'date-fns/parse';
import { de } from 'date-fns/locale';

import { extractActivities, extractCSVActivities } from '../../src';

const parsePDF = async (e, file) => {
  const activities = await extractActivities(e);

  if (activities.length === 0) {
    return {
      filename: file.name,
      parsed: true,
      parserError: true,
    };
  }

  return activities.map((activity, i) => {
    return {
      ...activity,
      filename: file.name + i,
      parsed: true,
    };
  });
};

const parseCSV = async (e, file) => {
  const activities = await extractCSVActivities(e);

  return activities.map((a, i) => ({ ...a, filename: file.name + i }));
};

const handleFile = async file => {
  const supportedFiles = ['pdf', 'csv'];
  const ext = file.name.split('.').pop().toLowerCase();

  console.log('this is a ' + ext);

  return new Promise(resolve => {
    let a;

    // cancel if filetype is unsupported
    if (!supportedFiles.includes(ext)) {
      // mark import as error
      a = {
        filename: file.name,
        parsed: true,
        parserError: true,
      };

      resolve(a);
    } else {
      const fileReader = new FileReader();

      fileReader.onload = async e => {
        if (ext === 'pdf') {
          a = await parsePDF(e, file);
        } else if (ext === 'csv') {
          console.log('csv import');
          a = await parseCSV(e, file);
        }

        resolve(a);
      };

      if (ext === 'pdf') {
        fileReader.readAsArrayBuffer(file);
      } else if (ext === 'xml' || ext === 'csv') {
        fileReader.readAsText(file);
      }
    }
  });
};

const processFiles = async files => {
  const promises = files.map(handleFile);
  return Promise.all(promises);
};

new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!',
    activities: [],
  },
  methods: {
    showHoldingWarning(a) {
      return !a.filename && !a.holding;
    },
    getPriceColor(type) {
      if (type === 'Dividend' || type === 'Buy' || type === 'Import') {
        return 'has-text-success';
      } else {
        return 'has-text-danger';
      }
    },
    getTypeColor(type) {
      if (type === 'Dividend' || type === 'Buy' || type === 'Import') {
        return 'is-success';
      } else {
        return 'is-danger';
      }
    },
    formatDate(d) {
      return formatDistanceToNow(parse(d, 'yyyy-MM-dd', new Date()), {
        locale: de,
        addSuffix: true,
      });
    },
    numberWithCommas(x) {
      var parts = x.toString().split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return parts.join(',');
    },
    formatPrice(p = 0) {
      return this.numberWithCommas(p.toFixed(2));
    },
    async fileHandler() {
      const files = this.$refs.myFiles.files;

      const result = await processFiles(Array.from(files));
      const activities = result.flat();

      if (activities.length === 0) {
        return;
      }

      this.activities.push(...activities);
    },
  },
});
