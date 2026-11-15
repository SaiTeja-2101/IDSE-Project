const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./helpers/load-source.cjs')();
const {createFirstShift, restoreFirstShift} = load('public/game/learning/firstShift.js');
const {createProgressStore, SAVE_KEY} = load('public/game/learning/persistence.js');

function check(flow, now = () => 0) {
    const checkpoint = JSON.parse(JSON.stringify(flow.checkpoint()));
    const restored = restoreFirstShift(checkpoint, {now});
    assert.deepEqual(restored.getState(), flow.getState());
    return restored;
}
test('every first-shift chapter resumes from recorded choices and regenerates identical models', () => {
    for (const policy of [() => true, () => false, (_, i) => i % 2 === 0]) {
        const flow = createFirstShift(17, {now: () => 0}); check(flow); flow.begin();
        while (['manual', 'round-break'].includes(flow.getState().phase)) {
            const s = flow.getState(); check(flow);
            if (s.phase === 'round-break') flow.nextRound();
            else {
                const pending = s.roundApplicants.filter(p => !Object.hasOwn(s.session.playerDecisions, p.id));
                flow.select(pending[pending.length - 1].id);
                flow.decide(flow.getState().selectedId, policy(s.currentApplicant, s.decisionCount));
            }
        }
        check(flow); flow.train(); check(flow); flow.startScreening(); check(flow);
        for (let i = 0; i < 12; i++) { flow.screenNext(); check(flow); }
        flow.trainArchive(); check(flow); flow.startScreening(); check(flow);
        for (let i = 0; i < 12; i++) { flow.screenNext(); check(flow); }
    }
});
test('closing a timed round preserves remaining time without charging offline time', () => {
    let time = 0;
    const flow = createFirstShift(3, {now: () => time}); flow.begin();
    while (flow.getState().phase === 'manual') flow.decide(flow.getState().selectedId, true);
    flow.nextRound(); time = 12345;
    flow.decide(flow.getState().selectedId, false);
    const saved = JSON.parse(JSON.stringify(flow.checkpoint()));
    time = 1000000;
    const restored = restoreFirstShift(saved, {now: () => time});
    assert.equal(restored.getState().remainingMs, 32655);
    time += 32654; assert.equal(restored.tick(), false);
    time++; assert.equal(restored.tick(), true);
    check(restored, () => time);
    restored.nextRound(); time += 45000; restored.tick(); check(restored, () => time);
});
test('invalid choices, clocks, report totals and phase claims cannot restore a partial game', () => {
    const flow = createFirstShift(17, {now: () => 0}); flow.begin();
    const saved = JSON.parse(JSON.stringify(flow.checkpoint()));
    for (const invalid of [null, {...saved, version: 99}, {...saved, playerDecisions: {foreign: true}}, {...saved, phase: 'receipt'}, {...saved, roundIndex: 9}, {...saved, remainingMs: 42}, {...saved, companyScreened: 12}]) {
        assert.throws(() => restoreFirstShift(invalid));
    }
    while (flow.getState().phase === 'manual') flow.decide(flow.getState().selectedId, true);
    const bad = JSON.parse(JSON.stringify(flow.checkpoint())); bad.roundReports[0].shortlisted = 99;
    assert.throws(() => restoreFirstShift(bad), /counts/);
});
test('versioned storage distinguishes empty, invalid and saved progress and falls back in memory', () => {
    const map = new Map();
    const storage = {getItem(key) { return map.get(key) || null; }, setItem(key, value) { map.set(key, value); }, removeItem(key) { map.delete(key); }};
    const store = createProgressStore(storage), first = createFirstShift(1).checkpoint();
    assert.equal(store.read().kind, 'empty'); assert.equal(store.write({first}), true);
    assert.equal(store.read().kind, 'saved'); assert.deepEqual(restoreFirstShift(store.read().value.first).checkpoint(), first);
    map.set(SAVE_KEY, '{broken'); assert.equal(store.read().kind, 'invalid');
    map.set(SAVE_KEY, JSON.stringify({version: 55, first})); assert.equal(store.read().kind, 'invalid');
    store.clear(); assert.equal(store.read().kind, 'empty');
    const denied = createProgressStore({getItem() { throw new Error(); }, setItem() { throw new Error(); }, removeItem() { throw new Error(); }});
    assert.equal(denied.write({first}), false); assert.equal(denied.available(), false);
    assert.equal(denied.read().kind, 'saved'); denied.clear(); assert.equal(denied.read().kind, 'empty');
    const memory = createProgressStore(null); assert.equal(memory.write({first}), false); assert.equal(memory.read().kind, 'saved');
});
