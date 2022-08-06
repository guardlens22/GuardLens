# GuardLens JS
GuardLens gives users easy access to security and privacy-related information about a website upon request.

## Usage
GuardLens JS is designed for browsers:

`<script src="guardlens.js></script>`
`<script>new guardlens(userId, logEnabled, showAutomatically); </script>`

## Development
First, `npm install` to get all dependencies.

**What's in what?**

* `controller.js`:  any requests to the back-end and extension background scripts
* `index.js`: entry point of library and general workflow
* `polyfill.js`: cross-browser DOM features
* `storage.js`: handles local storage
* `styles.js`: UI styles and element IDs
* `ui.js`: messages, prompts, DOM helpers
* `utils.js`: general helpers and algorithms

**How to build it?**

* `npm run build` - generate production-ready script (minified) under `lib` directory
* `npm run dev` - generate development code (not minified) and watch for changes - the new version is automatically copied to `../web-extension/guardlens.js`
* `npm run test` - run tests
* `npm run test:watch` - run tests and watch for changes

## Compatibility
GuardLens JS is developed in ES6 and compiled with BabelJS. It was tested on Chrome, Firefox, Safari, Edge, and IE >= 10.