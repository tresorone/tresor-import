# Broker: Deutsche Bank

In the following the you can find a listing of files that can or can not be automatically imported for the Broker
_Deutsche Bank_.

Explanation on the Column _Can be parsed_:

- ✔️This file can be imported automatically! If you find any bugs, please report them as we don't know about them yet.
- ⚠️This file can be parsed partially. Some contents might be ignored!
- ❌ This file cannot and will not be parsed.
- 🕥 File can not be parsed yet, support will be added in the future.

If your file not listed in the table below, please report it at tresor.import.one!

| Type of file                     | Format | Can be parsed |  Notes                                                               |
| -------------------------------- | ------ | ------------- | -------------------------------------------------------------------------- |
| Dividendengutschrift             | .pdf   | ✔️            |                                                                            |
| Ertragsgutschrift                | .pdf   | ✔️            |                                                                            |
| Abrechnung Kauf von Wertpapieren | .pdf   | ❌            | The .pdf files contains images instead of text and breaks the .pdf parsers |
| Umsatzliste | .pdf   | ⚠️| Can only parse 'Buy'. No test files for 'Sell', can't be parsed yet, dividends can and will not be parsed.|
| Depotstatus | .pdf   | ✔️|  |
