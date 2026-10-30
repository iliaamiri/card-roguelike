/** Local demo preferences. Replace completion access here when accounts exist. */
function read(key, storage) {
    try {
        return (storage ?? globalThis.localStorage)?.getItem(key) === "true";
    } catch {
        return false;
    }
}

function write(key, value, storage) {
    try {
        (storage ?? globalThis.localStorage)?.setItem(key, String(value));
    } catch {
        // The active session still works when browser storage is blocked.
    }
}

export function hasCompletedTutorial(storage) {
    return read("juniper.tutorialComplete", storage);
}

export function markTutorialComplete(storage) {
    write("juniper.tutorialComplete", true, storage);
}

export function getHintsEnabled(storage) {
    return read("juniper.hints", storage);
}

export function saveHintsEnabled(enabled, storage) {
    write("juniper.hints", enabled, storage);
}
