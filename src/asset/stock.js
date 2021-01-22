export default class Stock {
  constructor(isin, wkn, company) {
    this.companyNeeded = false;

    this.isin = isin;
    this.wkn = wkn;
    this.company = company;

    this.validate();
  }

  companyNeeded(needed = false) {
    this.companyNeeded = needed;
  }

  // Regex to match an ISIN-only string. The first two chars represent the country and the last one is the check digit.
  static validIsin(isin) {
    return /^[A-Z]{2}[0-9A-Z]{9}[0-9]$/.test(isin);
  }

  static validWkn(wkn) {
    return /^([A-Z0-9]{6})$/.test(wkn);
  }

  validate() {
    // Tresor One will search the security for PDF Documents with ISIN or WKN. For Imports of .csv File from Portfolio Performance
    // T1 can search the security also by the Company.
    if (
      ((this.companyNeeded && this.company === undefined) ||
        !this.companyNeeded) &&
      this.isin === undefined &&
      this.wkn === undefined
    ) {
      console.error(
        'The activity for must have at least a' +
          (this.companyNeeded ? ' company,' : 'n') +
          ' ISIN or WKN.',
        this
      );
      return undefined;
    }

    if (this.isin !== undefined && Stock.validIsin(this.isin)) {
      throw new Error('The ISIN has an invalid scheme.');
    }

    if (this.wkn !== undefined && Stock.validWkn(this.wkn)) {
      throw new Error('The WKN has an invalid scheme.');
    }
  }
}
