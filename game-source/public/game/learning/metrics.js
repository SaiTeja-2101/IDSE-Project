import {CITIES} from './candidates';
import {predictApplicant, validateThreshold} from './model';

function countsFor(records, predictions, source) {
    const counts = {truePositive: 0, falsePositive: 0, trueNegative: 0, falseNegative: 0};
    records.forEach((record, i) => {
        const answer = source === 'assessed' ? record.assessedReady : record.historicalDecision;
        if (answer !== true && answer !== false) throw new Error('Evaluation label is missing.');
        const key = predictions[i].decision ? (answer ? 'truePositive' : 'falsePositive') : (answer ? 'falseNegative' : 'trueNegative');
        counts[key]++;
    });
    const positiveLabels = counts.truePositive + counts.falseNegative;
    return {...counts, total: records.length, positiveLabels, ready: source === 'assessed' ? positiveLabels : null,
        shortlisted: counts.truePositive + counts.falsePositive,
        accuracy: records.length ? (counts.truePositive + counts.trueNegative) / records.length : null,
        qualifiedShortlistRate: source === 'assessed' && positiveLabels ? counts.truePositive / positiveLabels : null};
}

export function evaluateModel(snapshot, applicants, threshold = 0.5, labelSource = 'assessed') {
    validateThreshold(threshold);
    if (!['assessed', 'historical'].includes(labelSource)) throw new Error('Unknown evaluation label source.');
    const predictions = applicants.map(applicant => ({id: applicant.id, ...predictApplicant(snapshot, applicant, threshold)}));
    const overallMetrics = countsFor(applicants, predictions, labelSource);
    const cityMetrics = {};
    CITIES.forEach(city => {
        const indices = applicants.map((person, i) => person.city === city ? i : -1).filter(i => i >= 0);
        cityMetrics[city] = countsFor(indices.map(i => applicants[i]), indices.map(i => predictions[i]), labelSource);
    });
    const rates = CITIES.map(city => cityMetrics[city].qualifiedShortlistRate);
    return {labelSource: labelSource === 'assessed' ? 'independent assessments' : 'historical decisions',
        metricLabel: labelSource === 'assessed' ? 'Screening accuracy' : 'Match to past hiring decisions',
        overallMetrics, cityMetrics, opportunityGap: rates.some(rate => rate === null) ? null : Math.abs(rates[0] - rates[1]), predictions};
}
