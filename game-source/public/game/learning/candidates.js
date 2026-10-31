import {randomStream, shuffle, deepFreeze} from './random';

export const CITIES = Object.freeze(['Bengaluru', 'Chennai']);
export const ACADEMIES = Object.freeze(['Central Academy', 'City Academy']);
export const DEFAULT_SEED = 20261030;

export function assessReadiness(applicant) {
    return applicant.skill >= 60 && applicant.experience >= 1;
}

export function historicalDecision(applicant) {
    return assessReadiness(applicant) && (applicant.city === 'Bengaluru' || applicant.academy === 'Central Academy');
}

const firstNames = ['Aditi', 'Arjun', 'Diya', 'Farah', 'Ishaan', 'Kavya', 'Meera', 'Nikhil', 'Priya', 'Rohan', 'Sana', 'Varun'];
const lastNames = ['Das', 'Iyer', 'Khan', 'Menon', 'Nair', 'Patel', 'Rao', 'Shah', 'Singh', 'Verma'];
const poolSpecs = {
    historical: [[60, 60], [20, 20]],
    onboarding: [[2, 1], [1, 2]],
    growth: [[3, 2], [2, 3]],
    rush: [[3, 4], [4, 3]],
    introductory: [[3, 3], [3, 3]],
    expansion: [[30, 30], [10, 10]],
    audit: [[20, 20], [20, 20]],
    final: [[50, 50], [50, 50]],
};

function gcd(a, b) { return b ? gcd(b, a % b) : a; }

function abilityProfiles(ready, count, random) {
    const boundaries = ready ? [[60, 1], [100, 5]] : [[59, 1], [60, 0]];
    return Array.from({length: count}, (_, i) => {
        if (i < boundaries.length) return {skill: boundaries[i][0], experience: boundaries[i][1]};
        if (ready) return {skill: 60 + Math.floor(random() * 41), experience: 1 + Math.floor(random() * 5)};
        return i % 2 ? {skill: 60 + Math.floor(random() * 41), experience: 0}
            : {skill: Math.floor(random() * 60), experience: Math.floor(random() * 6)};
    });
}

export function generatePool(seed, pool) {
    const spec = poolSpecs[pool];
    if (!spec) throw new Error('Unknown applicant pool: ' + pool);
    // Shared ability profiles make city distributions comparable. Academy is
    // assigned with an independent stream after ability has been generated.
    const manual = ['onboarding', 'growth', 'rush'].includes(pool);
    const readyProfiles = abilityProfiles(true, manual ? Math.max(spec[0][0], spec[1][0]) : gcd(spec[0][0], spec[1][0]), randomStream(seed, pool + ':ready'));
    const otherProfiles = abilityProfiles(false, manual ? Math.max(spec[0][1], spec[1][1]) : gcd(spec[0][1], spec[1][1]), randomStream(seed, pool + ':not-ready'));
    // The 42 people encountered in play have distinct names. Naming uses its
    // own stream and never changes skills, labels, IDs or applicant order.
    const nameDeck = shuffle(firstNames.flatMap(first => lastNames.map(last => first + ' ' + last)), randomStream(seed, 'visible-names'));
    const nameOffset = {onboarding: 0, growth: 6, rush: 16, introductory: 30}[pool] || 0;
    const candidates = [];
    spec.forEach(([readyCount, otherCount], cityIndex) => {
        const size = readyCount + otherCount;
        const centralCount = pool === 'onboarding' ? (cityIndex === 0 ? 2 : 1) : Math.round(size * (cityIndex === 0 ? 0.9 : 0.1));
        const academies = shuffle(Array.from({length: size}, (_, i) => i < centralCount ? ACADEMIES[0] : ACADEMIES[1]),
            randomStream(seed, pool + ':academy:' + cityIndex));
        const profiles = shuffle([
            ...Array.from({length: readyCount}, (_, i) => readyProfiles[i % readyProfiles.length]),
            ...Array.from({length: otherCount}, (_, i) => otherProfiles[i % otherProfiles.length]),
        ], randomStream(seed, pool + ':ability-order:' + cityIndex));
        profiles.forEach((profile, i) => {
            const record = {
                id: encodeURIComponent(String(seed)) + ':' + pool + ':' + cityIndex + ':' + i,
                name: nameDeck[(nameOffset + candidates.length) % nameDeck.length],
                spriteGroup: cityIndex === 0 ? 'orange' : 'blue',
                city: CITIES[cityIndex], academy: academies[i],
                skill: profile.skill, experience: profile.experience,
                playerDecision: null, pool,
            };
            record.assessedReady = assessReadiness(record);
            record.historicalDecision = historicalDecision(record);
            candidates.push(record);
        });
    });
    return deepFreeze(shuffle(candidates, randomStream(seed, pool + ':order')));
}

export function generatePools(seed = DEFAULT_SEED) {
    if ((!Number.isInteger(seed) && typeof seed !== 'string') || String(seed).length === 0 || String(seed).length > 64) {
        throw new Error('Use an integer or a short nonempty string as the session seed.');
    }
    return deepFreeze(Object.keys(poolSpecs).reduce((pools, pool) => {
        pools[pool] = generatePool(seed, pool);
        return pools;
    }, {}));
}
