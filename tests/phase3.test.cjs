const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./helpers/load-source.cjs')();
const api = load('public/game/learning/index.js');
const {randomStream} = load('public/game/learning/random.js');
const {DecisionTreeClassifier} = require('../game-source/public/game/vendor/ml-cart');
const {createSession, generatePool, assessReadiness, historicalDecision, trainModel,
    predictApplicant, evaluateModel, buildTreeView, withModelSnapshot, FEATURE_ORDER} = api;

test('seeded pools have exact sizes, disjoint IDs, stable independent streams, and fresh seeds', () => {
    const session = createSession();
    assert.deepEqual(session, createSession());
    const ids = new Set();
    for (const [pool, size] of Object.entries({historical: 160, onboarding: 6, introductory: 12, expansion: 80, audit: 80, final: 200})) {
        const records = session.pools[pool];
        assert.equal(records.length, size);
        assert.deepEqual(records, generatePool(session.seed, pool));
        for (const record of records) {
            assert.equal(ids.has(record.id), false);
            ids.add(record.id);
            assert.equal(record.pool, pool);
            assert.equal(record.spriteGroup, record.city === 'Bengaluru' ? 'orange' : 'blue');
            assert.equal(record.assessedReady, assessReadiness(record));
            assert.equal(record.historicalDecision, historicalDecision(record));
            assert.equal(record.playerDecision, null);
        }
    }
    const visualRandom = randomStream(session.seed, 'visual-effects');
    for (let i = 0; i < 100; i++) visualRandom();
    assert.deepEqual(createSession().pools, session.pools);
    assert.notDeepEqual(createSession(20261031).pools, session.pools);
    assert.throws(() => createSession(NaN));
});

test('archives use the required city mix, balanced readiness, and independent academy assignment', () => {
    for (const seed of [1, 7, 42, 20261030]) {
        const {pools} = createSession(seed);
        for (const pool of ['historical', 'expansion', 'audit', 'final', 'introductory']) {
            const records = pools[pool];
            const byCity = api.CITIES.map(city => records.filter(person => person.city === city));
            assert.equal(byCity[0].length / records.length, ['historical', 'expansion'].includes(pool) ? 0.75 : 0.5);
            const abilityDistributions = byCity.map(group => {
                assert.equal(group.filter(person => person.assessedReady).length, group.length / 2);
                const counts = {};
                group.forEach(person => { const key = person.skill + ':' + person.experience; counts[key] = (counts[key] || 0) + 1 / group.length; });
                return counts;
            });
            for (const key of Object.keys(abilityDistributions[0])) {
                assert.ok(Math.abs(abilityDistributions[0][key] - abilityDistributions[1][key]) < 1e-12);
            }
            if (['historical', 'expansion'].includes(pool)) byCity.forEach((group, city) => {
                assert.equal(group.filter(person => person.academy === 'Central Academy').length / group.length, city === 0 ? 0.9 : 0.1);
                for (const academy of api.ACADEMIES) assert.ok(group.some(person => person.academy === academy));
            });
        }
        assert.equal(pools.onboarding.filter(person => person.assessedReady).length, 3);
        api.CITIES.forEach(city => {
            const group = pools.onboarding.filter(person => person.city === city);
            assert.equal(group.length, 3);
            assert.equal(new Set(group.map(person => person.academy)).size, 2);
        });
    }
});

test('readiness boundaries and historical label bias use distinct meanings', () => {
    for (const [skill, experience, expected] of [[59, 1, false], [60, 0, false], [60, 1, true], [100, 5, true]]) {
        assert.equal(assessReadiness({skill, experience}), expected);
    }
    const ready = {skill: 60, experience: 1, city: 'Chennai', academy: 'City Academy'};
    assert.equal(assessReadiness(ready), true);
    assert.equal(historicalDecision(ready), false);
    assert.equal(historicalDecision({...ready, academy: 'Central Academy'}), true);
    assert.equal(historicalDecision({...ready, city: 'Bengaluru'}), true);
    assert.equal(historicalDecision({...ready, skill: 59, city: 'Bengaluru'}), false);
});

test('training keeps label sources explicit and blocks leakage, duplicates, and missing player answers', () => {
    const {pools} = createSession();
    for (const pool of ['audit', 'final', 'introductory']) assert.throws(() => trainModel(pools[pool]), /cannot enter training/);
    assert.throws(() => trainModel([]), /at least one/);
    assert.throws(() => trainModel([pools.historical[0], pools.historical[0]]), /unique/);
    assert.throws(() => trainModel([...pools.historical, ...pools.onboarding]), /missing/);
    const onboarding = pools.onboarding.map(person => ({...person, playerDecision: !person.historicalDecision}));
    const original = trainModel([...pools.historical, ...onboarding]);
    assert.equal(original.labelSource, 'historical and player decisions');
    const assessed = trainModel([...pools.historical, ...onboarding], {labelSource: 'assessed'});
    assert.equal(assessed.labelSource, 'independent assessments');
    assert.equal(assessed.root.positiveLabels, [...pools.historical, ...onboarding].filter(person => person.assessedReady).length);
    assert.equal(original.root.positiveLabels, pools.historical.filter(person => person.historicalDecision).length + onboarding.filter(person => person.playerDecision).length);
});

test('all sixteen feature masks keep training, inference, and explanation aligned', () => {
    const {pools} = createSession();
    for (let mask = 0; mask < 16; mask++) {
        const features = FEATURE_ORDER.filter((_, i) => mask & (1 << i));
        const snapshot = trainModel(pools.historical, {features: features.slice().reverse()});
        assert.deepEqual(snapshot.configuration.features, features);
        for (const person of pools.audit) {
            const result = predictApplicant(snapshot, person);
            let node = buildTreeView(snapshot);
            for (const step of result.decisionPath) {
                assert.ok(features.includes(step.feature));
                assert.equal(step.nodeId, node.id);
                assert.equal(step.feature, features[node.featureIndex]);
                node = node[step.branch];
            }
            assert.equal(node.id, result.leafId);
            assert.equal(node.decision, result.decision);
            assert.equal(node.support, result.leafSupport);
        }
    }
    assert.throws(() => trainModel(pools.historical, {features: ['ambition']}), /known/);
    assert.throws(() => trainModel(pools.historical, {features: ['city', 'city']}), /distinct/);
});

test('exported questions match the actual ml-cart fit and split equality goes right', () => {
    const {pools} = createSession();
    const features = ['skill', 'experience'];
    const snapshot = trainModel(pools.historical, {features, labelSource: 'assessed'});
    const classifier = new DecisionTreeClassifier({gainFunction: 'gini', maxDepth: 3, minNumSamples: 5});
    classifier.train(pools.historical.map(person => api.encodeApplicant(person, features)), pools.historical.map(person => Number(person.assessedReady)));
    function compare(actual, exported, depth) {
        assert.ok(depth <= 3);
        if (actual.left && actual.right) {
            assert.equal(exported.featureIndex, actual.splitColumn);
            assert.equal(exported.splitValue, actual.splitValue);
            compare(actual.left, exported.left, depth + 1); compare(actual.right, exported.right, depth + 1);
        } else assert.equal(exported.kind, 'leaf');
    }
    compare(classifier.root, snapshot.root, 0);
    assert.equal(snapshot.root.kind, 'question');
    const probe = {...pools.audit[0], [snapshot.root.feature]: snapshot.root.splitValue};
    assert.equal(predictApplicant(snapshot, probe).decisionPath[0].comparison, '>=');
    const below = {...probe, [snapshot.root.feature]: snapshot.root.splitValue - 0.00001};
    assert.equal(predictApplicant(snapshot, below).decisionPath[0].comparison, '<');
    function support(node) {
        if (node.kind === 'question') { assert.equal(node.support, node.left.support + node.right.support); support(node.left); support(node.right); }
        else {
            const routed = pools.historical.filter(person => predictApplicant(snapshot, person).leafId === node.id);
            assert.equal(node.support, routed.length);
            assert.equal(node.positiveLabels, routed.filter(person => person.assessedReady).length);
        }
    }
    support(snapshot.root);
});

test('single-class snapshots retain the real label and threshold ties shortlist consistently', () => {
    const {pools} = createSession();
    for (const label of [false, true]) {
        const model = trainModel(pools.historical.slice(0, 8).map(person => ({...person, historicalDecision: label})));
        assert.equal(model.kind, 'constant');
        assert.equal(model.constantLabel, Number(label));
        assert.equal(predictApplicant(model, pools.audit[0]).decision, label);
        assert.equal(predictApplicant(model, pools.audit[0]).positiveLabelRate, Number(label));
    }
    const records = pools.historical.slice(0, 2).map((person, i) => ({...person, historicalDecision: Boolean(i)}));
    const model = trainModel(records, {features: []});
    assert.equal(predictApplicant(model, pools.audit[0], 0.5).decision, true);
    assert.equal(predictApplicant(model, pools.audit[0], 0.50001).decision, false);
    assert.equal(buildTreeView(model, 0.5).decision, true);
    assert.throws(() => predictApplicant(model, pools.audit[0], NaN), /Threshold/);
});

test('metrics calculate exact confusion counts, city recall, missing denominators, and label meanings', () => {
    const {pools} = createSession();
    const model = trainModel(pools.historical.slice(0, 1).map(person => ({...person, historicalDecision: true})));
    const people = [
        {...pools.audit[0], city: 'Bengaluru', assessedReady: true},
        {...pools.audit[1], city: 'Bengaluru', assessedReady: false},
        {...pools.audit[2], city: 'Chennai', assessedReady: true},
    ];
    const result = evaluateModel(model, people);
    assert.equal(result.overallMetrics.truePositive, 2);
    assert.equal(result.overallMetrics.falsePositive, 1);
    assert.equal(result.overallMetrics.accuracy, 2 / 3);
    assert.equal(result.cityMetrics.Bengaluru.qualifiedShortlistRate, 1);
    assert.equal(result.opportunityGap, 0);
    const passModel = trainModel(pools.historical.slice(0, 1).map(person => ({...person, historicalDecision: false})));
    const pass = evaluateModel(passModel, people);
    assert.equal(pass.overallMetrics.trueNegative, 1);
    assert.equal(pass.overallMetrics.falseNegative, 2);
    assert.equal(evaluateModel(model, []).overallMetrics.accuracy, null);
    assert.equal(evaluateModel(model, people.slice(0, 2)).opportunityGap, null);
    assert.equal(evaluateModel(model, [{...people[0], assessedReady: false}]).cityMetrics.Bengaluru.qualifiedShortlistRate, null);
    const historical = evaluateModel(model, people, 0.5, 'historical');
    assert.equal(historical.metricLabel, 'Match to past hiring decisions');
    assert.equal(historical.overallMetrics.ready, null);
    assert.equal(historical.opportunityGap, null);
});

test('baseline/current snapshots are immutable, reproducible, and survive serialisation', () => {
    let session = createSession();
    const original = trainModel(session.pools.historical);
    const before = JSON.stringify(original);
    session = withModelSnapshot(session, original);
    session = withModelSnapshot(session, trainModel(session.pools.historical, {labelSource: 'assessed', features: ['skill', 'experience']}));
    assert.equal(session.models.original, original);
    assert.equal(JSON.stringify(original), before);
    assert.ok(Object.isFrozen(original.root));
    assert.notEqual(session.models.current, original);
    assert.deepEqual(trainModel(session.pools.historical), original);
    const restored = JSON.parse(JSON.stringify(original));
    assert.deepEqual(predictApplicant(restored, session.pools.audit[0]), predictApplicant(original, session.pools.audit[0]));
    assert.throws(() => withModelSnapshot({...session, finalLocked: true}, original), /locked/);
});

test('ml-cart compatibility fix supports pure positive branches without invalid Gini values', () => {
    const classifier = new DecisionTreeClassifier({gainFunction: 'gini', maxDepth: 3, minNumSamples: 1});
    classifier.train([[0], [1], [2], [3], [4], [5]], [0, 0, 0, 1, 1, 1]);
    assert.equal(classifier.root.splitValue, 2.5);
    assert.ok(Number.isFinite(classifier.root.gain));
    assert.deepEqual(classifier.predict([[0], [2.4999], [2.5], [5]]), [0, 0, 1, 1]);
});

test('legacy summaries use only recorded choices and real model outputs, with no substituted percentages', () => {
    const {dataModule} = load('public/game/controllers/machine-learning/dataModule.js');
    const {statistics, summarizeLegacyRecords} = load('public/game/controllers/machine-learning/statistics.js');
    const {cvCollection} = load('public/game/assets/text/cvCollection.js');
    assert.deepEqual(statistics.getManualStats(), [null, null, null, null]);
    dataModule.recordAccept(0); dataModule.recordAccept(0); dataModule.recordReject(1);
    dataModule.recordLastIndex(99);
    assert.equal(dataModule.getManualRecords().length, 2);
    assert.deepEqual(dataModule.accepted, [0]);
    assert.deepEqual(dataModule.rejected, [1]);
    assert.deepEqual(statistics.getManualStats(), summarizeLegacyRecords(dataModule.getManualRecords()));
    const before = JSON.stringify(cvCollection.cvDataEqual);
    dataModule.predict(cvCollection.cvDataEqual[0]);
    dataModule.predict(cvCollection.cvDataEqual[1]);
    assert.deepEqual(statistics.getMlLabStats(), summarizeLegacyRecords(dataModule.getPredictedRecords()));
    assert.equal(JSON.stringify(cvCollection.cvDataEqual), before);
    const {predictPreprocResume, preprocResumes} = load('public/game/controllers/machine-learning/modelTraining.js');
    assert.deepEqual(predictPreprocResume(cvCollection.cvData.slice(0, 2), [2, 0]), preprocResumes(cvCollection.cvData.slice(0, 2), [2, 0])[0]);
    assert.equal(predictPreprocResume([cvCollection.cvData[0]], [2, 0])[0][0], cvCollection.cvData[0].qualifications[2]);
});
