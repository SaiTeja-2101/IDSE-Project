export function randomStream(seed, name) {
    let value = 2166136261;
    for (const character of String(seed) + ':' + name) {
        value = Math.imul(value ^ character.charCodeAt(0), 16777619) >>> 0;
    }
    return () => {
        value = (value + 0x6D2B79F5) >>> 0;
        let result = Math.imul(value ^ value >>> 15, 1 | value);
        result ^= result + Math.imul(result ^ result >>> 7, 61 | result);
        return ((result ^ result >>> 14) >>> 0) / 4294967296;
    };
}

export function shuffle(values, random) {
    const result = values.slice();
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

export function deepFreeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
        Object.values(value).forEach(deepFreeze);
        Object.freeze(value);
    }
    return value;
}
