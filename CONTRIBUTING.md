# Development

## Development install

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

## How to rebuild the Typescript declarations

### Step-by-step

1. For the duration of building declarations, temporarily `export` the
`RegularTableElement` in `src/js/index.js`:

```javascript
// TEMP: export keyword added for building declarations
export class RegularTableElement extends RegularViewEventModel {
```

2. Run typescript declarations build:

```bash
yarn declarations
```

This will create `declarations/index.d.ts` and other typescript

3. In `index.d.ts`, replace all lines inbetween the paste guard lines:

```javascript
  // START: declarations/index.d.ts

  ...

  // END: declarations/index.d.ts
```

with the contents of the just-built `declarations/index.d.ts`.

### Troubleshooting

If an update to index.d.ts is found to break the compilation of any downstream projects, a likely place to check for errors are the pure jsdoc typedefs in `src/js/index.js` below the RegularTableElement class defintion. Ensure that all of the described types are in sync with their current javascript counterparts.
