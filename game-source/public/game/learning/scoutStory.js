import {ACADEMIES, CITIES} from './candidates';
import {FEATURE_ORDER, trainModel, predictApplicant, buildTreeView} from './model';
import {evaluateModel} from './metrics';
import {deepFreeze} from './random';

export const ARCHIVES = deepFreeze([
    {id: 'company', name: 'Company archive', pools: ['historical']},
    {id: 'partner', name: 'Partner archive', pools: ['expansion']},
    {id: 'both', name: 'Both archives', pools: ['historical', 'expansion']},
]);
export const REPAIRS = deepFreeze([
    {id: 'hide-city', name: 'Hide city', detail: 'Keep the old answers. Train again without city on the CV.'},
    {id: 'work-tests', name: 'Learn from work tests', detail: 'Keep the CV details. Train again using who passed the work test as the answer.'},
]);
const cutoff = 0.5;
const finalSampleSize = 4;
const compact = report => ({overallMetrics: report.overallMetrics, cityMetrics: report.cityMetrics});
const usefulFields = {city: CITIES, academy: ACADEMIES};

// One actual CV from each useful case, selected in batch order. Keep the
// aggregate comparison and receipt independent of what the player opens.
function pickFinalExamples(applicants, original, repaired) {
    const buckets = new Map();
    applicants.forEach((applicant, i) => {
        const before = original.predictions[i].decision;
        const after = repaired.predictions[i].decision;
        const ready = applicant.assessedReady;
        const kind = before !== after ? (after === ready ? 'fixed' : 'new-error')
            : before !== ready ? 'still-error' : 'both-right';
        if (!buckets.has(kind)) buckets.set(kind, {kind, applicant, before, after});
    });
    return ['fixed', 'new-error', 'still-error', 'both-right'].flatMap(kind => buckets.has(kind) ? [buckets.get(kind)] : []);
}

export function testCopy(model, original, field) {
    if (!Object.prototype.hasOwnProperty.call(usefulFields, field)) throw new Error('Choose city or academy.');
    const value = usefulFields[field].find(v => v !== original[field]);
    const copy = {...original, [field]: value};
    const a = predictApplicant(model, original, cutoff), b = predictApplicant(model, copy, cutoff);
    const splitIndex = a.decisionPath.findIndex((step, index) =>
        step.nodeId !== b.decisionPath[index]?.nodeId || step.branch !== b.decisionPath[index]?.branch);
    return deepFreeze({field, from: original[field], to: value, original: {...original}, copy, before: a, after: b,
        splitIndex, outcome: a.decision !== b.decision ? 'decision' : splitIndex >= 0 ? 'path' : 'same'});
}

export function createScoutStory(session) {
    const manual = ['onboarding', 'growth', 'rush'].flatMap(pool => session.pools[pool]);
    const manualById = new Map(manual.map(p => [p.id, p]));
    const reviewed = Object.entries(session.playerDecisions).map(([id, decision]) => {
        if (!manualById.has(id) || typeof decision !== 'boolean') throw new Error('Invalid hiring choice.');
        return {...manualById.get(id), playerDecision: decision};
    });
    if (!reviewed.length) throw new Error('Review some CVs before training Scout.');
    const scanner = session.pools.introductory;
    const preview = Array.from({length: finalSampleSize}, (_, i) =>
        session.pools.final[Math.floor(i * session.pools.final.length / finalSampleSize)]);
    const profiles = new Map(scanner.map(p => [p.id, p]));
    const archives = ARCHIVES.map(archive => {
        const rows = archive.pools.flatMap(pool => session.pools[pool]);
        const byCity = CITIES.map(city => {
            const people = rows.filter(item => item.city === city);
            const ready = people.filter(item => item.assessedReady);
            return {city, total: people.length, ready: ready.length, shortlisted: ready.filter(item => item.historicalDecision).length};
        });
        return {...archive, count: rows.length, byCity};
    });
    let phase = 'handoff', archive = null, records, original, tree, results = [], caseFile = null, replied = false, investorSeen = false;
    let experiment = null, repairId = null, finalResult = null, finalExamples = [], finalScreened = [];
    let lesson = {part: 'feature', index: 0}, actions = [], walkthrough = null;
    const trials = new Map();
    let practiceOriginal, cityReport;
    const requirePhase = wanted => { if (wanted !== phase) throw new Error('Finish this step first.'); };
    function remember(action, arg) {
        const previous = actions[actions.length - 1];
        if (previous && previous[0] === action && ['copy', 'repair'].includes(action)) actions.pop();
        actions.push(arg === undefined ? [action] : [action, arg]);
    }
    function advanceScanner() {
        if (results.length < 3) { phase = 'screening'; return; }
        if (results.length === 3 && !investorSeen) { phase = 'investor'; return; }
        if (!caseFile) {
            const missed = results.find(p => !p.decision && profiles.get(p.id).assessedReady);
            if (missed || results.length === scanner.length) {
                const id = missed ? missed.id : scanner.find(p => p.assessedReady).id;
                caseFile = {id, kind: missed ? 'complaint' : 'routine'};
                phase = 'mail'; return;
            }
        }
        phase = results.length === scanner.length && replied ? 'city-report' : 'screening';
        if (phase === 'city-report') cityReport = compact(evaluateModel(original, scanner, cutoff));
    }
    function lessonModelPath() {
        return lesson.part === 'original-path' ? experiment.before : experiment.after;
    }
    function question(nodeId) {
        let node = tree;
        for (const turn of nodeId.slice('root'.length)) node = turn === 'L' ? node.left : node.right;
        return node;
    }
    function lessonView() {
        if (lesson.part.endsWith('-path')) {
            const path = lessonModelPath().decisionPath;
            const step = path[lesson.index];
            const node = step && question(step.nodeId);
            return {...lesson, step, questionCount: path.length, question: node?.question, choices: step ? [{id: 'left', label: node.leftLabel}, {id: 'right', label: node.rightLabel}] : [{id: 'continue', label: 'Continue'}], decision: lessonModelPath().decision};
        }
        return lesson;
    }
    function receipt() {
        requirePhase('receipt');
        const {field, from, to, outcome, before, after} = experiment;
        return deepFreeze({version: 2, seed: session.seed, archive: archive.id, trainingCount: records.length, reviewedCount: reviewed.length,
            case: {...caseFile, name: profiles.get(caseFile.id).name}, experiment: {field, from, to, outcome, before, after},
            repair: repairId, final: finalResult});
    }
    const flow = {
        getState() {
            return deepFreeze({phase, reviewedCount: reviewed.length, firstReviewed: reviewed[0], archives, archive, original, tree,
                scanIndex: results.length, scanTotal: scanner.length, scanQueue: scanner.slice(results.length),
                nextApplicant: phase === 'screening' ? scanner[results.length] : null,
                screened: results.map(p => ({applicant: profiles.get(p.id), prediction: p})),
                case: caseFile && {kind: caseFile.kind, applicant: profiles.get(caseFile.id), prediction: results.find(p => p.id === caseFile.id)},
                cityReport: cityReport || null,
                experiment, repair: repairId && {id: repairId, ...trials.get(repairId).comparison},
                finalIndex: finalScreened.length, finalSampleSize, finalScreened: finalScreened.slice(),
                finalQueue: phase === 'final' ? preview.slice(finalScreened.length) : [],
                finalResult, finalExamples, lesson: lessonView(), receipt: phase === 'receipt' ? receipt() : null});
        },
        send() { requirePhase('handoff'); phase = 'archives'; remember('send'); },
        train(id) {
            requirePhase('archives');
            const selected = archives.find(a => a.id === id);
            if (!selected) throw new Error('Choose an archive.');
            const selectedRecords = [...selected.pools.flatMap(pool => session.pools[pool]), ...reviewed];
            const snapshot = trainModel(selectedRecords);
            archive = selected; records = selectedRecords; original = snapshot; tree = buildTreeView(original, cutoff);
            phase = 'trained'; remember('train', id); return original;
        },
        startScanner() { requirePhase('trained'); phase = 'screening'; remember('startScanner'); },
        scan() {
            requirePhase('screening');
            const applicant = scanner[results.length];
            const prediction = {id: applicant.id, ...predictApplicant(original, applicant, cutoff)};
            results = [...results, prediction]; remember('scan'); advanceScanner();
            return {applicant, prediction};
        },
        acknowledge() { requirePhase('investor'); investorSeen = true; remember('acknowledge'); advanceScanner(); },
        openMail() { requirePhase('mail'); phase = 'inspector'; remember('openMail'); },
        reply(id) {
            requirePhase('inspector');
            if (id !== caseFile.id) throw new Error('Open the CV from the email first.');
            replied = true; remember('reply', id); advanceScanner();
        },
        reopen() { requirePhase('city-report'); phase = 'copy'; remember('reopen'); },
        copy(field) { requirePhase('copy'); experiment = testCopy(original, profiles.get(caseFile.id), field); remember('copy', field); return experiment; },
        openRepairs() {
            requirePhase('copy');
            if (!experiment) throw new Error('Scan the original and its copy first.');
            phase = 'repair'; remember('openRepairs');
        },
        repair(id) {
            requirePhase('repair');
            if (!REPAIRS.some(r => r.id === id)) throw new Error('Choose a repair.');
            if (!trials.has(id)) {
                const model = trainModel(records, id === 'hide-city' ? {features: FEATURE_ORDER.filter(field => field !== 'city')} : {labelSource: 'assessed'});
                practiceOriginal = practiceOriginal || compact(evaluateModel(original, session.pools.audit, cutoff));
                trials.set(id, {model, comparison: deepFreeze({original: practiceOriginal, repaired: compact(evaluateModel(model, session.pools.audit, cutoff))})});
            }
            repairId = id; remember('repair', id); return trials.get(id).comparison;
        },
        lock() {
            requirePhase('repair');
            if (!repairId) throw new Error('Try a repair on the practice CVs first.');
            phase = 'final'; remember('lock');
        },
        scanFinal() {
            requirePhase('final');
            if (finalScreened.length >= finalSampleSize) throw new Error('The sample is complete.');
            const applicant = preview[finalScreened.length];
            const prediction = predictApplicant(trials.get(repairId).model, applicant, cutoff);
            const sample = deepFreeze({applicant, prediction});
            finalScreened.push(sample); remember('scanFinal');
            return sample;
        },
        finishFinal() {
            requirePhase('final');
            const before = evaluateModel(original, session.pools.final, cutoff);
            const after = evaluateModel(trials.get(repairId).model, session.pools.final, cutoff);
            finalResult = deepFreeze({original: compact(before), repaired: compact(after)});
            finalExamples = deepFreeze(pickFinalExamples(session.pools.final, before, after));
            phase = 'final-results'; remember('finishFinal');
        },
        continueDebrief() { requirePhase('final-results'); phase = 'debrief'; remember('continueDebrief'); },
        answer(value) {
            requirePhase('debrief');
            const part = lesson.part;
            let hint = '';
            if (part === 'feature') {
                if (!FEATURE_ORDER.includes(value)) hint = 'Choose a detail from the CV that Scout can read.';
                else lesson = {part: 'label', index: 0};
            } else if (part === 'label') {
                if (value !== (reviewed[0].playerDecision ? 'shortlist' : 'pass')) hint = 'Look at the decision you recorded beneath this CV.';
                else lesson = {part: 'original-path', index: 0};
            } else if (part.endsWith('-path')) {
                const path = lessonModelPath().decisionPath, step = path[lesson.index];
                if (value !== (step ? step.branch : 'continue')) hint = step ? 'Use the CV value: ' + step.label + ' is ' + step.value + '.' : 'Scout has no question to ask here.';
                else if (!step || lesson.index + 1 === path.length) lesson = {part: part === 'original-path' ? 'copy-path' : 'result', index: 0};
                else lesson = {part, index: lesson.index + 1};
            } else {
                const a = finalResult.original.overallMetrics.falseNegative, b = finalResult.repaired.overallMetrics.falseNegative;
                const expected = a === b ? 'same' : a < b ? 'original' : 'repaired';
                if (value !== expected) hint = 'Compare the two numbers for qualified people missed: ' + a + ' and ' + b + '.';
                else phase = 'receipt';
            }
            if (hint) return {correct: false, hint};
            remember('answer', value); return {correct: true};
        },
        startWalkthrough() { requirePhase('receipt'); phase = 'walkthrough'; walkthrough = 'open'; },
        finishWalkthrough() { requirePhase('walkthrough'); phase = 'receipt'; walkthrough = 'finished'; },
        receipt,
        checkpoint() { return {version: 2, actions: actions.map(a => a.slice()), ...(walkthrough ? {walkthrough} : {})}; },
    };
    return flow;
}

export function restoreScoutStory(session, saved) {
    const allowed = new Set(['send', 'train', 'startScanner', 'scan', 'acknowledge', 'openMail', 'reply', 'reopen', 'copy',
        'openRepairs', 'repair', 'lock', 'scanFinal', 'finishFinal', 'continueDebrief', 'answer']);
    if (!saved || saved.version !== 2 || !Array.isArray(saved.actions) || saved.actions.length > 64) throw new Error('The saved case could not be read.');
    const flow = createScoutStory(session);
    for (const action of saved.actions) {
        if (!Array.isArray(action) || action.length < 1 || action.length > 2 || !allowed.has(action[0]) ||
            (action.length === 2 && typeof action[1] !== 'string')) throw new Error('The saved case has an invalid action.');
        // Version 2 saves made before the results screen went from the batch
        // straight to the quiz. Keep any answers from those runs.
        if (action[0] === 'answer' && flow.getState().phase === 'final-results') flow.continueDebrief();
        const result = flow[action[0]](action[1]);
        if (action[0] === 'answer' && !result.correct) throw new Error('The saved lesson answer is invalid.');
    }
    if (saved.walkthrough !== undefined) {
        if (!['open', 'finished'].includes(saved.walkthrough)) throw new Error('The saved walkthrough is invalid.');
        flow.startWalkthrough();
        if (saved.walkthrough === 'finished') flow.finishWalkthrough();
    }
    return flow;
}
