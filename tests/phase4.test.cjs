const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const load = require('./helpers/load-source.cjs')();
const {createFirstShift, seedForNewShift} = load('public/game/learning/firstShift.js');
const {predictApplicant, evaluateModel} = load('public/game/learning/index.js');

function makeChoices(flow, policy) {
    flow.begin();
    while (['manual', 'round-break'].includes(flow.getState().phase)) {
        const current = flow.getState();
        if (current.phase === 'round-break') { flow.nextRound(); continue; }
        flow.decide(current.selectedId, policy(current.currentApplicant, current.decisionCount));
    }
}

test('training waits for the rounds, and unopened or duplicate choices cannot change labels', () => {
    const flow = createFirstShift(20261030);
    assert.throws(() => flow.train(), /unavailable/);
    assert.throws(() => flow.startScreening(), /unavailable/);
    flow.begin();
    const before = flow.getState();
    assert.throws(() => flow.decide(before.session.pools.audit[0].id, true), /Open/);
    const person = before.currentApplicant;
    assert.throws(() => flow.decide(person.id, 'shortlist'), /Shortlist or Pass/);
    assert.equal(flow.decide(person.id, true), true);
    assert.equal(flow.decide(person.id, false), false);
    assert.equal(flow.getState().session.playerDecisions[person.id], true);
    assert.equal(flow.getState().decisionCount, 1);
    assert.equal(flow.getState().session.models.original, null);
    assert.equal(flow.getState().session.pools.onboarding.filter(p => p.playerDecision === null).length, 6);
    assert.throws(() => flow.train(), /unavailable/);
    const last = before.session.pools.onboarding[5];
    flow.select(last.id);
    assert.equal(flow.getState().selectedId, last.id);
    assert.equal(flow.select(person.id), false);
});

for (const [name, policy] of [['all shortlist', () => true], ['all pass', () => false], ['mixed', (_, i) => i % 2 === 0]]) {
    test(name + ': three rounds fit player-only and company models on distinct labelled records', () => {
        const flow = createFirstShift(20261030);
        makeChoices(flow, policy);
        const ready = flow.getState();
        assert.equal(ready.phase, 'ready');
        assert.equal(ready.decisionCount, name === 'all shortlist' ? 16 : name === 'all pass' ? 30 : 29);
        assert.equal(ready.results.length, 0);
        assert.equal(ready.session.models.original, null);
        const personal = flow.train();
        assert.equal(personal.trainingIds.length, ready.decisionCount);
        assert.equal(personal.labelSource, 'player decisions');
        assert.deepEqual(personal.configuration.features, ['skill', 'experience', 'academy', 'city']);
        assert.equal(flow.getState().session.models.original, null);
        flow.startScreening(); flow.screenRemaining();
        assert.equal(flow.getState().phase, 'personal-summary');
        assert.equal(flow.personalReport().total, ready.session.pools.introductory.length);
        const snapshot = flow.trainArchive();
        const trained = flow.getState();
        assert.equal(trained.phase, 'trained');
        assert.equal(trained.session.models.original, snapshot);
        assert.equal(trained.session.models.current, snapshot);
        assert.equal(snapshot.trainingIds.length, ready.session.pools.historical.length + ready.decisionCount);
        assert.equal(snapshot.labelSource, 'historical and player decisions');
        assert.deepEqual(snapshot.configuration.features, ['skill', 'experience', 'academy', 'city']);
        assert.equal(snapshot.root.positiveLabels, ready.session.pools.historical.filter(p => p.historicalDecision).length + Object.values(ready.session.playerDecisions).filter(Boolean).length);
        const trainingIds = new Set(snapshot.trainingIds);
        for (const pool of ['introductory', 'audit', 'final']) trained.session.pools[pool].forEach(p => assert.equal(trainingIds.has(p.id), false));
        assert.ok(Object.isFrozen(snapshot.root));
        assert.equal(flow.trainArchive(), snapshot);
        assert.equal(flow.getState().session.playerModel, personal);
        flow.startScreening();
        const first = flow.screenNext();
        assert.equal(first.applicantId, trained.session.pools.introductory[0].id);
        const rest = flow.screenRemaining();
        assert.equal(rest.length, 12);
        assert.equal(new Set(rest.map(r => r.applicantId)).size, 12);
        const final = flow.getState();
        assert.equal(final.phase, 'summary');
        assert.equal(final.session.models.original, snapshot);
        assert.equal(final.session.introductoryResults.length, 12);
        assert.deepEqual(final.playerResults.map(r => r.applicantId), final.companyResults.map(r => r.applicantId));
        final.results.forEach((result, index) => {
            const expected = predictApplicant(snapshot, final.session.pools.introductory[index]);
            assert.equal(result.decision, expected.decision);
            assert.deepEqual(result.decisionPath, expected.decisionPath);
        });
        const report = flow.report();
        assert.equal(report.changedChoices, final.companyResults.filter((r, i) => r.decision !== final.playerResults[i].decision).length);
        const expected = evaluateModel(snapshot, final.session.pools.introductory, 0.5, 'historical');
        assert.deepEqual(report.overallMetrics, expected.overallMetrics);
        assert.equal(report.metricLabel, 'Match to past hiring decisions');
        assert.equal(report.overallMetrics.ready, null);
        assert.equal(report.opportunityGap, null);
        assert.throws(() => flow.screenNext(), /unavailable/);
        assert.throws(() => flow.startScreening(), /unavailable/);
    });
}

test('step-by-step and immediate screening produce the same immutable original and report', () => {
    const play = fast => {
        const flow = createFirstShift(17);
        makeChoices(flow, person => person.skill >= 70);
        flow.train(); flow.startScreening(); flow.screenRemaining(); flow.trainArchive(); flow.startScreening();
        if (fast) flow.screenRemaining();
        else for (let i = 0; i < 12; i++) flow.screenNext();
        return {state: flow.getState(), report: flow.report()};
    };
    assert.deepEqual(play(true), play(false));
});

test('fresh shift seeds use browser randomness, while an explicit development seed is reproducible', () => {
    let calls = 0;
    const crypto = {getRandomValues(values) { values[0] = ++calls; return values; }};
    assert.equal(seedForNewShift('', crypto), 1);
    assert.equal(seedForNewShift('', crypto), 2);
    assert.equal(seedForNewShift('?seed=20261030', crypto), 20261030);
    assert.equal(seedForNewShift('?seed=0', crypto), 0);
    assert.equal(seedForNewShift('?seed=not-a-seed', crypto), 3);
    assert.equal(seedForNewShift('?seed=99999999999', crypto), 4);
    assert.equal(seedForNewShift('', null, 1234567), 1234567);
});

function loadUI() {
    const clock = {paused: false};
    const uiLoad = require('./helpers/load-source.cjs')({
        'public/game/controllers/game/gameClock.js': {gameClock: clock},
        'public/game/controllers/game/gameSetup.js': {mountCanvas() {}},
        'public/game/controllers/game/learningSession.js': {setLearningSession() {}},
        'public/game/controllers/common/state.js': {set() {}},
        'public/game/controllers/game/sound.js': {play() {}, stop() {}},
        'public/game/controllers/constants.js': {SOUNDS: {BUTTON_CLICK: 'click'}},
        'public/game/components/pixi/first-shift/first-shift-scene.js': class {},
        'public/game/components/pixi/training-stage/circle-grid.js': class {},
    });
    return {UI: uiLoad('public/game/components/interface/first-shift/first-shift.js').default, clock};
}

test('actual keyboard handler supports S/P and navigation, ignores held keys and pause', () => {
    const {UI, clock} = loadUI();
    const ui = Object.create(UI.prototype);
    ui.flow = createFirstShift(42); ui.flow.begin();
    ui.busy = false; ui.disposed = false;
    ui.render = () => {}; ui.announce = () => {}; ui.find = () => ({focus() {}});
    ui.decide = async decision => { const s = ui.flow.getState(); ui.flow.decide(s.selectedId, decision); };
    function key(name, extra = {}) {
        const event = {key: name, target: {closest() { return null; }}, preventDefault() {}, ...extra};
        ui.keydown(event);
    }
    const first = ui.flow.getState().selectedId;
    key('ArrowRight'); assert.notEqual(ui.flow.getState().selectedId, first);
    key('ArrowLeft'); assert.equal(ui.flow.getState().selectedId, first);
    key('s', {repeat: true}); assert.equal(ui.flow.getState().decisionCount, 0);
    clock.paused = true; key('s'); assert.equal(ui.flow.getState().decisionCount, 0);
    clock.paused = false; key('s'); assert.equal(ui.flow.getState().decisionCount, 1);
    key('p'); assert.equal(ui.flow.getState().decisionCount, 2);
    assert.equal(ui.flow.getState().session.playerDecisions[first], true);
    key('s', {ctrlKey: true}); assert.equal(ui.flow.getState().decisionCount, 2);
});

test('actual click handler locks during an applicant animation and prevents a double submission', async () => {
    const {UI, clock} = loadUI();
    const ui = Object.create(UI.prototype);
    ui.flow = createFirstShift(42); ui.flow.begin();
    ui.busy = false; ui.disposed = false;
    ui.root = {setAttribute() {}, querySelectorAll() { return []; }};
    ui.find = () => ({disabled: false, focus() {}}); ui.render = () => {}; ui.announce = () => {};
    let finish;
    ui.scene = {animateDecision() { return new Promise(resolve => { finish = resolve; }); }};
    const event = {target: {closest(selector) { return selector === 'button[data-action]' ? {dataset: {action: 'shortlist'}} : null; }}};
    ui.click(event); ui.click(event);
    assert.equal(ui.busy, true);
    assert.equal(ui.flow.getState().decisionCount, 1);
    clock.paused = true; ui.click(event); assert.equal(ui.flow.getState().decisionCount, 1);
    clock.paused = false; finish();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(ui.busy, false);
    assert.equal(ui.flow.getState().decisionCount, 1);
});

test('active Pug route has one first-shift surface, native actions, valid CV units, and no old game overlays', () => {
    const pug = require('../game-source/node_modules/pug');
    const html = pug.renderFile(path.resolve(__dirname, '../game-source/views/pages/game/index.pug'));
    for (const action of ['begin', 'next-round', 'shortlist', 'pass', 'train', 'watch', 'next', 'finish', 'archive', 'investigate']) {
        assert.match(html, new RegExp('<button[^>]*data-action="' + action + '"'));
    }
    assert.equal((html.match(/id="first-shift"/g) || []).length, 1);
    assert.match(html, /max="100"/);
    assert.match(html, /max="5"/);
    assert.match(html, /MATCH TO PAST HIRING DECISIONS/);
    assert.doesNotMatch(html, /id="js-task-timer"|id="dataset-overlay"|id="TransitionOverlay"/);
    assert.doesNotMatch(html, /js-titlepage|play-mode|MobileOrientationOverlay|ApplicantQueue|ChapterTrack/);
});

test('retained training effect removes its timers, resize handler, and ticker callback on exit', () => {
    const {EventEmitter} = require('node:events');
    const events = new EventEmitter();
    const scheduled = new Set();
    const callbacks = new Set();
    const ticker = {started: true, elapsedMS: 16, add(callback) { callbacks.add(callback); }, remove(callback) { callbacks.delete(callback); }};
    const children = [];
    class Graphic {
        clear() {} beginFill() {} drawCircle() {} endFill() {}
        destroy() { this.destroyed = true; children.splice(children.indexOf(this), 1); }
    }
    const gridLoad = require('./helpers/load-source.cjs')({
        'pixi.js': {Graphics: Graphic},
        'public/game/controllers/common/utils.js': {uv2px: () => 80},
        'public/game/controllers/game/gameSetup.js': {eventEmitter: events, ticker, pixiApp: {screen: {width: 1200, height: 800}}, mlTrainingStageContainer: {addChild(child) { children.push(child); }}},
        'public/game/controllers/constants.js': {EVENTS: {RESIZE: 'resize'}},
        'public/game/controllers/game/gameClock.js': {gameClock: {schedule(callback) { const job = {callback}; scheduled.add(job); return job; }, cancel(job) { scheduled.delete(job); }}},
    });
    const Grid = gridLoad('public/game/components/pixi/training-stage/circle-grid.js').default;
    const originalWindow = global.window;
    global.window = {matchMedia: () => ({matches: false})};
    try {
        for (let visit = 0; visit < 3; visit++) {
            const grid = new Grid();
            grid.startFlickering(); grid.startFlickering();
            assert.equal(callbacks.size, 1);
            assert.equal(events.listenerCount('resize'), 1);
            assert.equal(scheduled.size, 1);
            const pending = [...scheduled];
            grid.destroy();
            assert.equal(callbacks.size, 0);
            assert.equal(events.listenerCount('resize'), 0);
            assert.equal(scheduled.size, 0);
            assert.equal(children.length, 0);
            assert.equal(ticker.started, true);
            pending.forEach(job => job.callback());
            assert.equal(scheduled.size, 0);
        }
    } finally {
        if (originalWindow === undefined) delete global.window; else global.window = originalWindow;
    }
});
