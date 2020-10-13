import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import parse from 'date-fns/parse';
import { de } from 'date-fns/locale';
// Use the webpack version to ensure, that the published version works fine and not only the src/ one.
import getActivities from '../bundle/tresor-import';
// To use the published version, uncomment the following line after running: npm run build
// import getActivities from '../../dist/tresor-import';

new Vue({
  el: '#app',
  data: {
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
      const results = await Promise.all(
        Array.from(this.$refs.myFiles.files).map(getActivities)
      );
      results.forEach(result => {
        console.log(result);
        if (result.activities) {
          console.table(result.activities);
        }

        if (!result.successful) {
          return;
        }

        this.activities.push(...result.activities);
      });
    },
  },
});
