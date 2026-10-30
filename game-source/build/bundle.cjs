const path = require('node:path');
const fs = require('node:fs/promises');
const browserify = require('browserify');
const babelify = require('babelify');

const gameRoot = path.resolve(__dirname, '..');

// Resolve only after Browserify AND the output write finish. Reject failures;
// a missing import must never appear to be a successful production build.
async function bundleGame({entry, output}) {
    const content = await new Promise((resolve, reject) => {
        const bundler = browserify(entry, {debug: true, basedir: gameRoot});
        bundler.transform(babelify, {cwd: gameRoot, configFile: path.join(gameRoot, '.babelrc')});
        bundler.bundle((error, buffer) => error ? reject(error) : resolve(buffer));
    });
    await fs.mkdir(path.dirname(output), {recursive: true});
    await fs.writeFile(output, content);
}

module.exports = {bundleGame};
