import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState } from "../src/gameState.js";
import { getTutorialLesson } from "../src/scenes/tutorialLessons.js";
import { advanceTutorial } from "../src/systems/TutorialSystem.js";
import { playSelectedCards } from "../src/systems/PlaySystem.js";
import { beginEndTurn } from "../src/systems/TurnSystem.js";

test("tutorial first highlights the energy budget and explains attack before refill", () => {
    const state = createInitialState({ tutorial: true });
    const lesson = getTutorialLesson(state);
    assert.equal(lesson.target, "#energy-chips");
    assert.match(lesson.title, /3 energy/);
    assert.match([lesson.body, ...lesson.facts].join(" "), /End turn.*Goblin.*attack/i);
    assert.match(lesson.facts.join(" "), /after.*attack.*3 energy/i);
});

test("poker tooltip targets cards first and the play button once the required cards are selected", () => {
    const state = createInitialState({ tutorial: true });
    advanceTutorial(state, "energy-explained");
    assert.equal(getTutorialLesson(state).target, "#hand");
    state.hand.forEach(card => { card.selected = card.rank === "7"; });
    assert.equal(getTutorialLesson(state).target, "#play-button");
    assert.match(getTutorialLesson(state).body, /25 shield/);
});

test("End turn lesson makes early ending and the Goblin attack explicit", () => {
    const state = createInitialState({ tutorial: true });
    state.tutorial.step = "block";
    state.player.energy = 0;
    state.player.shield = 25;
    const lesson = getTutorialLesson(state);
    assert.equal(lesson.target, "#end-turn-button");
    assert.match(lesson.title, /End turn.*Goblin.*attack/i);
    assert.match(lesson.body, /0 energy left/);
    assert.match(lesson.body, /click End turn.*attacks for 9/i);
    assert.match(lesson.facts.join(" "), /3 energy/);
});

test("attack review highlights player resources and reports before/after values", () => {
    const state = createInitialState({ tutorial: true });
    advanceTutorial(state, "energy-explained");
    state.hand.forEach(card => { card.selected = card.rank === "7"; });
    playSelectedCards(state);
    beginEndTurn(state);
    const lesson = getTutorialLesson(state);
    assert.equal(lesson.target, ".stats");
    assert.match(lesson.title, /0 HP lost/);
    assert.match(lesson.body, /blocked 9/);
    assert.match(lesson.facts.join(" "), /25 -> 16/);
    assert.match(lesson.facts.join(" "), /100 -> 100/);
    assert.match(lesson.facts.join(" "), /Start next turn/);
});

test("blackjack explains the tradeoff before switching and rules before dealing", () => {
    const state = createInitialState({ tutorial: true });
    state.tutorial.step = "deal";
    const switchLesson = getTutorialLesson(state);
    assert.equal(switchLesson.target, '.mode-option[data-mode="blackjack"]');
    assert.match(switchLesson.body, /risk|losing/i);
    state.mode = "blackjack";
    const rules = getTutorialLesson(state);
    assert.equal(rules.target, "#play-button");
    assert.match(rules.body, /21/);
    assert.match(rules.facts.join(" "), /Ace.*11 or 1/);
    assert.match(rules.facts.join(" "), /Tie/);
    assert.match(rules.facts.join(" "), /immediate attack/);
});

test("tutorial completion and fight outcomes have their own anchored guidance", () => {
    const state = createInitialState({ tutorial: true });
    state.result = "victory";
    assert.equal(getTutorialLesson(state).target, "#play-button");
    state.result = null;
    state.tutorial.step = "complete";
    state.run.floor = 2;
    assert.equal(getTutorialLesson(state).title, "Tutorial complete");
    assert.equal(getTutorialLesson(state).target, "#fight-text");
    state.tutorial = null;
    assert.equal(getTutorialLesson(state), null);
});

test("free-play guidance does not restart when selecting cards or switching modes", () => {
    const state = createInitialState({ tutorial: true });
    state.tutorial.step = "finish";
    const key = getTutorialLesson(state).key;
    state.hand[0].selected = true;
    assert.equal(getTutorialLesson(state).key, key);
    state.mode = "blackjack";
    assert.equal(getTutorialLesson(state).key, key);
});
