// DOM integration, not a browser renderer. Pixi/audio are isolated; actual Pug,
// UI handlers, FSM, learning engine, saves and reports run together.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {parseHTML} = require('../game-source/node_modules/linkedom');
const pug = require('../game-source/node_modules/pug');
const loader = require('./helpers/load-source.cjs');

function environment(t, map = new Map(), factoryError = null) {
    const before = {window: global.window, document: global.document};
    t.after(() => Object.assign(global, before));
    const dom = parseHTML(pug.renderFile(path.resolve(__dirname, '../game-source/views/pages/game/index.pug')));
    global.window = dom.window; global.document = dom.document;
    const media = {matches: false, addEventListener() {}, removeEventListener() {}};
    Object.defineProperty(dom.window, 'matchMedia', {configurable: true, value: () => media});
    const focusLog = [];
    t.mock.method(dom.window.HTMLElement.prototype, 'focus', function () { focusLog.push(this); });
    const dialogProto = Object.getPrototypeOf(document.createElement('dialog'));
    Object.defineProperties(dialogProto, {
        showModal: {configurable: true, value() { this.setAttribute('open', ''); }},
        close: {configurable: true, value() { this.removeAttribute('open'); }},
        open: {configurable: true, get() { return this.hasAttribute('open'); }},
    });
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
    const factories = [];
    class Factory {
        constructor() { this.moves = []; this.motion = {matches: false}; factories.push(this); }
        setQueue(queue) { this.queue = queue; }
        animate(sample) {
            assert.equal(this.queue[0].id, sample.applicant.id);
            this.moves.push(sample);
            return this.moves.length === 1 && factoryError ? Promise.reject(factoryError) : Promise.resolve();
        }
        destroy() { this.destroyed = true; }
    }
    const load = loader({
        'public/game/controllers/game/gameClock.js': {gameClock: clock},
        'public/game/controllers/game/gameSetup.js': {mountCanvas() {}, stopTweenManager() {}},
        'public/game/controllers/common/state.js': {set(key, value) { if (key === 'stage') document.body.dataset.stage = value; }},
        'public/game/controllers/game/sound.js': {play() {}, stop() {}},
        'public/game/controllers/constants.js': {SOUNDS: {}},
        'public/game/components/pixi/first-shift/first-shift-scene.js': Scene,
        'public/game/components/pixi/scout-factory/scout-factory.js': Factory,
        'public/game/components/pixi/training-stage/circle-grid.js': class { destroy() {} },
    });
    const runtime = load('public/game/controllers/game/stateManager.js'); runtime.gameFSM.startGame();
    async function click(selector) {
        const button = document.querySelector(selector); assert.ok(button, selector);
        assert.equal(button.disabled, false, selector + ' is disabled');
        assert.equal(button.closest('[hidden]'), null, selector + ' is hidden');
        button.click(); await new Promise(resolve => setImmediate(resolve));
        const error = document.querySelector('#story-error');
        if (error && !error.hidden) assert.fail(error.textContent);
    }
    return {runtime, clock, map, assigned, scenes, factories, click, load, dom, media, focusLog};
}

test('the new UI runs from hiring to its computed receipt and keeps the result locked on resume', async t => {
    const env = environment(t), {click, clock, map, runtime} = env;
    const act = (id, value) => click('[data-story-action="' + id + '"]' + (value ? '[data-value="' + value + '"]' : ''));
    const stage = () => document.body.dataset.stage;
    const saved = () => JSON.parse(map.get('hire-and-seek:v2'));
    await click('[data-action="begin"]');
    for (let round = 0; round < 3; round++) {
        while (stage() === 'first-shift-manual') {
            await click('[data-action="open-cv"]');
            await click('[data-action="shortlist"]');
        }
        if (round < 2) await click('[data-action="next-round"]');
    }
    assert.match(document.querySelector('#saved-choice-count').textContent, /16/);
    await click('[data-action="handoff"]');
    assert.equal(stage(), 'scout-handoff');
    await act('send');
    assert.equal(document.querySelectorAll('.ArchiveOption details').length, 3);
    assert.match(document.querySelector('.ArchiveSample').textContent, /Bengaluru: \d+ of \d+ qualified/);
    await act('train', 'both'); clock.advance(650);
    await new Promise(resolve => setImmediate(resolve));
    assert.match(document.querySelector('#story-body').textContent, /256 examples/);
    const factory = key => document.querySelector('#factory-' + key);
    await act('start'); await act('one');
    assert.match(factory('progress').textContent, /^1 of 12/);
    await act('run');
    assert.equal(stage(), 'scout-investor');
    assert.equal(saved().review.actions.filter(a => a[0] === 'scan').length, 3);
    assert.equal(factory('board').hidden, false);
    assert.equal(env.factories.length, 1);
    assert.equal(env.factories[0].moves.length, 3);
    assert.equal(Number(factory('shortlisted').textContent) + Number(factory('passed').textContent), 3);
    await act('ack');
    if (stage() === 'scout-screening') await act('run');
    assert.equal(stage(), 'scout-mail');
    assert.equal(factory('board').hidden, false);
    assert.equal(env.factories.length, 1);
    await act('open');
    assert.equal(stage(), 'scout-inspector');
    assert.equal(env.factories[0].destroyed, true);
    assert.equal(document.querySelector('[data-story-action="reply"]').disabled, true);

    const {restoreFirstShift} = env.load('public/game/learning/firstShift.js');
    const {restoreScoutStory} = env.load('public/game/learning/scoutStory.js');
    const readFlow = () => restoreScoutStory(restoreFirstShift(saved().first).getState().session, saved().review);
    const caseId = readFlow().getState().case.applicant.id;
    const otherId = readFlow().getState().screened.find(item => item.applicant.id !== caseId).applicant.id;
    env.media.matches = true;
    const opened = () => document.querySelector('#inspector-cv-dialog[open]');
    await act('select', otherId);
    assert.ok(opened());
    assert.equal(opened().querySelector('[data-story-action="reply"]').disabled, true);
    await act('close-cv');
    assert.equal(opened(), null);
    assert.equal(env.focusLog.at(-1).dataset.value, otherId);
    await act('select', caseId);
    assert.equal(opened().querySelector('[data-story-action="reply"]').disabled, false);
    const cancelled = new window.Event('cancel', {cancelable: true});
    opened().dispatchEvent(cancelled);
    assert.equal(cancelled.defaultPrevented, true);
    assert.equal(opened(), null);
    assert.equal(env.focusLog.at(-1).dataset.value, caseId);
    await act('select', caseId);
    await click('#inspector-cv-dialog[open] [data-story-action="reply"]');
    assert.equal(opened(), null);
    env.media.matches = false;
    if (stage() === 'scout-screening') await act('run');
    assert.equal(stage(), 'scout-city-report');
    await act('reopen');
    assert.equal(readFlow().getState().case.applicant.id, caseId);
    assert.equal(document.querySelector('[data-story-action="repairs"]').disabled, true);
    await act('copy'); await act('repairs'); await act('repair', 'hide-city'); await act('repair', 'work-tests');
    assert.match(document.querySelector('#story-body').textContent, /Practice: Learn from work tests/);
    await act('lock'); await act('final-one');
    assert.equal(factory('model').textContent, 'REPAIRED SCOUT');
    assert.match(factory('progress').textContent, /^1 of 4 preview CVs/);
    assert.equal(Number(factory('shortlisted').textContent) + Number(factory('passed').textContent), 1);
    const previewResume = environment(t, map);
    await previewResume.click('#continue-save');
    assert.match(factory('progress').textContent, /^1 of 4 preview CVs/);
    assert.equal(previewResume.factories[0].queue.length, 3);
    previewResume.runtime.disposeGame();
    global.window = env.dom.window;
    global.document = env.dom.document;
    await act('finish');
    assert.equal(stage(), 'scout-final-results');
    assert.match(document.querySelector('#story-title').textContent, /200 CV results/);
    assert.match(document.querySelector('#story-body').textContent, /Qualified people missed/);
    const resultsData = readFlow().getState();
    assert.deepEqual([...document.querySelectorAll('.FinalExample summary')].map(el => el.textContent.split(' · ').at(-1)),
        resultsData.finalExamples.map(item => item.applicant.name));
    const resultResume = environment(t, new Map(map));
    await resultResume.click('#continue-save');
    assert.equal(stage(), 'scout-final-results');
    resultResume.runtime.disposeGame();
    global.window = env.dom.window;
    global.document = env.dom.document;
    await act('final-recap');
    assert.equal(stage(), 'scout-debrief');
    assert.match(document.querySelector('.RecapProgress').textContent, /1 OF 3/);
    await act('answer', 'skill'); await act('answer', 'pass');
    assert.match(document.querySelector('#story-feedback').textContent, /recorded/);
    await act('answer', 'shortlist');
    assert.match(document.querySelector('#story-body').textContent, /Original CV \(1 of 2\)/);
    let copyHandoffs = 0;
    while (readFlow().getState().lesson.part.endsWith('-path')) {
        const {lesson} = readFlow().getState();
        if (lesson.part === 'copy-path' && lesson.index === 0) {
            assert.match(document.querySelector('#story-body').textContent, /Original CV complete/);
            assert.match(document.querySelector('#story-body').textContent, /see the same questions again/);
            await act('lesson-copy');
            assert.match(document.querySelector('#story-body').textContent, /Test copy \(2 of 2\)/);
            copyHandoffs++;
        }
        if (lesson.step) assert.ok(document.querySelector('#story-body').textContent.includes('Question ' + (lesson.index + 1) + ' of ' + lesson.questionCount));
        await act('answer', lesson.step?.branch || 'continue');
    }
    assert.equal(copyHandoffs, 1);
    assert.match(document.querySelector('#story-body').textContent, /Tree replay complete/);
    const result = readFlow().getState().finalResult;
    const a = result.original.overallMetrics.falseNegative, b = result.repaired.overallMetrics.falseNegative;
    await act('answer', a === b ? 'same' : a < b ? 'original' : 'repaired');
    assert.equal(stage(), 'scout-walkthrough');
    const runText = () => document.querySelector('.RunScene').textContent;
    assert.match(runText(), /Inside a training example/);
    const {firstReviewed, experiment} = readFlow().getState();
    assert.ok(runText().includes(firstReviewed.name));
    await act('run-feature', 'city');
    assert.ok(runText().includes('City: ' + firstReviewed.city));
    await act('run-answer', 'test');
    assert.match(runText(), new RegExp(firstReviewed.assessedReady ? 'Qualified' : 'Did not qualify'));
    await act('run-step', 'next');
    const depth = Math.max(experiment.before.decisionPath.length, experiment.after.decisionPath.length);
    for (let i = 0; i < depth; i++) await act('run-branch', 'next');
    assert.equal(document.querySelectorAll('.RunFork').length, experiment.before.decisionPath.length + experiment.after.decisionPath.length);
    assert.equal(document.querySelectorAll('.RunStamp').length, 2);
    await act('run-step', 'next');
    await act('run-model', 'repaired');
    assert.match(document.querySelector('.RunCard--changed').textContent, /Who passed the work test/);
    await act('run-step', 'next');
    const shownCounts = () => [...document.querySelectorAll('.RunBarRow strong')].map(el => el.textContent);
    assert.deepEqual(shownCounts(), [String(a), String(b)]);
    await act('run-metric', 'mistaken');
    assert.deepEqual(shownCounts(), [result.original, result.repaired].map(r => String(r.overallMetrics.falsePositive)));
    await act('run-metric', 'city');
    assert.deepEqual(shownCounts(), ['Bengaluru', 'Chennai'].flatMap(city => [result.original, result.repaired].map(r => {
        const m = r.cityMetrics[city]; return m.truePositive + ' of ' + m.ready + ' qualified people';
    })));
    assert.equal(saved().review.walkthrough, 'open');
    const continued = environment(t, new Map(map));
    await continued.click('#continue-save');
    assert.equal(stage(), 'scout-walkthrough');
    assert.match(runText(), /Inside a training example/);
    await continued.click('[data-story-action="run-close"]');
    assert.equal(stage(), 'scout-receipt');
    continued.runtime.disposeGame();
    global.window = env.dom.window;
    global.document = env.dom.document;
    await act('run-close');
    assert.equal(stage(), 'scout-receipt');
    assert.deepEqual(readFlow().receipt().final, result);
    const legacyReceipt = {...saved().review, actions: saved().review.actions.filter(([action]) => action !== 'continueDebrief')};
    delete legacyReceipt.walkthrough;
    const oldSession = restoreFirstShift(saved().first).getState().session;
    assert.deepEqual(restoreScoutStory(oldSession, legacyReceipt).receipt(), readFlow().receipt());
    const firstAnswer = legacyReceipt.actions.findIndex(([action]) => action === 'answer');
    const partial = restoreScoutStory(oldSession, {...legacyReceipt, actions: legacyReceipt.actions.slice(0, firstAnswer + 1)});
    assert.equal(partial.getState().lesson.part, 'label');
    assert.equal(document.querySelector('[data-story-action="download"]').disabled, false);
    runtime.disposeGame();
    const resumed = environment(t, map);
    await resumed.click('#continue-save');
    assert.equal(stage(), 'scout-receipt');
    assert.equal(document.querySelector('[data-story-action="lock"]'), null);
    await resumed.click('[data-story-action="run-open"]');
    assert.match(runText(), /Inside a training example/);
    await resumed.click('[data-story-action="run-close"]');
    await resumed.click('[data-story-action="new"]'); resumed.runtime.disposeGame();
    assert.equal(map.has('hire-and-seek:v2'), false);
    assert.deepEqual(resumed.assigned, ['/game/']);
});

test('legacy saves stay intact and a malformed new save offers Start fresh', async t => {
    const map = new Map([['hire-and-seek:v1', 'old save'], ['hire-and-seek:v2', '{broken']]);
    const env = environment(t, map);
    assert.equal(document.querySelector('#continue-save').hidden, true);
    await env.click('#fresh-save');
    assert.equal(document.body.dataset.stage, 'first-shift-briefing');
    assert.equal(JSON.parse(map.get('hire-and-seek:v2')).first.phase, 'briefing');
    assert.equal(map.get('hire-and-seek:v1'), 'old save');
    env.runtime.disposeGame();
});

test('a factory animation failure keeps the computed decisions and advances to mail', async t => {
    const error = new Error('Renderer unavailable');
    t.mock.method(console, 'warn', () => {});
    const env = environment(t, new Map(), error);
    const act = (id, value) => env.click('[data-story-action="' + id + '"]' + (value ? '[data-value="' + value + '"]' : ''));
    await env.click('[data-action="begin"]');
    for (let round = 0; round < 3; round++) {
        for (let i = 0; i < [3, 5, 8][round]; i++) {
            await env.click('[data-action="open-cv"]');
            await env.click('[data-action="shortlist"]');
        }
        if (round < 2) await env.click('[data-action="next-round"]');
    }
    await env.click('[data-action="handoff"]');
    await act('send'); await act('train', 'company'); env.clock.advance(650);
    await new Promise(resolve => setImmediate(resolve));
    await act('start'); await act('run');
    assert.equal(env.factories[0].destroyed, true);
    assert.equal(document.querySelector('#factory-canvas').hidden, true);
    assert.equal(document.body.dataset.stage, 'scout-investor');
    assert.match(document.querySelector('#factory-progress').textContent, /^3 of 12/);
    assert.equal(console.warn.mock.callCount(), 1);
    await act('ack');
    if (document.body.dataset.stage === 'scout-screening') await act('run');
    assert.equal(document.body.dataset.stage, 'scout-mail');
    env.runtime.disposeGame();
});

test('time on the Continue screen does not use up a saved round', async t => {
    const env = environment(t);
    await env.click('[data-action="begin"]');
    for (let i = 0; i < 3; i++) {
        await env.click('[data-action="open-cv"]');
        await env.click('[data-action="shortlist"]');
    }
    await env.click('[data-action="next-round"]');
    env.clock.advance(7000);
    env.runtime.disposeGame();
    const resumed = environment(t, env.map);
    resumed.clock.advance(60000);
    await resumed.click('#continue-save');
    assert.equal(document.querySelector('#round-clock').textContent, '38s left');
    await resumed.click('[data-action="open-cv"]');
    await resumed.click('[data-action="shortlist"]');
    assert.equal(document.querySelector('#round-goal').textContent, 'Shortlisted 1 of 5');
    resumed.clock.advance(38000);
    assert.equal(document.body.dataset.stage, 'first-shift-round-break');
    resumed.runtime.disposeGame();
});
