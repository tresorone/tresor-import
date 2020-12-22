import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import parse from 'date-fns/parse';
import { de } from 'date-fns/locale';
// Use the webpack version to ensure, that the published version works fine and not only the src/ one.
import { parseFile, parseActivitiesFromPages } from '../bundle/tresor-import';
// To use the published version, uncomment the following line after running: npm run build
// import { parseFile, parseActivitiesFromPages } from '../../dist/tresor-import';

new Vue({
  el: '#app',
  data: {
    errors: [],
    activities: [],
    jsonInputActive: false,
    jsonContent: '',
    jsonExtension: 'pdf',
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
    handleParserResults(result) {
      if (result.activities) {
        console.table(result.activities);
      }

      if (!result.successful) {
        this.errors.push(result);
        return;
      }

      this.activities.push(...result.activities);
    },
    loadJson() {
      let content = undefined;

      try {
        content = JSON.parse(this.jsonContent);
      } catch (exception) {
        console.error(exception);
      }

      if (content === undefined) {
        return;
      }

      const result = parseActivitiesFromPages(content, this.jsonExtension);

      this.clearResults();

      this.handleParserResults({
        file: 'json.' + this.jsonExtension,
        content: this.jsonContent,
        activities: result.activities,
        status: result.status,
        successful: result.activities !== undefined && result.status === 0,
      });
    },
    copyContentToClipboard(name) {
      const copyText = document.getElementById('content-' + name);

      copyText.style.display = 'block';

      copyText.select();
      copyText.setSelectionRange(0, 99999);

      document.execCommand('copy');

      copyText.style.display = 'none';
    },
    async fileHandler() {
      this.clearResults();
      Array.from(this.$refs.myFiles.files).forEach(file => {
        parseFile(file).then(parsedFile => {
          const result = parseActivitiesFromPages(
            parsedFile.pages,
            parsedFile.extension
          );

          result.file = file.name;
          result.content = parsedFile.pages;
          result.successful =
            result.activities !== undefined && result.status === 0;

          this.handleParserResults(result);
        });
      });
    },
    clearResults() {
      this.errors = [];
      this.activities = [];
    },
  },
});
