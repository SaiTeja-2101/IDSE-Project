export const SAVE_KEY = 'hire-and-seek:v1';

export function createProgressStore(storage, {key = SAVE_KEY, version = 1} = {}) {
    let memory = null, persistent = Boolean(storage);
    return {
        read() {
            let raw = memory;
            try { if (storage) raw = storage.getItem(key) || memory; } catch (error) { persistent = false; }
            if (!raw) return {kind: 'empty'};
            try {
                if (raw.length > 1000000) throw new Error('Save is too large.');
                const value = JSON.parse(raw);
                if (value.version !== version || !value.first || typeof value.first !== 'object') throw new Error('Unknown saved version.');
                return {kind: 'saved', value};
            } catch (error) { return {kind: 'invalid'}; }
        },
        write(value) {
            memory = JSON.stringify({version, first: value.first, review: value.review || null});
            try { if (storage) storage.setItem(key, memory); else persistent = false; }
            catch (error) { persistent = false; }
            return persistent;
        },
        clear() {
            memory = null;
            try { if (storage) storage.removeItem(key); } catch (error) { persistent = false; }
        },
        available() { return persistent; },
    };
}
