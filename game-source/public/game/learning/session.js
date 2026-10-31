import {generatePools, DEFAULT_SEED} from './candidates';
import {deepFreeze} from './random';

export function createSession(seed = DEFAULT_SEED) {
    return {version: 1, id: 'hire-and-seek:' + encodeURIComponent(String(seed)), seed,
        pools: generatePools(seed), chapter: 1, playerDecisions: {},
        models: deepFreeze({original: null, current: null}), threshold: 0.5,
        credits: 8, inspectedIds: [], interventions: [], experiments: [], finalLocked: false};
}

export function withModelSnapshot(session, snapshot) {
    if (session.finalLocked) throw new Error('The final model is locked. Start a new session to try another model.');
    return {...session, models: deepFreeze({original: session.models.original || snapshot, current: snapshot})};
}
