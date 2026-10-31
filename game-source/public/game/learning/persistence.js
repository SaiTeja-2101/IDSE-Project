export const SAVE_KEY = 'hire-and-seek:v1';

export function createProgressStore(storage) {
    let memory = null, persistent = Boolean(storage);
    return {
        read() {
            let raw = memory;
            try { if (storage) raw = storage.getItem(SAVE_KEY) || memory; } catch (error) { persistent = false; }
            if (!raw) return {kind: 'empty'};
            try {
                if (raw.length > 1000000) throw new Error('Save is too large.');
                const value = JSON.parse(raw);
                if (value.version !== 1 || !value.first || typeof value.first !== 'object') throw new Error('Unknown saved version.');
                return {kind: 'saved', value};
            } catch (error) { return {kind: 'invalid'}; }
        },
        write(value) {
            memory = JSON.stringify({version: 1, first: value.first, review: value.review || null});
            try { if (storage) storage.setItem(SAVE_KEY, memory); else persistent = false; }
            catch (error) { persistent = false; }
            return persistent;
        },
        clear() {
            memory = null;
            try { if (storage) storage.removeItem(SAVE_KEY); } catch (error) { persistent = false; }
        },
        available() { return persistent; },
    };
}
