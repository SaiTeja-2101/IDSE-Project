import {DecisionTreeClassifier} from '../vendor/ml-cart';
import {deepFreeze} from './random';
import {CITIES, ACADEMIES} from './candidates';

export const FEATURE_ORDER = Object.freeze(['skill', 'experience', 'academy', 'city']);
const featureNames = {skill: 'Practical skill', experience: 'Experience', academy: 'Academy', city: 'City'};
const playerPools = ['onboarding', 'growth', 'rush'];
const trainingPools = ['historical', 'expansion', ...playerPools];

export function encodeApplicant(applicant, features = FEATURE_ORDER) {
    if (!Number.isFinite(applicant.skill) || applicant.skill < 0 || applicant.skill > 100 ||
        !Number.isFinite(applicant.experience) || applicant.experience < 0 || applicant.experience > 5 ||
        !CITIES.includes(applicant.city) || !ACADEMIES.includes(applicant.academy)) {
        throw new Error('Applicant has invalid model inputs.');
    }
    const values = {skill: applicant.skill, experience: applicant.experience,
        academy: applicant.academy === ACADEMIES[0] ? 1 : 0, city: applicant.city === CITIES[0] ? 1 : 0};
    return features.map(feature => values[feature]);
}

function labelFor(record, source) {
    const value = source === 'assessed' ? record.assessedReady
        : playerPools.includes(record.pool) ? record.playerDecision : record.historicalDecision;
    if (value !== true && value !== false) throw new Error('A training example is missing its ' + source + ' label.');
    return Number(value);
}

export function trainModel(records, configuration = {}) {
    if (!Array.isArray(records) || !records.length) throw new Error('Scout needs at least one labelled training example.');
    const source = configuration.labelSource || 'historical';
    if (!['historical', 'assessed'].includes(source)) throw new Error('Unknown training label source.');
    const requested = configuration.features || FEATURE_ORDER;
    if (!Array.isArray(requested) || requested.some(feature => !FEATURE_ORDER.includes(feature)) || new Set(requested).size !== requested.length) {
        throw new Error('Choose known, distinct model features.');
    }
    const features = FEATURE_ORDER.filter(feature => requested.includes(feature));
    const ids = new Set();
    records.forEach(record => {
        if (!trainingPools.includes(record.pool)) throw new Error('Evaluation applicants cannot enter training.');
        if (typeof record.id !== 'string' || !record.id || ids.has(record.id)) throw new Error('Training IDs must be unique.');
        ids.add(record.id);
    });
    const rows = records.map(record => encodeApplicant(record, features));
    const labels = records.map(record => labelFor(record, source));
    const constant = labels.every(label => label === labels[0]);
    let fitted = null;
    if (!constant && features.length) {
        const classifier = new DecisionTreeClassifier({gainFunction: 'gini', maxDepth: 3, minNumSamples: 5});
        classifier.train(rows, labels);
        fitted = classifier.root;
    }
    // Route the actual training examples. Do not use class-index assumptions
    // in ml-cart's leaf distribution, particularly for leaves with only class 1.
    function build(node, indices, id) {
        const positiveLabels = indices.reduce((sum, i) => sum + labels[i], 0);
        const base = {id, support: indices.length, positiveLabels, positiveLabelRate: positiveLabels / indices.length};
        if (!node || !node.left || !node.right) return {...base, kind: 'leaf'};
        const feature = features[node.splitColumn];
        const left = indices.filter(i => rows[i][node.splitColumn] < node.splitValue);
        const right = indices.filter(i => rows[i][node.splitColumn] >= node.splitValue);
        if (!feature || !left.length || !right.length) throw new Error('The fitted tree contains an invalid split.');
        return {...base, kind: 'question', feature, featureIndex: node.splitColumn, splitValue: node.splitValue,
            left: build(node.left, left, id + 'L'), right: build(node.right, right, id + 'R')};
    }
    return deepFreeze({version: 1, kind: constant ? 'constant' : 'tree',
        constantLabel: constant ? labels[0] : null,
        configuration: {features, labelSource: source, gainFunction: 'gini', maxDepth: 3, minNumSamples: 5},
        labelSource: source === 'assessed' ? 'independent assessments' : records.every(record => playerPools.includes(record.pool))
            ? 'player decisions' : records.some(record => playerPools.includes(record.pool)) ? 'historical and player decisions' : 'historical decisions',
        trainingIds: records.map(record => record.id),
        root: build(fitted, records.map((_, i) => i), 'root')});
}

export function validateThreshold(threshold) {
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) throw new Error('Threshold must be between 0 and 1.');
}

export function predictApplicant(snapshot, applicant, threshold = 0.5) {
    validateThreshold(threshold);
    const values = encodeApplicant(applicant, snapshot.configuration.features);
    const decisionPath = [];
    let node = snapshot.root;
    while (node.kind === 'question') {
        const value = values[node.featureIndex];
        const lesser = value < node.splitValue;
        decisionPath.push({nodeId: node.id, feature: node.feature, label: featureNames[node.feature],
            value: applicant[node.feature], encodedValue: value, splitValue: node.splitValue,
            comparison: lesser ? '<' : '>=', branch: lesser ? 'left' : 'right'});
        node = lesser ? node.left : node.right;
    }
    return {decision: node.positiveLabelRate >= threshold, positiveLabelRate: node.positiveLabelRate,
        leafSupport: node.support, positiveLabels: node.positiveLabels, leafId: node.id, decisionPath};
}

export function buildTreeView(snapshot, threshold = 0.5) {
    validateThreshold(threshold);
    function view(node) {
        if (node.kind === 'leaf') return {...node, decision: node.positiveLabelRate >= threshold,
            text: node.positiveLabelRate >= threshold ? 'Shortlist' : 'Pass'};
        const category = node.feature === 'city' ? CITIES[0] : node.feature === 'academy' ? ACADEMIES[0] : null;
        return {...node, question: category ? featureNames[node.feature] + ': ' + category + '?'
            : featureNames[node.feature] + ' below ' + node.splitValue + (node.feature === 'experience' ? ' years' : '') + '?',
        leftLabel: category ? 'No' : 'Below ' + node.splitValue,
        rightLabel: category ? 'Yes' : 'At least ' + node.splitValue,
        left: view(node.left), right: view(node.right)};
    }
    return deepFreeze(view(snapshot.root));
}
