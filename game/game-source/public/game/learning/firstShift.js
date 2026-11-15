import {createSession, withModelSnapshot} from './session';
import {trainModel, predictApplicant, buildTreeView} from './model';
import {evaluateModel} from './metrics';
import {deepFreeze} from './random';

export const ROUND_SPECS = deepFreeze([
    {pool: 'onboarding', name: 'First day', goal: 3, duration: null},
    {pool: 'growth', name: 'Business picks up', goal: 5, duration: 45000},
    {pool: 'rush', name: 'Hiring rush', goal: 8, duration: 45000},
]);

export function createFirstShift(seed, {now = () => performance.now()} = {}) {
    let session = createSession(seed);
    let phase = 'briefing', roundIndex = 0, roundStarted = null;
    let selectedId = session.pools.onboarding[0].id;
    let results = [], playerResults = [], roundReports = [], modelStage = 'player';
    const allManual = ROUND_SPECS.flatMap(round => session.pools[round.pool]);
    const hasDecision = id => Object.prototype.hasOwnProperty.call(session.playerDecisions, id);
    const people = () => session.pools[ROUND_SPECS[roundIndex].pool];
    const duration = () => ROUND_SPECS[roundIndex].duration;
    const remaining = () => duration() === null ? null : Math.max(0, duration() - (now() - roundStarted));
    const requirePhase = expected => { if (phase !== expected) throw new Error('This action is unavailable during ' + phase + '.'); };
    const examples = () => allManual.filter(person => hasDecision(person.id)).map(person => ({...person, playerDecision: session.playerDecisions[person.id]}));
    function endRound(reason) {
        if (phase !== 'manual') return;
        const reviewed = people().filter(person => hasDecision(person.id));
        const shortlisted = reviewed.filter(person => session.playerDecisions[person.id]).length;
        roundReports = [...roundReports, {roundIndex, name: ROUND_SPECS[roundIndex].name, reason,
            total: people().length, reviewed: reviewed.length, shortlisted, passed: reviewed.length - shortlisted,
            unreviewed: people().length - reviewed.length, goal: ROUND_SPECS[roundIndex].goal,
            goalMet: shortlisted >= ROUND_SPECS[roundIndex].goal}];
        session = {...session, roundReports};
        selectedId = null;
        phase = roundIndex < ROUND_SPECS.length - 1 ? 'round-break' : 'ready';
    }
    function tick() {
        if (phase === 'manual' && remaining() !== null && remaining() <= 0) { endRound('time'); return true; }
        return false;
    }
    function activeResults() { return modelStage === 'player' ? playerResults : results; }
    function activeModel() { return modelStage === 'player' ? session.playerModel : session.models.original; }
    return {
        getState() {
            return deepFreeze({phase, session, modelStage, selectedId, roundIndex, rounds: ROUND_SPECS,
                round: ROUND_SPECS[roundIndex], roundApplicants: people(), roundReports: roundReports.slice(),
                remainingMs: phase === 'manual' ? remaining() : null,
                roundDecisionCount: people().filter(person => hasDecision(person.id)).length,
                roundShortlisted: people().filter(person => hasDecision(person.id) && session.playerDecisions[person.id]).length,
                allManual, capacity: allManual.length, decisionCount: Object.keys(session.playerDecisions).length,
                results: activeResults().slice(), playerResults: playerResults.slice(), companyResults: results.slice(),
                activeModel: activeModel(), currentApplicant: people().find(person => person.id === selectedId) || null});
        },
        begin() {
            requirePhase('briefing');
            roundStarted = now(); phase = 'manual';
        },
        tick,
        nextRound() {
            requirePhase('round-break'); roundIndex++; selectedId = people()[0].id;
            roundStarted = now(); phase = 'manual';
        },
        select(id) {
            if (tick()) return false;
            requirePhase('manual');
            if (!people().some(person => person.id === id)) throw new Error('This applicant is not in the current round.');
            if (hasDecision(id)) return false;
            selectedId = id; return true;
        },
        decide(id, decision) {
            if (tick()) return false;
            if (phase !== 'manual') return false;
            if (hasDecision(id)) return false;
            requirePhase('manual');
            if (typeof decision !== 'boolean') throw new Error('Choose Shortlist or Pass.');
            if (id !== selectedId) throw new Error('Open this applicant before making a choice.');
            session = {...session, playerDecisions: {...session.playerDecisions, [id]: decision}};
            const next = people().find(person => !hasDecision(person.id));
            selectedId = next ? next.id : null;
            const shortlisted = people().filter(person => hasDecision(person.id) && session.playerDecisions[person.id]).length;
            if (shortlisted === ROUND_SPECS[roundIndex].goal) endRound('goal');
            else if (!next) endRound('completed');
            return true;
        },
        train() {
            if (session.playerModel) return session.playerModel;
            requirePhase('ready');
            const snapshot = trainModel(examples());
            session = {...session, chapter: 2, playerModel: snapshot};
            phase = 'trained'; modelStage = 'player'; return snapshot;
        },
        trainArchive() {
            if (session.models.original) return session.models.original;
            requirePhase('personal-summary');
            const snapshot = trainModel([...session.pools.historical, ...examples()]);
            session = withModelSnapshot(session, snapshot);
            phase = 'trained'; modelStage = 'company'; return snapshot;
        },
        startScreening() { requirePhase('trained'); phase = 'screening'; },
        screenNext() {
            requirePhase('screening');
            const applicant = session.pools.introductory[activeResults().length];
            const result = deepFreeze({applicantId: applicant.id, ...predictApplicant(activeModel(), applicant, session.threshold)});
            if (modelStage === 'player') { playerResults = [...playerResults, result]; session = {...session, playerResults}; }
            else { results = [...results, result]; session = {...session, introductoryResults: results}; }
            if (activeResults().length === session.pools.introductory.length) phase = modelStage === 'player' ? 'personal-summary' : 'summary';
            return result;
        },
        screenRemaining() { requirePhase('screening'); while (phase === 'screening') this.screenNext(); return activeResults().slice(); },
        personalReport() {
            requirePhase('personal-summary');
            return deepFreeze({total: playerResults.length, shortlisted: playerResults.filter(result => result.decision).length,
                trainingCount: session.playerModel.trainingIds.length, constant: session.playerModel.kind === 'constant',
                tree: buildTreeView(session.playerModel, session.threshold)});
        },
        report() {
            requirePhase('summary');
            const report = evaluateModel(session.models.original, session.pools.introductory, session.threshold, 'historical');
            const differences = results.filter((result, index) => result.decision !== playerResults[index].decision);
            return deepFreeze({...report, tree: buildTreeView(session.models.original, session.threshold),
                changedChoices: differences.length, changedIds: differences.map(result => result.applicantId),
                playerTree: buildTreeView(session.playerModel, session.threshold),
                playerTrainingCount: session.playerModel.trainingIds.length, companyTrainingCount: session.models.original.trainingIds.length});
        },
        checkpoint() { return deepFreeze({version: 1, seed: session.seed, phase, roundIndex, selectedId,
            playerDecisions: {...session.playerDecisions}, roundReports: roundReports.slice(),
            remainingMs: phase === 'manual' ? remaining() : null, modelStage,
            playerScreened: playerResults.length, companyScreened: results.length}); },
    };
}

export function restoreFirstShift(saved, {now = () => performance.now()} = {}) {
    const phases = ['briefing', 'manual', 'round-break', 'ready', 'trained', 'screening', 'personal-summary', 'summary'];
    if (!saved || saved.version !== 1 || !phases.includes(saved.phase) || !Number.isInteger(saved.roundIndex) || saved.roundIndex < 0 || saved.roundIndex > 2 ||
        !saved.playerDecisions || typeof saved.playerDecisions !== 'object' || Array.isArray(saved.playerDecisions) || Object.keys(saved.playerDecisions).length > 30 ||
        !Array.isArray(saved.roundReports) || saved.roundReports.length > 3 || !['player', 'company'].includes(saved.modelStage) ||
        ![saved.playerScreened, saved.companyScreened].every(count => Number.isInteger(count) && count >= 0 && count <= 12)) throw new Error('This saved shift cannot be read.');
    let virtualTime = 0, restoring = true, offset = 0;
    const flow = createFirstShift(saved.seed, {now: () => restoring ? virtualTime : now() - offset});
    const initial = flow.getState();
    const choices = Object.entries(saved.playerDecisions);
    if (choices.some(([id, decision]) => typeof decision !== 'boolean' || !initial.allManual.some(p => p.id === id))) throw new Error('Invalid saved choices.');
    if (saved.phase !== 'briefing') {
        flow.begin();
        for (let round = 0; round <= saved.roundIndex; round++) {
            const people = flow.getState().roundApplicants;
            for (const [id, decision] of choices.filter(([id]) => people.some(p => p.id === id))) {
                if (flow.getState().phase !== 'manual') throw new Error('The save has choices after a round finished.');
                flow.select(id); flow.decide(id, decision);
            }
            const report = saved.roundReports[round];
            if (report) {
                if (report.reason === 'time' && flow.getState().phase === 'manual') {
                    const duration = flow.getState().round.duration;
                    if (duration === null) throw new Error('The first round has no deadline.');
                    virtualTime += duration; flow.tick();
                }
                const actual = flow.getState().roundReports[round];
                if (!actual || Object.keys(actual).some(key => actual[key] !== report[key])) throw new Error('Saved round counts do not match the choices.');
            }
            if (round < saved.roundIndex) flow.nextRound();
        }
    }
    if (['trained', 'screening', 'personal-summary', 'summary'].includes(saved.phase)) {
        flow.train();
        if (saved.playerScreened || saved.phase === 'screening') {
            flow.startScreening();
            for (let i = 0; i < saved.playerScreened; i++) flow.screenNext();
        }
        if (saved.modelStage === 'company') {
            flow.trainArchive();
            if (saved.companyScreened || saved.phase === 'screening') {
                flow.startScreening();
                for (let i = 0; i < saved.companyScreened; i++) flow.screenNext();
            }
        }
    }
    if (saved.phase === 'manual') {
        flow.select(saved.selectedId);
        const duration = flow.getState().round.duration;
        if (duration !== null) {
            if (!Number.isFinite(saved.remainingMs) || saved.remainingMs < 0 || saved.remainingMs > duration) throw new Error('Invalid saved clock.');
            virtualTime += duration - saved.remainingMs;
        } else if (saved.remainingMs !== null) throw new Error('The first round is untimed.');
    }
    const restored = flow.getState();
    if (restored.phase !== saved.phase || restored.roundIndex !== saved.roundIndex || restored.modelStage !== saved.modelStage ||
        restored.decisionCount !== choices.length || restored.roundReports.length !== saved.roundReports.length ||
        restored.playerResults.length !== saved.playerScreened || restored.companyResults.length !== saved.companyScreened) throw new Error('The saved chapter does not match its progress.');
    offset = now() - virtualTime; restoring = false;
    return flow;
}

export function seedForNewShift(search, cryptoSource, now = Date.now()) {
    const seed = new URLSearchParams(search).get('seed');
    if (seed !== null && /^\d{1,10}$/.test(seed) && Number(seed) <= 0xffffffff) return Number(seed);
    if (cryptoSource && typeof cryptoSource.getRandomValues === 'function') return cryptoSource.getRandomValues(new Uint32Array(1))[0];
    return now;
}
