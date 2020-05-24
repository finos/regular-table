<p align="center">
  <img alt="regular-table" src="https://raw.githubusercontent.com/jpmorganchase/regular-table/master/logo.png" width="300">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/regular-table"><img alt="NPM Version" src="https://img.shields.io/npm/v/regular-table.svg?color=brightgreen&style=flat-squar"></a>
  <a href="https://travis-ci.org/jpmorganchase/regular-table"><img alt="Travis Status" src="https://travis-ci.org/jpmorganchase/regular-table.svg?branch=master"></a>
</p>

## Installation

Add to your project via `yarn`:

```bash
yarn add regular-table
```

Import into your asset bundle.  `regular-table` exports no symbols, only the
`<regular-table>` Custom Element it registered as a module side-effect:

```javascript
import "regular-table";
```

## Development

First install `dev_dependencies`:

```bash
yarn
```

Build the library

```bash
yarn build
```

Run the test suite

```bash
yarn test
```

Start the example server at [`http://localhost:8080/examples/`](http://localhost:8080/examples/)

```bash
yarn start
```