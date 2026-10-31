// DOM integration, not a browser renderer. Pixi/audio are isolated; actual Pug,
// UI handlers, FSM, learning engine, saves and reports run together.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {parseHTML} = require('../game-source/node_modules/linkedom');
const pug = require('../game-source/node_modules/pug');
const loader = require('./helpers/load-source.cjs');

function environment(t, map = new Map()) {
    const before = {window: global.window, document: global.document};
    t.after(() => Object.assign(global, before));
    const dom = parseHTML(pug.renderFile(path.resolve(__dirname, '../game-source/views/pages/game/index.pug')));
    global.window = dom.window; global.document = dom.document;
    // LinkeDOM intentionally has no select.value setter. Supply just that DOM
    // property; this harness does not emulate layout, media or WebGL.
    const descriptor = Object.getOwnPropertyDescriptor(dom.window.HTMLSelectElement.prototype, 'value');
    if (!descriptor.set) Object.defineProperty(dom.window.HTMLSelectElement.prototype, 'value', {configurable: true, get: descriptor.get,
        set(value) { [...this.options].forEach(option => { option.selected = option.value === value; }); }});
    const assigned = [];
    Object.defineProperty(dom.window, 'location', {configurable: true, value: {search: '?seed=17', pathname: '/game/', assign(url) { assigned.push(url); }}});
    Object.defineProperty(dom.window, 'localStorage', {configurable: true, value: {getItem(key) { return map.get(key) || null; }, setItem(key, value) { map.set(key, value); }, removeItem(key) { map.delete(key); }}});
    let time = 0;
    const jobs = new Set();
    const clock = {paused: false, now: () => time,
        schedule(callback, delay) { const job = {callback, at: time + delay}; jobs.add(job); return job; }, cancel(job) { jobs.delete(job); },
        advance(ms) { time += ms; for (const job of [...jobs]) if (job.at <= time) { jobs.delete(job); job.callback(); } }};
    const scenes = [];
    class Scene {
        constructor() { this.moves = []; scenes.push(this); }
        setApplicants(records, selected) { this.records = records; this.selected = selected; }
        animateDecision(id, decision) { this.moves.push({id, decision}); return Promise.resolve(); }
        destroy() { this.destroyed = true; }
    }
    const load = loader({
        'public/game/controllers/game/gameClock.js': {gameClock: clock},
        'public/game/controllers/game/gameSetup.js': {mountCanvas() {}, stopTweenManager() {}},
        'public/game/controllers/common/state.js': {set(key, value) { if (key === 'stage') document.body.dataset.stage = value; }},
        'public/game/controllers/game/sound.js': {play() {}, stop() {}},
        'public/game/controllers/constants.js': {SOUNDS: {}},
        'public/game/components/pixi/first-shift/first-shift-scene.js': Scene,
        'public/game/components/pixi/training-stage/circle-grid.js': class { destroy() {} },
    });
    const runtime = load('public/game/controllers/game/stateManager.js'); runtime.gameFSM.startGame();
    async function click(selector) {
        const button = document.querySelector(selector); assert.ok(button, selector);
        assert.equal(button.disabled, false, selector + ' is disabled');
        assert.equal(button.closest('[hidden]'), null, selector + ' is hidden');
        button.click(); await new Promise(resolve => setImmediate(resolve));
        const error = document.querySelector('#review-error');
        if (error && !error.hidden) assert.fail(error.textContent);
    }
    return {runtime, clock, map, assigned, scenes, click, load};
}

test('actual UI completes all six chapters, renders real evidence, locks a final test and resumes its receipt', async t => {
    const env = environment(t), {click, clock, map, runtime} = env;
    assert.equal(document.body.dataset.stage, 'first-shift-briefing');
    await click('[data-action="begin"]');
    for (let round = 0; round < 3; round++) {
        while (document.body.dataset.stage === 'first-shift-manual') await click('[data-action="shortlist"]');
        if (round < 2) await click('[data-action="next-round"]');
    }
    assert.match(document.querySelector('#saved-choice-count').textContent, /16/);
    await click('[data-action="train"]'); clock.advance(50);
    await click('[data-action="watch"]'); await click('[data-action="finish"]');
    await click('[data-action="archive"]'); clock.advance(50);
    await click('[data-action="watch"]'); await click('[data-action="finish"]');
    await click('[data-action="investigate"]');
    assert.equal(document.querySelector('#first-shift').hidden, true);
    assert.equal(document.body.dataset.stage, 'review-investigation');
    assert.ok(document.querySelectorAll('#case-tree .OnPath').length > 0);
    assert.equal(document.querySelector('[data-review-action="open-audit"]').disabled, true);
    await click('[data-review-action="inspect"]'); await click('[data-review-action="compare"]'); await click('[data-review-action="inspect"]');
    await click('[data-review-action="open-audit"]'); assert.match(document.querySelector('#initial-audit').textContent, /80/);
    await click('[data-review-action="workshop"]');
    for (const change of ['assess', 'hide-city', 'hide-academy']) await click('[data-repair="' + change + '"]');
    assert.match(document.querySelector('#review-budget').textContent, /^0/);
    assert.equal(document.querySelector('[data-repair="expand"]').disabled, true);
    assert.match(document.querySelector('#workshop-source').textContent, /independent assessments/);
    await click('[data-review-action="deploy"]'); await click('[data-review-action="next-final"]'); await click('[data-review-action="skip-final"]');
    assert.match(document.querySelector('#receipt-ending').textContent, /Trust Earned/);
    assert.match(document.querySelector('#receipt-stars').textContent, /3 of 3/);
    const note = document.querySelector('#reflection-pattern'); note.value = 'Old labels are not a job check.';
    note.dispatchEvent(new window.Event('input', {bubbles: true}));
    const saved = JSON.parse(map.get('hire-and-seek:v1')); assert.equal(saved.review.reflections.pattern, note.value);
    runtime.disposeGame();
    const resumed = environment(t, map); assert.equal(document.querySelector('#resume-panel').hidden, false);
    await resumed.click('#continue-save');
    assert.equal(document.body.dataset.stage, 'review-receipt');
    assert.equal(document.querySelector('#reflection-pattern').value, 'Old labels are not a job check.');
    await resumed.click('[data-review-action="replay-final"]'); await resumed.click('[data-review-action="skip-final"]');
    assert.match(document.querySelector('#receipt-stars').textContent, /3 of 3/);
    await resumed.click('[data-review-action="new-game"]'); resumed.runtime.disposeGame();
    assert.equal(map.has('hire-and-seek:v1'), false, 'page exit cannot recreate a cleared save');
    assert.deepEqual(resumed.assigned, ['/game/']);
});

test('an incompatible save offers a fresh shift and never starts from half-restored state', async t => {
    const map = new Map([['hire-and-seek:v1', '{broken']]);
    const env = environment(t, map);
    assert.equal(document.querySelector('#continue-save').hidden, true);
    assert.match(document.querySelector('#resume-message').textContent, /could not be read/);
    await env.click('#fresh-save'); assert.equal(document.body.dataset.stage, 'first-shift-briefing');
    assert.equal(JSON.parse(map.get('hire-and-seek:v1')).first.phase, 'briefing');
    env.runtime.disposeGame();
});
