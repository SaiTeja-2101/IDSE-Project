import {trainModel, predictApplicant, buildTreeView, FEATURE_ORDER} from './model';
import {evaluateModel} from './metrics';
import {CITIES} from './candidates';
import {deepFreeze} from './random';

export const INTERVENTIONS = deepFreeze([
    {id: 'hide-city', name: 'Hide city', cost: 1, description: 'Scout cannot ask about city.'},
    {id: 'hide-academy', name: 'Hide academy', cost: 1, description: 'Scout cannot ask about academy.'},
    {id: 'expand', name: 'Expand the archive', cost: 2, description: 'Add 80 old hiring records. They come from the same hiring process.'},
    {id: 'assess', name: 'Use independent assessments', cost: 4, description: 'Check the training applicants using skill and experience. Learn from these answers instead of old choices.'},
]);
const costOf = ids => ids.reduce((sum, id) => sum + INTERVENTIONS.find(item => item.id === id).cost, 0);
const copy = value => JSON.parse(JSON.stringify(value));
const compact = report => ({overallMetrics: report.overallMetrics, cityMetrics: report.cityMetrics, opportunityGap: report.opportunityGap, labelSource: report.labelSource});

// Integer counts keep boundary checks exact, without rounding displayed rates.
export function scoreReport(report) {
    const overall = report.overallMetrics;
    const cities = CITIES.map(city => report.cityMetrics[city]);
    const quality = overall.total > 0 && (overall.truePositive + overall.trueNegative) * 100 >= 85 * overall.total;
    const reach = cities.every(city => city.ready > 0 && city.truePositive * 100 >= 75 * city.ready);
    const gap = cities.every(city => city.ready > 0) &&
        Math.abs(cities[0].truePositive * cities[1].ready - cities[1].truePositive * cities[0].ready) * 100 <= 15 * cities[0].ready * cities[1].ready;
    const opportunity = reach && gap;
    return deepFreeze({quality, reach, gap, opportunity, stars: Number(quality) + Number(reach) + Number(gap),
        ending: quality ? opportunity ? 'Trust Earned' : 'A Problem Beneath the Numbers'
            : opportunity ? 'The Unchecked Shortlist' : 'Recruitment Recalled'});
}

export function createJourney(session) {
    if (!session.models.original || !session.playerModel) throw new Error('Finish the first shift before opening the investigation.');
    const original = session.models.original;
    const manual = ['onboarding', 'growth', 'rush'].flatMap(pool => session.pools[pool]);
    const player = manual.filter(p => Object.prototype.hasOwnProperty.call(session.playerDecisions, p.id))
        .map(p => ({...p, playerDecision: session.playerDecisions[p.id]}));
    const originalAudit = evaluateModel(original, session.pools.audit);
    const complaint = session.pools.audit.find(p => p.assessedReady && !predictApplicant(original, p).decision);
    let phase = 'investigation', selectedId = (complaint || session.pools.audit[0]).id;
    let inspectedIds = [], interventions = [], threshold = 0.5, current = original, audit = originalAudit;
    let experiments = [], undoStack = [], finalData = null, finalIndex = 0;
    let reflections = {pattern: '', transfer: ''};
    const requirePhase = expected => { if (phase !== expected) throw new Error('This action is not available here.'); };
    const credits = () => 8 - inspectedIds.length - costOf(interventions);
    const recordsFor = ids => [...session.pools.historical, ...player, ...(ids.includes('expand') ? session.pools.expansion : [])];
    function configuration(ids) {
        return {features: FEATURE_ORDER.filter(feature => !(feature === 'city' && ids.includes('hide-city')) && !(feature === 'academy' && ids.includes('hide-academy'))),
            labelSource: ids.includes('assess') ? 'assessed' : 'historical'};
    }
    function changedCount(before, after) { return after.predictions.filter((p, i) => p.decision !== before.predictions[i].decision).length; }
    function fit(ids, cutoff, action, remember = true) {
        if (experiments.length >= 200) throw new Error('You have recorded 200 experiments. Use this Scout or start a new shift from the receipt.');
        if (8 - inspectedIds.length - costOf(ids) < 0) throw new Error('You do not have enough credits. Undo a purchase first.');
        const model = trainModel(recordsFor(ids), configuration(ids));
        const report = evaluateModel(model, session.pools.audit, cutoff);
        const changed = changedCount(audit, report);
        if (remember) undoStack = [...undoStack, {interventions: interventions.slice(), threshold}];
        const experiment = {number: experiments.length + 1, action, interventions: ids.slice(), threshold: cutoff,
            trainingCount: model.trainingIds.length, labelSource: model.labelSource, features: model.configuration.features,
            credits: 8 - inspectedIds.length - costOf(ids), changedChoices: changed,
            comparedWithPrevious: compact(audit), results: compact(report)};
        // Commit together only after fitting and evaluation succeed.
        interventions = ids.slice(); threshold = cutoff; current = model; audit = report;
        experiments = [...experiments, deepFreeze(experiment)];
        return experiment;
    }
    function selectedEvidence() {
        const applicant = session.pools.audit.find(p => p.id === selectedId);
        const model = phase === 'investigation' ? original : current;
        const prediction = predictApplicant(model, applicant, phase === 'investigation' ? 0.5 : threshold);
        const comparison = session.pools.audit.filter(p => p.city !== applicant.city).slice().sort((a, b) =>
            (Math.abs(a.skill - applicant.skill) + Math.abs(a.experience - applicant.experience) * 20) -
            (Math.abs(b.skill - applicant.skill) + Math.abs(b.experience - applicant.experience) * 20))[0];
        const examples = recordsFor(interventions).filter(p => predictApplicant(model, p, threshold).leafId === prediction.leafId).slice(0, 4)
            .map(p => ({id: p.id, name: p.name, city: p.city, skill: p.skill, experience: p.experience, academy: p.academy,
                label: interventions.includes('assess') ? p.assessedReady : p.pool === 'historical' || p.pool === 'expansion' ? p.historicalDecision : p.playerDecision,
                source: interventions.includes('assess') ? 'Assessment' : p.playerDecision === true || p.playerDecision === false ? 'Your choice' : 'Old choice'}));
        return {applicant, prediction, assessment: inspectedIds.includes(applicant.id) ? applicant.assessedReady : null,
            comparison, comparisonPrediction: predictApplicant(model, comparison, phase === 'investigation' ? 0.5 : threshold), examples};
    }
    const flow = {
        getState() {
            return deepFreeze({phase, selectedId, inspectedIds: inspectedIds.slice(), interventions: interventions.slice(), threshold,
                credits: credits(), current, original, audit: phase === 'investigation' ? null : audit,
                originalAudit: phase === 'investigation' ? null : originalAudit,
                complaintId: complaint ? complaint.id : null, evidence: selectedEvidence(), tree: buildTreeView(phase === 'investigation' ? original : current, threshold),
                applicants: session.pools.audit.map(p => ({id: p.id, name: p.name, city: p.city})),
                experiments: experiments.slice(), canUndo: undoStack.length > 0, locked: finalData !== null,
                finalIndex, finalTotal: session.pools.final.length, animationTotal: 12,
                finalApplicant: finalData && finalIndex < 12 ? session.pools.final[finalIndex * 17] : null,
                finalPrediction: finalData && finalIndex > 0 ? finalData.current.predictions[(finalIndex - 1) * 17] : null,
                receipt: phase === 'receipt' ? flow.receipt() : null, reflections});
        },
        select(id) {
            if (!['investigation', 'audit', 'workshop'].includes(phase)) throw new Error('The applicant desk is closed.');
            if (!session.pools.audit.some(p => p.id === id)) throw new Error('Choose an applicant from the audit.');
            selectedId = id;
        },
        inspect(id = selectedId) {
            requirePhase('investigation');
            if (!session.pools.audit.some(p => p.id === id)) throw new Error('Choose an applicant from the audit.');
            selectedId = id;
            if (inspectedIds.includes(id)) return false;
            if (credits() < 1) throw new Error('You have no credits left for another check.');
            inspectedIds = [...inspectedIds, id]; return true;
        },
        openAudit() {
            requirePhase('investigation');
            if (inspectedIds.length < 2) throw new Error('Check two different applicants first.');
            phase = 'audit';
        },
        openWorkshop() { requirePhase('audit'); phase = 'workshop'; },
        toggle(id) {
            requirePhase('workshop');
            const item = INTERVENTIONS.find(p => p.id === id);
            if (!item) throw new Error('Unknown workshop change.');
            const removing = interventions.includes(id);
            return fit(removing ? interventions.filter(value => value !== id) : [...interventions, id], threshold,
                (removing ? 'Undo purchase: ' : 'Try: ') + item.name);
        },
        setThreshold(value) {
            requirePhase('workshop');
            const percent = Math.round(value * 100);
            if (!Number.isFinite(value) || Math.abs(value * 100 - percent) > 0.000001 || percent < 10 || percent > 90 || percent % 5) throw new Error('Choose a strictness from 10% to 90%, in steps of 5%.');
            if (threshold === value) return null;
            return fit(interventions, value, 'Strictness: ' + percent + '%');
        },
        undo() {
            requirePhase('workshop');
            if (!undoStack.length) return null;
            const previous = undoStack[undoStack.length - 1];
            const result = fit(previous.interventions, previous.threshold, 'Undo last experiment', false);
            undoStack = undoStack.slice(0, -1); return result;
        },
        deploy() {
            requirePhase('workshop');
            finalData = deepFreeze({original: evaluateModel(original, session.pools.final, 0.5), current: evaluateModel(current, session.pools.final, threshold)});
            finalIndex = 0; phase = 'final';
        },
        nextFinal() {
            requirePhase('final');
            const index = finalIndex * 17;
            const result = {applicant: session.pools.final[index], prediction: finalData.current.predictions[index]};
            finalIndex++;
            if (finalIndex === 12) phase = 'receipt';
            return deepFreeze(result);
        },
        skipFinal() { requirePhase('final'); finalIndex = 12; phase = 'receipt'; },
        replayFinal() { requirePhase('receipt'); finalIndex = 0; phase = 'final'; },
        reflect(values) {
            requirePhase('receipt');
            for (const key of ['pattern', 'transfer']) if (typeof values[key] !== 'string' || values[key].length > 2000) throw new Error('Keep each note under 2000 characters.');
            reflections = {...values};
        },
        receipt() {
            requirePhase('receipt');
            return deepFreeze({version: 1, sessionId: session.id, seed: session.seed, playerDecisions: session.playerDecisions,
                inspectedIds: inspectedIds.slice(), interventions: interventions.slice(), threshold,
                features: current.configuration.features, labelSource: current.labelSource,
                trainingCount: current.trainingIds.length, creditsRemaining: credits(), inspectionCost: inspectedIds.length,
                workshopCost: costOf(interventions), original: compact(finalData.original), current: compact(finalData.current),
                score: scoreReport(finalData.current), originalScore: scoreReport(finalData.original), experiments: experiments.slice(), reflections,
                limits: 'Fictional applicants. Readiness means skill at least 60 and experience at least 1 year. These checks do not establish fairness for real hiring.'});
        },
        checkpoint() { return deepFreeze({version: 1, phase, inspectedIds: inspectedIds.slice(), selectedId,
            interventions: interventions.slice(), threshold, experiments: experiments.map(item => ({interventions: item.interventions, threshold: item.threshold, action: item.action})),
            undoStack: copy(undoStack), finalIndex, reflections}); },
    };
    return flow;
}

export function restoreJourney(session, saved) {
    if (!saved || saved.version !== 1 || !['investigation', 'audit', 'workshop', 'final', 'receipt'].includes(saved.phase) ||
        !Array.isArray(saved.inspectedIds) || new Set(saved.inspectedIds).size !== saved.inspectedIds.length || saved.inspectedIds.length > 8 ||
        !Array.isArray(saved.experiments) || saved.experiments.length > 200) throw new Error('This saved investigation cannot be read.');
    const flow = createJourney(session);
    saved.inspectedIds.forEach(id => flow.inspect(id));
    flow.select(saved.selectedId);
    if (saved.phase !== 'investigation') flow.openAudit();
    if (['workshop', 'final', 'receipt'].includes(saved.phase)) {
        flow.openWorkshop();
        // Replay actual purchases and strictness changes, never stored models or metrics.
        saved.experiments.forEach(experiment => {
            if (experiment.action === 'Undo last experiment') { flow.undo(); return; }
            const current = flow.getState();
            if (!Array.isArray(experiment.interventions) || new Set(experiment.interventions).size !== experiment.interventions.length) throw new Error('Invalid saved purchases.');
            const changed = INTERVENTIONS.filter(item => current.interventions.includes(item.id) !== experiment.interventions.includes(item.id));
            if (changed.length === 1 && current.threshold === experiment.threshold) flow.toggle(changed[0].id);
            else if (!changed.length) flow.setThreshold(experiment.threshold);
            else throw new Error('Invalid saved experiment.');
        });
        const state = flow.getState();
        if (JSON.stringify(state.interventions) !== JSON.stringify(saved.interventions) || state.threshold !== saved.threshold) throw new Error('Saved workshop choices do not match.');
    }
    if (['final', 'receipt'].includes(saved.phase)) {
        flow.deploy();
        if (!Number.isInteger(saved.finalIndex) || saved.finalIndex < 0 || saved.finalIndex > 12 || (saved.phase === 'receipt' && saved.finalIndex !== 12)) throw new Error('Invalid saved final batch.');
        for (let i = 0; i < saved.finalIndex; i++) flow.nextFinal();
        if (saved.phase === 'receipt') flow.reflect(saved.reflections);
    }
    if (flow.getState().phase !== saved.phase) throw new Error('The saved chapter does not match its progress.');
    return flow;
}

export function exportSession(journey) { return JSON.stringify(journey.receipt(), null, 2); }
