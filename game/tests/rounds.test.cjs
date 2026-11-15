const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const load = require('./helpers/load-source.cjs')();
const {createFirstShift} = load('public/game/learning/firstShift.js');

function firstRound(flow, choice = true) {
    flow.begin();
    while (flow.getState().phase === 'manual') flow.decide(flow.getState().selectedId, choice);
}

test('clock boundary rejects a late click and unreviewed records never enter either fit', () => {
    let time = 0;
    const flow = createFirstShift(3, {now: () => time}); firstRound(flow);
    flow.nextRound(); time = 44999;
    assert.equal(flow.decide(flow.getState().selectedId, false), true);
    const late = flow.getState().selectedId;
    time = 45000;
    assert.equal(flow.decide(late, true), false);
    assert.equal(flow.getState().phase, 'round-break');
    assert.equal(flow.getState().roundReports[1].unreviewed, 9);
    assert.equal(Object.prototype.hasOwnProperty.call(flow.getState().session.playerDecisions, late), false);
    flow.nextRound(); time = 90000; assert.equal(flow.tick(), true);
    const ready = flow.getState();
    assert.equal(ready.phase, 'ready'); assert.equal(ready.decisionCount, 4);
    assert.equal(ready.roundReports[2].passed, 0); assert.equal(ready.roundReports[2].unreviewed, 14);
    assert.equal(flow.train().trainingIds.length, 4);
    flow.startScreening(); flow.screenRemaining();
    const company = flow.trainArchive();
    assert.equal(company.trainingIds.length, 164); assert.equal(company.trainingIds.includes(late), false);
});

test('missed shortlist goals never block progression or turn unseen CVs into passes', () => {
    let time = 0; const flow = createFirstShift(11, {now: () => time}); firstRound(flow, false);
    flow.nextRound(); time = 45000; flow.tick();
    flow.nextRound(); time = 90000; flow.tick();
    const s = flow.getState();
    assert.equal(s.decisionCount, 6); assert.ok(s.roundReports.every(r => !r.goalMet));
    assert.deepEqual(s.roundReports.map(r => r.passed), [6, 0, 0]);
    const model = flow.train(); assert.equal(model.constantLabel, 0); assert.equal(model.labelSource, 'player decisions');
});

test('targets finish each round once, cap shortlists at 3/5/8 and exclude the remaining CVs', () => {
    let time = 0; const flow = createFirstShift(17, {now: () => time}); flow.begin();
    while (['manual', 'round-break'].includes(flow.getState().phase)) {
        if (flow.getState().phase === 'round-break') flow.nextRound();
        else {
            const id = flow.getState().selectedId;
            assert.equal(flow.decide(id, true), true);
            assert.equal(flow.decide(id, true), false);
        }
    }
    const s = flow.getState(); assert.equal(s.decisionCount, 16);
    assert.deepEqual(s.roundReports.map(r => r.total), [6, 10, 14]);
    assert.deepEqual(s.roundReports.map(r => r.shortlisted), [3, 5, 8]);
    assert.deepEqual(s.roundReports.map(r => r.reason), ['goal', 'goal', 'goal']);
    assert.deepEqual(s.roundReports.map(r => r.unreviewed), [3, 5, 6]);
    assert.equal(flow.tick(), false);
    assert.equal(flow.decide(s.allManual[5].id, true), false);
    assert.equal(flow.getState().roundReports.length, 3);
    const personal = flow.train();
    assert.equal(personal.trainingIds.length, 16);
    assert.equal(personal.constantLabel, 1);
    assert.ok(s.allManual.filter(p => !Object.hasOwn(s.session.playerDecisions, p.id)).every(p => !personal.trainingIds.includes(p.id)));
    const ids = Object.values(s.session.pools).flat().map(p => p.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(s.allManual.every(p => p.playerDecision === null));
});

test('logical game clock freezes both deadline time and scheduled jobs during pause', () => {
    const fs = require('node:fs'), vm = require('node:vm');
    const babel = require('../game-source/node_modules/@babel/core');
    const code = babel.transformSync(fs.readFileSync(path.resolve(__dirname, '../game-source/public/game/controllers/game/gameClock.js'), 'utf8'), {
        configFile: false, babelrc: false, plugins: [require.resolve('../game-source/node_modules/@babel/plugin-transform-modules-commonjs')],
    }).code;
    let time = 0, nextId = 0; const timers = new Map();
    const context = {exports: {}, performance: {now: () => time}, setTimeout(callback, delay) { const id = ++nextId; timers.set(id, {callback, delay}); return id; }, clearTimeout(id) { timers.delete(id); }};
    vm.runInNewContext(code, context);
    const clock = new context.exports.GameClock();
    const flow = createFirstShift(7, {now: () => clock.now()}); firstRound(flow); flow.nextRound();
    time = 10000; clock.schedule(() => {}, 100); clock.setPaused(true);
    assert.equal(timers.size, 0); assert.equal(flow.getState().remainingMs, 35000);
    time = 100000; clock.setPaused(true); assert.equal(flow.tick(), false);
    clock.setPaused(false); assert.equal(timers.size, 1); assert.equal(flow.getState().remainingMs, 35000);
    time = 134999; assert.equal(flow.tick(), false);
    time = 135000; assert.equal(flow.tick(), true);
});
