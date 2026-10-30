import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState } from "../src/gameState.js";
import { advanceTutorial, isTutorialActive, skipTutorial, tutorialAllows, tutorialHoldsTurn } from "../src/systems/TutorialSystem.js";
import { getTutorialLesson } from "../src/scenes/tutorialLessons.js";
import { mulligan, playSelectedCards } from "../src/systems/PlaySystem.js";
import { beginEndTurn, completeEndTurn } from "../src/systems/TurnSystem.js";
import { dealRound, doubleDown, stand } from "../src/systems/BlackjackSystem.js";
import { startNextFight } from "../src/systems/RunSystem.js";
import { ensureRewards, skipReward } from "../src/systems/RewardSystem.js";
import { deckCards } from "../src/systems/DeckSystem.js";

const ranks = state => state.hand.map(card => `${card.rank}${card.suit[0]}`).sort().join(" ");

function select(state, predicate) {
    state.hand.forEach(card => { card.selected = predicate(card); });
    state.selection.cards = state.hand.filter(card => card.selected);
}

/** Plays the guided steps up to the blackjack lesson. */
function reachBlackjack(state, swap = 2) {
    advanceTutorial(state, "intro-done");
    select(state, card => card.rank === "7");
    assert.equal(playSelectedCards(state).allowed, true);
    select(state, card => ["2", "3"].includes(card.rank) && swap > 0 && swap--);
    assert.equal(mulligan(state).allowed, true);
    assert.equal(beginEndTurn(state).allowed, true);
    assert.equal(completeEndTurn(state), true);
    state.mode = "blackjack";
}

test("the tutorial opens against a Goblin with a fixed hand, a fixed attack and 52 unique cards", () => {
    const state = createInitialState({ tutorial: true });
    assert.equal(state.enemy.name, "Goblin");
    assert.equal(state.mode, "poker");
    assert.deepEqual(state.enemy.intent, { type: "attack", value: 9 });
    assert.equal(ranks(state), "2d 3c 7h 7s Ks");
    const cards = deckCards(state);
    assert.equal(cards.length, 52);
    assert.equal(new Set(cards.map(card => card.id)).size, 52);
    assert.equal(state.tutorial.step, "intro");
    assert.equal(tutorialAllows(state, "select", [state.hand[0]]), false);
});

test("the first play must be the pair; anything else is rejected without cost", () => {
    const state = createInitialState({ tutorial: true });
    advanceTutorial(state, "intro-done");
    select(state, card => card.rank === "K");
    assert.equal(playSelectedCards(state).allowed, false);
    assert.equal(state.player.energy, 3);
    assert.equal(tutorialAllows(state, "blackjack"), false);
    select(state, card => card.rank === "7");
    playSelectedCards(state);
    assert.equal(state.player.shield, 25);
    assert.equal(state.player.energy, 1);
    assert.equal(state.tutorial.step, "mulligan");
});

test("any mulligan advances the lesson, then only End turn is allowed", () => {
    const state = createInitialState({ tutorial: true });
    advanceTutorial(state, "intro-done");
    select(state, card => card.rank === "7");
    playSelectedCards(state);
    assert.equal(beginEndTurn(state).allowed, false);
    select(state, card => card.rank === "K");
    assert.equal(mulligan(state).allowed, true);
    assert.equal(state.tutorial.step, "end-turn");
    assert.equal(tutorialAllows(state, "deal"), false);
    assert.equal(tutorialHoldsTurn(state), true);
});

test("ending the turn shows shield blocking, then decaying; blackjack cards are dealt next", () => {
    for (const swap of [1, 2]) {
        const state = createInitialState({ tutorial: true });
        reachBlackjack(state, swap);
        assert.equal(state.player.hp, 100);
        assert.equal(state.player.shield, 8);
        assert.equal(state.tutorial.step, "blackjack");
        assert.deepEqual(state.enemy.intent, { type: "attack", value: 6 });
        assert.equal(dealRound(state), true);
        assert.deepEqual(state.blackjack.player.map(card => card.rank), ["6", "5"]);
        assert.deepEqual(state.blackjack.dealer.map(card => card.rank), ["10", "7"]);
    }
});

test("doubling down on 11 wins big and releases the player", () => {
    const state = createInitialState({ tutorial: true });
    reachBlackjack(state);
    dealRound(state);
    assert.equal(doubleDown(state), true);
    assert.equal(state.blackjack.outcome, "win");
    assert.equal(state.enemy.hp, 60 - 42);
    assert.equal(state.result, null);
    assert.equal(state.tutorial.step, "free");
    assert.equal(tutorialHoldsTurn(state), false);
    assert.equal(tutorialAllows(state, "play", [state.hand[0]]), true);
});

test("standing on 11 loses, but still releases the player", () => {
    const state = createInitialState({ tutorial: true });
    reachBlackjack(state);
    dealRound(state);
    stand(state);
    assert.equal(state.blackjack.outcome, "lose");
    assert.equal(state.tutorial.step, "free");
});

test("completion requires reaching the next fight", () => {
    const state = createInitialState({ tutorial: true });
    reachBlackjack(state);
    dealRound(state);
    doubleDown(state);
    state.enemy.hp = 0;
    state.result = "victory";
    assert.notEqual(state.tutorial.step, "complete");
    ensureRewards(state);
    skipReward(state);
    assert.equal(startNextFight(state), true);
    assert.equal(state.tutorial.step, "complete");
});

test("skipping the tutorial ends guidance and lifts every restriction", () => {
    const state = createInitialState({ tutorial: true });
    advanceTutorial(state, "intro-done");
    skipTutorial(state);
    assert.equal(isTutorialActive(state), false);
    assert.equal(tutorialHoldsTurn(state), false);
    assert.equal(tutorialAllows(state, "blackjack"), true);
    assert.equal(getTutorialLesson(state), null);
    select(state, card => card.rank === "K");
    assert.equal(playSelectedCards(state).allowed, true);
});
