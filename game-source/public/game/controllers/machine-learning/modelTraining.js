// Compatibility adapter for the retained screens. New chapters use learning/.
import {DecisionTreeClassifier} from '../../vendor/ml-cart';
import {cvCollection} from '~/public/game/assets/text/cvCollection.js';

function fit(records, features) {
    const [rows, labels] = preprocResumes(records, features);
    if (!labels.length) throw new Error('No labelled examples are available.');
    if (labels.every(label => label === labels[0])) return {predict: inputs => inputs.map(() => labels[0])};
    const classifier = new DecisionTreeClassifier({gainFunction: 'gini', maxDepth: 3, minNumSamples: 5});
    classifier.train(rows, labels);
    return classifier;
}

export function buildUserModel(accepted, rejected) {
    const records = [
        ...accepted.map(i => ({...cvCollection.cvData[i], empl: 1})),
        ...rejected.map(i => ({...cvCollection.cvData[i], empl: 0})),
    ];
    return fit(records, [0, 1, 2, 3]);
}

// The old function name is retained for callers; it fits once on the archive.
// No audit/final labels or desired bias outcome are consulted.
export function buildFakeDataModel(features, accepted = [], rejected = []) {
    const decisions = new Map([...accepted.map(i => [i, 1]), ...rejected.map(i => [i, 0])]);
    return fit(cvCollection.cvData.map((person, i) => decisions.has(i) ? {...person, empl: decisions.get(i)} : person), features);
}

export function getFeaturePreference() { return [0, 1, 2, 3]; }

export function predictPreprocResume(records, features = [0, 1, 2, 3]) {
    return records.map(person => [...features.map(index => person.qualifications[index]), person.city]);
}

export function preprocResumes(records, features = [0, 1, 2, 3]) {
    return [predictPreprocResume(records, features), records.map(person => person.empl)];
}
