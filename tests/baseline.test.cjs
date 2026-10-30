const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const {pathToFileURL} = require('node:url');
const root = path.resolve(__dirname, '..');

test('production output contains essential resources and coherent sprite atlases', async () => {
    const {checkAssets} = await import(pathToFileURL(path.join(root, 'scripts/check-assets.mjs')));
    const result = await checkAssets(root);
    assert.ok(result.assetCount > 50);
    assert.ok(result.atlasCount >= 5);
    assert.deepEqual(result.errors, []);
});

test('atlas validation detects missing textures and invalid animation frames', async () => {
    const {inspectAtlas} = await import(pathToFileURL(path.join(root, 'scripts/check-assets.mjs')));
    const folder = path.join(root, 'artifacts/test-fixtures');
    await fs.mkdir(folder, {recursive: true});
    const fixture = path.join(folder, 'broken-atlas.json');
    await fs.writeFile(fixture, JSON.stringify({meta: {image: 'missing.png'}, frames: {}, animations: {walk: ['absent-frame']}}));
    const errors = await inspectAtlas(fixture);
    assert.equal(errors.length, 2);
    assert.ok(errors.some(error => error.includes('Missing atlas image')));
    assert.ok(errors.some(error => error.includes('Unknown frame')));
});

test('bundler rejects an invalid entry instead of reporting a successful build', async () => {
    const {bundleGame} = require('../game-source/build/bundle.cjs');
    const output = path.join(root, 'artifacts/invalid-bundle/should-not-exist.js');
    await assert.rejects(bundleGame({entry: path.join(root, 'artifacts/nonexistent-entry.js'), output}));
    await assert.rejects(fs.access(output));
});

test('retained analytics calls stay local and use bounded session memory', async () => {
    const source = await fs.readFile(path.join(root, 'game-source/public/game/assets/js/local-events.js'), 'utf8');
    const context = {window: {}, Date};
    vm.runInNewContext(source, context);
    for (let i = 0; i < 250; i++) context.window.gtag('event', `test-${i}`);
    assert.equal(context.window.hireAndSeekEvents.length, 200);
    assert.equal(context.window.hireAndSeekEvents[0].arguments[1], 'test-50');
    assert.equal(context.window.hireAndSeekEvents[199].arguments[1], 'test-249');
});

test('shared wrap-up script loads on the game without website-only Bootstrap plugins', async () => {
    const source = await fs.readFile(path.join(root, 'website-source/js/resources.js'), 'utf8');
    const jquery = () => ({attr() {}, hide() {}});
    const context = {document: {getElementById() {return null;}}, $: jquery};
    assert.doesNotThrow(() => vm.runInNewContext(source, context));
    assert.equal(typeof context.next1, 'function');
    assert.equal(typeof context.next2, 'function');
});

test('local preview serves the game and media, and rejects access outside dist', async (t) => {
    const {createPreviewServer} = await import(pathToFileURL(path.join(root, 'scripts/preview.mjs')));
    const server = createPreviewServer();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    const base = `http://127.0.0.1:${server.address().port}`;
    const game = await fetch(`${base}/game/`);
    assert.equal(game.status, 200);
    assert.match(await game.text(), /gameCanvas/);
    const font = await fetch(`${base}/game/assets/fonts/vt323-regular.woff`, {method: 'HEAD'});
    assert.equal(font.status, 200);
    assert.equal(font.headers.get('content-type'), 'font/woff');
    const escape = await fetch(`${base}/..%2fREADME.md`);
    assert.equal(escape.status, 403);
    const missing = await fetch(`${base}/does-not-exist`);
    assert.equal(missing.status, 404);
    const post = await fetch(`${base}/game/`, {method: 'POST'});
    assert.equal(post.status, 405);
});
