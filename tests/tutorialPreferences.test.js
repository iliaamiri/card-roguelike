import test from "node:test";
import assert from "node:assert/strict";
import {
    hasCompletedTutorial, markTutorialComplete, getHintsEnabled, saveHintsEnabled,
} from "../src/tutorialPreferences.js";

test("completion and optional hints persist independently", () => {
    const values = new Map();
    const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
    assert.equal(hasCompletedTutorial(storage), false);
    assert.equal(getHintsEnabled(storage), false);
    saveHintsEnabled(true, storage);
    assert.equal(getHintsEnabled(storage), true);
    assert.equal(hasCompletedTutorial(storage), false);
    markTutorialComplete(storage);
    assert.equal(hasCompletedTutorial(storage), true);
    saveHintsEnabled(false, storage);
    assert.equal(getHintsEnabled(storage), false);
    assert.equal(hasCompletedTutorial(storage), true);
});

test("unavailable storage never interrupts play or claims completion", () => {
    const storage = {
        getItem() { throw new Error("Storage blocked"); },
        setItem() { throw new Error("Storage blocked"); },
    };
    assert.equal(hasCompletedTutorial(storage), false);
    assert.equal(getHintsEnabled(storage), false);
    assert.doesNotThrow(() => markTutorialComplete(storage));
    assert.doesNotThrow(() => saveHintsEnabled(true, storage));
});
