const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./helpers/load-source.cjs')();
const {createSession} = load('public/game/learning/session.js');
const {createScoutStory, restoreScoutStory, testCopy} = load('public/game/learning/scoutStory.js');
const {predictApplicant, evaluateModel, trainModel, FEATURE_ORDER} = load('public/game/learning/index.js');

function sessionFor(seed, policy = (_, i) => i % 2 === 0) {
    const session = createSession(seed);
    const manual = ['onboarding', 'growth', 'rush'].flatMap(p => session.pools[p]);
    manual.forEach((p, i) => { session.playerDecisions[p.id] = policy(p, i); });
    return session;
}
function start(session, archive = 'company') {
    const flow = createScoutStory(session);
    flow.send(); flow.train(archive); flow.startScanner();
    return flow;
}
function throughScanner(flow) {
    let complaintAt;
    for (let guard = 0; guard < 20; guard++) {
        const state = flow.getState();
        if (state.phase === 'screening') flow.scan();
        else if (state.phase === 'investor') { assert.equal(state.scanIndex, 3); flow.acknowledge(); }
        else if (state.phase === 'mail') {
            complaintAt = state.scanIndex;
            flow.openMail();
            assert.throws(() => flow.reply('another-applicant'), /CV from the email/);
            flow.reply(state.case.applicant.id);
        } else {
            assert.equal(state.phase, 'city-report');
            assert.equal(state.scanIndex, 12);
            return {state, complaintAt};
        }
    }
    assert.fail('Scanner did not finish');
}
test('each archive fits exactly the selected rows plus explicit choices', () => {
    for (const [id, pools] of [['company', ['historical']], ['partner', ['expansion']], ['both', ['historical', 'expansion']]]) {
        const session = createSession(17);
        const [first, second] = session.pools.onboarding;
        session.playerDecisions[second.id] = false;
        session.playerDecisions[first.id] = true;
        const flow = start(session, id), {original, firstReviewed} = flow.getState();
        assert.equal(firstReviewed.id, second.id);
        assert.deepEqual(original.trainingIds, [...pools.flatMap(p => session.pools[p].map(x => x.id)), second.id, first.id]);
        const sample = flow.scan();
        assert.deepEqual(sample.prediction, {id: sample.applicant.id, ...predictApplicant(original, sample.applicant)});
    }
});
test('complaint and routine routes use real screened CVs and keep the same case for the ending', () => {
    let complaintCount = 0, routineCount = 0;
    for (let seed = 0; seed < 20; seed++) {
        const session = sessionFor(seed, seed % 2 ? p => p.assessedReady : (_, i) => i % 2 === 0);
        const flow = start(session);
        const {state, complaintAt} = throughScanner(flow);
        const missed = state.screened.find(p => p.applicant.assessedReady && !p.prediction.decision);
        if (missed) {
            complaintCount++;
            assert.equal(state.case.kind, 'complaint');
            assert.equal(state.case.applicant.id, missed.applicant.id);
            assert.equal(complaintAt, Math.max(3, state.screened.indexOf(missed) + 1));
        } else {
            routineCount++;
            assert.equal(state.case.kind, 'routine');
            assert.equal(complaintAt, 12);
            assert.equal(state.case.applicant.id, state.screened.find(p => p.applicant.assessedReady).applicant.id);
        }
        flow.reopen();
        assert.equal(flow.getState().case.applicant.id, state.case.applicant.id);
        assert.equal(state.cityReport.overallMetrics.total, 12);
    }
    assert.ok(complaintCount && routineCount, 'fixtures must exercise both routes');
});
test('copy experiment isolates one field, reports a decision flip or route change, and handles a leaf', () => {
    const cv = {skill: 66, experience: 5, academy: 'City Academy', city: 'Chennai'};
    const leaf = (id, rate) => ({id, kind: 'leaf', support: 10, positiveLabels: rate * 10, positiveLabelRate: rate});
    const question = (id, feature, featureIndex, left, right) => ({id, kind: 'question', feature, featureIndex, splitValue: 0.5, left, right});
    const model = {configuration: {features: ['city', 'academy']}, root: question('root', 'city', 0,
        question('rootL', 'academy', 1, leaf('rootLL', 0.1), leaf('rootLR', 0.2)), leaf('rootR', 0.9))};
    for (const [field, expected] of [['city', 'decision'], ['academy', 'path']]) {
        const evidence = testCopy(model, cv, field);
        assert.equal(evidence.outcome, expected);
        assert.deepEqual(Object.keys(cv).filter(k => cv[k] !== evidence.copy[k]), [field]);
        assert.equal(evidence.splitIndex, field === 'city' ? 0 : 1);
        assert.deepEqual(evidence.before, predictApplicant(model, cv));
        assert.deepEqual(evidence.after, predictApplicant(model, evidence.copy));
    }
    assert.equal(Object.isFrozen(cv), false);
    assert.equal(cv.city, 'Chennai');
    const constant = {...model, root: leaf('root', 0)};
    assert.equal(testCopy(constant, cv, 'city').outcome, 'same');
    assert.deepEqual(testCopy(constant, cv, 'academy').before.decisionPath, []);
    assert.throws(() => testCopy(model, cv, 'skill'), /city or academy/);
});
test('repairs fit independently, hold out practice and final, and cannot change after lock', () => {
    const session = sessionFor(17);
    const flow = start(session, 'partner');
    throughScanner(flow); flow.reopen(); flow.copy('city'); flow.openRepairs();
    assert.equal(flow.getState().finalResult, null);
    assert.throws(() => flow.lock(), /practice/);
    const {original} = flow.getState();
    const manual = ['onboarding', 'growth', 'rush'].flatMap(p => session.pools[p]).map(p => ({...p, playerDecision: session.playerDecisions[p.id]}));
    const records = [...session.pools.expansion, ...manual];
    for (const [id, config] of [['hide-city', {features: FEATURE_ORDER.filter(f => f !== 'city')}], ['work-tests', {labelSource: 'assessed'}]]) {
        const repaired = trainModel(records, config);
        const report = flow.repair(id);
        assert.deepEqual(report.repaired.overallMetrics, evaluateModel(repaired, session.pools.audit).overallMetrics);
        assert.deepEqual(repaired.trainingIds, original.trainingIds);
        assert.ok(![...session.pools.introductory, ...session.pools.audit, ...session.pools.final].some(p => repaired.trainingIds.includes(p.id)));
    }
    flow.lock();
    assert.equal(flow.getState().finalResult, null);
    assert.throws(() => flow.repair('hide-city'), /Finish/);
    const skipped = restoreScoutStory(session, flow.checkpoint());
    const repaired = trainModel(records, {labelSource: 'assessed'});
    const sample = [];
    while (flow.getState().finalQueue.length) {
        const {finalQueue} = flow.getState();
        const scanned = flow.scanFinal();
        assert.equal(scanned.applicant.id, finalQueue[0].id);
        assert.deepEqual(scanned.prediction, predictApplicant(repaired, scanned.applicant));
        sample.push(scanned);
    }
    assert.equal(new Set(sample.map(item => item.applicant.id)).size, 4);
    assert.deepEqual(restoreScoutStory(session, flow.checkpoint()).getState().finalScreened, sample);
    flow.finishFinal();
    skipped.finishFinal();
    assert.deepEqual(flow.getState().finalResult, skipped.getState().finalResult);
    assert.deepEqual(flow.getState().finalResult.original.cityMetrics, evaluateModel(original, session.pools.final).cityMetrics);
    assert.deepEqual(restoreScoutStory(session, flow.checkpoint()).getState(), flow.getState());
});
