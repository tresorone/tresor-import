# Tresor-Import - The File Import of Tresor One

This is the PDF and PP-CSV Import used on [tresor.one](https://tresor.one)

## Installation

```bash
npm install tresor-import
```

## Usage

```js
import getActivities from 'tresor-import';

async fileHandler() {
  const results = await Promise.all(Array.from(this.$refs.myFiles.files).map(getActivities));
  results.forEach(result => {
    console.log(result);
  });
}
```

The function `getActivities` returns an objects with the following fields:

| Name       | Description                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| file       | The file name of the input file.                                                                                               |
| activities | All activity which was parsed from the input file.                                                                             |
| status     | The status code which contains the information about the reason why no activities was found. For Details see the status table. |
| successful | The simple way to check if at least one activity was found and the status code is equals zero.                                 |

The status field can contains one of the following values:

| Status-Code | Description                                                              |
| ----------- | ------------------------------------------------------------------------ |
| 0           | All pages can parsed each with one or more activities                    |
| 1           | Unable to identifiy an implementation with the content of the first page |
| 2           | More than one implementation was found for the first page                |
| 4           | Unable to parse given file type                                          |
| 5           | No activities found for a valid document                                 |

## Contribute

To contribute:

1. fork the repo
2. install and start `npm i && npm start`
3. open [`http://localhost:5000`](http://localhost:5000) in your browser
4. Import a PDF. Content is shown in your Javascript console
5. Write a parser in `src/brokers` to parse that content - see `src/brokers/comdirect.js` for inspiration
6. Add and run all tests `npm t`
7. Create a Pull Request
