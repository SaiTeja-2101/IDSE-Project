const test = require('node:test');
const assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');
const loader = require('./helpers/load-source.cjs');

test('visible applicants have unique names and remain deterministic across seeds', () => {
    const {generatePools, generatePool} = loader()('public/game/learning/candidates.js');
    for (const seed of [0, 17, 20261030, 'classroom']) {
        const pools = generatePools(seed);
        const visible = ['onboarding', 'growth', 'rush', 'introductory'].flatMap(name => pools[name]);
        assert.equal(new Set(visible.map(p => p.name)).size, 42);
        for (const name of ['onboarding', 'growth', 'rush', 'introductory']) assert.deepEqual(generatePool(seed, name), pools[name]);
    }
});

test('audio unlock retries, muted playback, paused loops and cancelled warnings use the real sound controller', async t => {
    const previousWindow = global.window, previousEvent = global.CustomEvent;
    t.after(() => { global.window = previousWindow; global.CustomEvent = previousEvent; });
    const events = new Map(), jobs = new Set();
    global.CustomEvent = class { constructor(type) { this.type = type; } };
    global.window = {addEventListener(name, fn) { events.set(name, fn); }, removeEventListener(name) { events.delete(name); }, dispatchEvent() {}};
    const manifest = ['ambient', 'warning', 'broken'].map(name => ({name, path: name, volume: 0, loop: name !== 'broken'}));
    let failResume = true, muted = false, nextId = 0;
    const context = {state: 'suspended', resume() { if (failResume) return Promise.reject(new Error('gesture required')); this.state = 'running'; return Promise.resolve(); }};
    class Howl {
        constructor(options) { this.options = options; this.handlers = {}; this.active = new Set(); queueMicrotask(() => this.handlers[options.src[0] === 'broken' ? 'loaderror' : 'load']()); }
        once(name, fn) { this.handlers[name] = fn; }
        on(name, fn) { this.handlers[name] = fn; }
        play(id) { id = id == null ? ++nextId : id; this.active.add(id); return id; }
        playing(id) { return this.active.has(id); }
        pause(id) { this.active.delete(id); }
        stop(id) { this.active.delete(id); }
        unload() {}
    }
    const sound = loader({howler: {Howl, Howler: {ctx: context, mute(value) { muted = value; }}},
        'public/game/controllers/constants.js': {SOUND_MANIFEST: manifest},
        'public/game/controllers/game/gameClock.js': {gameClock: {cancel(job) { jobs.delete(job); }, schedule(callback) { jobs.add(callback); return callback; }}},
    })('public/game/controllers/game/sound.js');
    sound.init(); await sound.load();
    assert.equal(manifest[0].player.options.volume, 0);
    assert.equal(sound.getStatus().failed, 1); assert.equal(sound.getStatus().unavailable, false);
    events.get('keydown')(); await new Promise(resolve => setImmediate(resolve));
    assert.equal(events.has('keydown'), true);
    failResume = false; events.get('pointerdown')(); await new Promise(resolve => setImmediate(resolve));
    assert.equal(context.state, 'running'); assert.equal(events.has('keydown'), false);
    sound.play('ambient'); const id = manifest[0].playerID;
    sound.play('ambient'); assert.equal(manifest[0].playerID, id);
    sound.setGamePaused(true); assert.equal(manifest[0].player.playing(id), false);
    sound.play('warning'); assert.equal(manifest[1].playerID, undefined);
    sound.stop('ambient'); sound.setGamePaused(false);
    assert.equal(manifest[0].player.playing(id), false, 'stopped audio must not restart after pause');
    sound.schedule('warning', 30); assert.equal(jobs.size, 1);
    sound.stop('warning'); assert.equal(jobs.size, 0);
    sound.play('ambient'); sound.setGamePaused(true); sound.setGamePaused(false);
    assert.equal(manifest[0].player.playing(manifest[0].playerID), true);
    assert.equal(sound.toggleVolume(), true); assert.equal(muted, true);
    assert.equal(sound.toggleVolume(), false); assert.equal(muted, false);
    assert.doesNotThrow(() => sound.play('broken'));
});

test('canvas follows its container, disconnects old observers and starts only one render loop', t => {
    const previous = {window: global.window, document: global.document, ResizeObserver: global.ResizeObserver};
    t.after(() => Object.assign(global, previous));
    let requests = 0, cancels = 0, lastObserver;
    const sizes = [], canvas = {hidden: false}, hosts = [];
    global.window = {innerWidth: 1920, innerHeight: 1080, addEventListener() {}, requestAnimationFrame() { return ++requests; }, cancelAnimationFrame() { cancels++; }};
    global.document = {getElementById() { return canvas; }};
    global.ResizeObserver = class { constructor(callback) { this.callback = callback; lastObserver = this; } observe(host) { hosts.push(host); } disconnect() { this.disconnected = true; }};
    class Container { addChild() {} }
    class Application { constructor() { this.stage = new Container(); this.ticker = {}; this.renderer = {render() {}, resize(w, h) { sizes.push([w, h]); }}; } }
    const setup = loader({'pixi.js': {Application, Container, utils: {EventEmitter}, settings: {}, tweenManager: {update() {}}},
        'pixi-tween': {}, debounce: fn => fn,
        'public/game/controllers/game/gameClock.js': {gameClock: {paused: false}},
    })('public/game/controllers/game/gameSetup.js');
    let width = 600;
    const host = {appendChild(child) { assert.equal(child, canvas); }, getBoundingClientRect() { return {width, height: 240}; }};
    setup.mountCanvas(host); assert.deepEqual(sizes.at(-1), [600, 240]); assert.equal(canvas.hidden, false);
    width = 350; lastObserver.callback(); assert.deepEqual(sizes.at(-1), [350, 240]);
    const old = lastObserver;
    setup.mountCanvas(host); assert.equal(old.disconnected, true);
    setup.startTweenManager(); setup.startTweenManager(); assert.equal(requests, 1);
    setup.stopTweenManager(); assert.equal(cancels, 1);
    setup.mountCanvas(null); assert.equal(lastObserver.disconnected, true); assert.equal(canvas.hidden, true);
    const count = sizes.length; lastObserver.callback(); assert.equal(sizes.length, count);
});

test('a timer transition invalidates the pending choice animation without writing twice', async () => {
    const {createFirstShift} = loader()('public/game/learning/firstShift.js');
    const UI = loader({
        'public/game/controllers/game/gameSetup.js': {mountCanvas() {}},
        'public/game/controllers/game/gameClock.js': {gameClock: {paused: false}},
        'public/game/controllers/game/learningSession.js': {setLearningSession() {}},
        'public/game/controllers/common/state.js': {set() {}},
        'public/game/controllers/game/sound.js': {play() {}, stop() {}},
        'public/game/controllers/constants.js': {SOUNDS: {}},
        'public/game/components/pixi/first-shift/first-shift-scene.js': class {},
        'public/game/components/pixi/training-stage/circle-grid.js': class {},
    })('public/game/components/interface/first-shift/first-shift.js').default;
    let time = 0, finish, renders = 0;
    const ui = Object.create(UI.prototype);
    ui.flow = createFirstShift(17, {now: () => time}); ui.flow.begin();
    while (ui.flow.getState().phase === 'manual') ui.flow.decide(ui.flow.getState().selectedId, true);
    ui.flow.nextRound();
    ui.busy = false; ui.disposed = false; ui.generation = 1;
    ui.setBusy = value => { ui.busy = value; }; ui.sync = () => {}; ui.render = () => { renders++; }; ui.announce = () => {};
    ui.scene = {animateDecision() { return new Promise(resolve => { finish = resolve; }); }};
    time = 44999; const pending = ui.decide(false);
    time = 45000; assert.equal(ui.flow.tick(), true);
    ui.generation++; ui.busy = false; finish(); await pending;
    assert.equal(renders, 0, 'old animation cannot repaint the new round result');
    assert.equal(ui.flow.getState().roundReports[1].reviewed, 1);
    assert.equal(ui.flow.getState().roundReports.length, 2);
});

test('switching tabs pauses controls, clock and audio until the player explicitly resumes', t => {
    const old = {window: global.window, document: global.document};
    t.after(() => Object.assign(global, old));
    const documentEvents = new Map(), windowEvents = new Map(), elements = new Map();
    let stops = 0, starts = 0, restored = 0;
    const focus = {isConnected: true, focus() { restored++; }};
    const interactive = {inert: false};
    const element = id => {
        if (!elements.has(id)) elements.set(id, {events: new Map(), setAttribute() {}, addEventListener(name, fn) { this.events.set(name, fn); }, focus() { global.document.activeElement = this; }});
        return elements.get(id);
    };
    global.document = {hidden: false, activeElement: focus,
        body: {dataset: {}, classList: {toggle() {}}},
        getElementById: element, querySelectorAll() { return [interactive]; },
        addEventListener(name, fn) { documentEvents.set(name, fn); }};
    global.window = {addEventListener(name, fn) { windowEvents.set(name, fn); }};
    const ticker = () => ({started: true, stop() { this.started = false; }, start() { this.started = true; }});
    const localTicker = ticker(), sharedTicker = ticker(), paused = [];
    const clock = {paused: false, setPaused(value) { this.paused = value; }};
    const status = {muted: false, unavailable: false, failed: 0};
    const shell = loader({
        'gsap/TweenMax': {TweenMax: {getAllTweens() { return []; }}},
        'pixi.js': {ticker: {shared: sharedTicker}},
        'public/game/controllers/game/gameSetup.js': {pixiApp: {ticker: localTicker}, stopTweenManager() { stops++; }, startTweenManager() { starts++; }},
        'public/game/controllers/game/gameClock.js': {gameClock: clock},
        'public/game/controllers/game/sound.js': {setGamePaused(value) { paused.push(value); }, getStatus() { return status; }, toggleVolume() { status.muted = !status.muted; return status.muted; }},
    })('public/game/components/interface/game-shell/game-shell.js');
    shell.initShell();
    global.document.hidden = true; documentEvents.get('visibilitychange')(); documentEvents.get('visibilitychange')();
    assert.equal(clock.paused, true); assert.equal(interactive.inert, true); assert.equal(stops, 1);
    assert.equal(localTicker.started, false); assert.equal(element('pause-dialog').hidden, false);
    global.document.hidden = false; documentEvents.get('visibilitychange')(); assert.equal(clock.paused, true);
    element('resume-game').events.get('click')();
    assert.equal(clock.paused, false); assert.equal(interactive.inert, false); assert.equal(starts, 1); assert.equal(restored, 1);
    assert.deepEqual(paused, [true, false]);
    status.unavailable = true; windowEvents.get('hire-seek-audio')();
    assert.equal(element('sound-game').disabled, true); assert.equal(element('sound-game').textContent, 'No audio');
});
