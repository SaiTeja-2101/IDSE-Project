const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./helpers/load-source.cjs')();
const {createFirstShift} = load('public/game/learning/firstShift.js');
const {createJourney, restoreJourney, scoreReport, exportSession} = load('public/game/learning/journey.js');
const {predictApplicant, evaluateModel, trainModel} = load('public/game/learning/index.js');

function firstSession(seed = 17, policy = () => true) {
    const flow = createFirstShift(seed, {now: () => 0}); flow.begin();
    while (['manual', 'round-break'].includes(flow.getState().phase)) {
        const s = flow.getState();
        if (s.phase === 'round-break') flow.nextRound(); else flow.decide(s.selectedId, policy(s.currentApplicant, s.decisionCount));
    }
    flow.train(); flow.startScreening(); flow.screenRemaining(); flow.trainArchive(); flow.startScreening(); flow.screenRemaining();
    return flow.getState().session;
}
function workshop(seed = 17, policy) {
    const session = firstSession(seed, policy), flow = createJourney(session);
    const ids = flow.getState().applicants.map(p => p.id);
    flow.inspect(ids[0]); flow.inspect(ids[1]); flow.openAudit(); flow.openWorkshop();
    return {session, flow};
}
test('investigation uses a real missed ready applicant or an honest audit branch and charges once', () => {
    const session = firstSession(), flow = createJourney(session), s = flow.getState();
    assert.equal(s.audit, null); assert.equal(s.receipt, null);
    if (s.complaintId) {
        const person = session.pools.audit.find(p => p.id === s.complaintId);
        assert.equal(person.assessedReady, true); assert.equal(predictApplicant(session.models.original, person).decision, false);
    }
    assert.throws(() => flow.openAudit(), /two different/);
    assert.equal(flow.inspect(), true); assert.equal(flow.inspect(), false);
    assert.equal(flow.getState().credits, 7);
    assert.equal(flow.getState().evidence.assessment, s.evidence.applicant.assessedReady);
    const other = s.applicants.find(p => p.id !== s.selectedId);
    flow.inspect(other.id); flow.openAudit();
    assert.equal(flow.getState().audit.overallMetrics.total, 80);
    const actual = predictApplicant(s.original, s.evidence.applicant);
    assert.deepEqual(s.evidence.prediction.decisionPath, actual.decisionPath);
});
test('workshop purchases, refunds, label replacement and audit feedback commit atomically', () => {
    const {session, flow} = workshop();
    flow.toggle('assess'); assert.equal(flow.getState().credits, 2);
    flow.toggle('expand'); assert.equal(flow.getState().credits, 0);
    const full = flow.getState();
    assert.equal(full.current.labelSource, 'independent assessments');
    assert.equal(full.current.trainingIds.length, session.models.original.trainingIds.length + 80);
    assert.throws(() => flow.toggle('hide-city'), /enough credits/);
    assert.deepEqual(flow.getState(), full);
    flow.undo(); assert.equal(flow.getState().credits, 2);
    flow.toggle('hide-city'); flow.toggle('hide-academy');
    const fixed = flow.getState();
    assert.deepEqual(fixed.current.configuration.features, ['skill', 'experience']);
    assert.ok(session.pools.audit.every(p => !fixed.current.trainingIds.includes(p.id)));
    assert.ok(session.pools.final.every(p => !fixed.current.trainingIds.includes(p.id)));
    assert.deepEqual(fixed.audit, evaluateModel(fixed.current, session.pools.audit, fixed.threshold));
    flow.toggle('assess'); assert.equal(flow.getState().credits, 4);
    assert.equal(flow.getState().current.labelSource, 'historical and player decisions');
    assert.equal(flow.getState().original, session.models.original);
    assert.throws(() => flow.setThreshold(0.53), /steps of 5/);
    flow.setThreshold(0.9); assert.equal(flow.getState().threshold, 0.9);
});
test('deployment locks tuning, final animations follow computed predictions and receipt/export agree', () => {
    const {session, flow} = workshop();
    flow.toggle('assess'); flow.toggle('hide-city'); flow.toggle('hide-academy');
    flow.deploy();
    assert.equal(flow.getState().receipt, null);
    assert.throws(() => flow.receipt(), /not available/);
    assert.throws(() => flow.toggle('expand'), /not available/);
    for (let i = 0; i < 12; i++) {
        const result = flow.nextFinal();
        assert.equal(result.applicant.id, session.pools.final[i * 17].id);
        assert.equal(result.prediction.decision, predictApplicant(flow.getState().current, result.applicant).decision);
    }
    const receipt = flow.receipt(); assert.equal(receipt.current.overallMetrics.total, 200);
    assert.deepEqual(receipt.current.cityMetrics, evaluateModel(flow.getState().current, session.pools.final).cityMetrics);
    assert.equal(receipt.score.stars, 3); assert.equal(receipt.creditsRemaining, 0);
    flow.reflect({pattern: 'The old labels mattered.', transfer: 'Try both backgrounds for each item.'});
    assert.deepEqual(JSON.parse(exportSession(flow)), flow.receipt());
    const before = flow.receipt(); flow.replayFinal(); flow.skipFinal(); assert.deepEqual(flow.receipt(), before);
});
test('all four endings and exact score boundaries use counts rather than rounded percentages', () => {
    function report(correct, total, a, b, ready = 100) { return {overallMetrics: {truePositive: 0, trueNegative: correct, total}, cityMetrics: {
        Bengaluru: {truePositive: a, ready}, Chennai: {truePositive: b, ready}}, opportunityGap: Math.abs(a - b) / ready}; }
    assert.equal(scoreReport(report(85, 100, 90, 75)).ending, 'Trust Earned');
    assert.equal(scoreReport(report(84, 100, 90, 75)).ending, 'The Unchecked Shortlist');
    assert.equal(scoreReport(report(85, 100, 91, 75)).ending, 'A Problem Beneath the Numbers');
    assert.equal(scoreReport(report(84, 100, 91, 75)).ending, 'Recruitment Recalled');
    assert.equal(scoreReport(report(85, 100, 90, 74)).reach, false);
    assert.equal(scoreReport(report(85, 100, 90, 75)).gap, true);
    assert.equal(scoreReport(report(86, 100, 90, 76)).stars, 3);
    assert.equal(scoreReport(report(85, 100, 90, 76)).gap, true);
    assert.equal(scoreReport(report(85, 100, 90, 74)).gap, false);
    assert.equal(scoreReport(report(0, 0, 0, 0, 0)).stars, 0);
    const session = firstSession();
    for (const label of [true, false]) {
        const records = session.pools.historical.map(p => ({...p, historicalDecision: label}));
        assert.ok(scoreReport(evaluateModel(trainModel(records), session.pools.final)).stars < 3);
    }
});
test('save replay reproduces workshop, undo history, deployment and reflections without trusting stored metrics', () => {
    const {session, flow} = workshop();
    flow.toggle('assess'); flow.toggle('expand'); flow.undo(); flow.toggle('hide-city'); flow.setThreshold(0.65);
    let checkpoint = JSON.parse(JSON.stringify(flow.checkpoint()));
    assert.deepEqual(restoreJourney(session, checkpoint).getState(), flow.getState());
    flow.deploy(); flow.nextFinal();
    checkpoint = JSON.parse(JSON.stringify(flow.checkpoint()));
    assert.deepEqual(restoreJourney(session, checkpoint).getState(), flow.getState());
    flow.skipFinal(); flow.reflect({pattern: 'Labels', transfer: 'New photos'});
    assert.deepEqual(restoreJourney(session, JSON.parse(JSON.stringify(flow.checkpoint()))).receipt(), flow.receipt());
    assert.throws(() => restoreJourney(session, {...checkpoint, inspectedIds: [checkpoint.inspectedIds[0], checkpoint.inspectedIds[0]]}), /cannot be read/);
});
test('an affordable assessment repair works across varied seeds and manual policies', () => {
    for (let seed = 0; seed < 20; seed++) {
        for (const policy of [() => true, () => false, (p, i) => i % 2 === 0]) {
            const {flow} = workshop(seed, policy);
            flow.toggle('assess'); flow.toggle('hide-city'); flow.toggle('hide-academy'); flow.deploy(); flow.skipFinal();
            assert.equal(flow.receipt().score.stars, 3, 'seed ' + seed);
            assert.equal(flow.receipt().creditsRemaining, 0);
        }
    }
});
