import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState, resetGameState } from "../src/gameState.js";
import { advanceTutorial, tutorialAllows } from "../src/systems/TutorialSystem.js";
import { playSelectedCards } from "../src/systems/PlaySystem.js";
import { beginEndTurn, completeEndTurn } from "../src/systems/TurnSystem.js";
import { dealRound, hit, stand } from "../src/systems/BlackjackSystem.js";
import { startNextFight } from "../src/systems/RunSystem.js";
import { applyAction } from "../src/systems/CombatSystem.js";

function playPair(state) {
    advanceTutorial(state, "energy-explained");
    state.hand.forEach(card => { card.selected = card.rank === "7"; });
    return playSelectedCards(state);
}

function reachHealing(state) {
    playPair(state);
    beginEndTurn(state);
    completeEndTurn(state);
    state.hand.forEach(card => { card.selected = card.rank === "K"; });
    assert.equal(playSelectedCards(state).allowed, true);
    beginEndTurn(state);
    completeEndTurn(state);
    beginEndTurn(state);
    completeEndTurn(state);
}

function reachBlackjack(state) {
    reachHealing(state);
    state.hand.forEach(card => { card.selected = true; });
    assert.equal(playSelectedCards(state).allowed, true);
    beginEndTurn(state);
    completeEndTurn(state);
    state.mode = "blackjack";
}

test("tutorial opens with a fixed pair, enemy, attack, and 52 unique cards", () => {
    const state = createInitialState({ tutorial: true });
    assert.equal(state.mode, "poker");
    assert.equal(state.tutorial.step, "energy");
    assert.equal(state.enemy.name, "Goblin");
    assert.equal(state.enemy.intent.value, 9);
    assert.deepEqual(state.hand.map(card => `${card.rank}:${card.suit}`),
        ["2:diamonds", "3:clubs", "7:spades", "7:hearts", "9:clubs"]);
    assert.equal(new Set([...state.hand, ...state.drawPile].map(card => card.id)).size, 52);
    assert.equal(new Set(state.run.encounters.slice(0, 3).map(enemy => enemy.name)).size, 3);
});

test("lesson restrictions reject unrelated plays and turn actions without spending resources", () => {
    const state = createInitialState({ tutorial: true });
    advanceTutorial(state, "energy-explained");
    state.hand[0].selected = true;
    assert.equal(playSelectedCards(state).allowed, false);
    assert.equal(beginEndTurn(state).allowed, false);
    state.mode = "blackjack";
    assert.equal(dealRound(state), false);
    assert.equal(state.player.energy, 3);
    assert.equal(state.hand.length, 5);
    assert.equal(state.tutorial.step, "pair");
    assert.equal(tutorialAllows(state, "blackjack"), false);
});

test("energy introduction waits for acknowledgement without spending energy or triggering an attack", () => {
    const state = createInitialState({ tutorial: true });
    assert.equal(tutorialAllows(state, "select", [state.hand[1]]), false);
    assert.equal(beginEndTurn(state).allowed, false);
    assert.equal(playSelectedCards(state).allowed, false);
    assert.equal(dealRound(state), false);
    advanceTutorial(state, "play");
    assert.equal(state.tutorial.step, "energy");
    advanceTutorial(state, "energy-explained");
    assert.equal(state.tutorial.step, "pair");
    assert.equal(state.player.energy, 3);
    assert.equal(state.player.hp, 100);
    assert.equal(state.enemy.hp, 40);
    assert.equal(state.hand.length, 5);
});

test("poker lessons spend full turns and carry shield through a high-card attack", () => {
    const state = createInitialState({ tutorial: true });
    assert.equal(playPair(state).allowed, true);
    assert.equal(state.tutorial.step, "block");
    assert.equal(state.player.shield, 25);
    assert.equal(state.player.energy, 0);
    assert.equal(playSelectedCards(state).allowed, false);
    assert.deepEqual(beginEndTurn(state), { allowed: true, blocked: 9, damage: 0 });
    assert.equal(state.tutorial.step, "draw");
    assert.deepEqual(state.tutorial.attack, {
        incoming: 9, blocked: 9, damage: 0,
        shieldBefore: 25, shieldAfter: 16, hpBefore: 100, hpAfter: 100,
    });
    assert.equal(state.player.energy, 0);
    assert.equal(state.run.turn, 1);
    assert.equal(beginEndTurn(state).allowed, false);
    assert.equal(completeEndTurn(state), true);
    assert.equal(state.tutorial.step, "damage");
    assert.equal(state.player.shield, 16);
    assert.equal(state.player.hp, 100);
    assert.equal(state.player.energy, 3);
    assert.equal(state.hand.length, 5);
    state.hand.forEach(card => { card.selected = card.rank === "K"; });
    assert.equal(playSelectedCards(state).allowed, true);
    assert.equal(state.enemy.hp, 25);
    assert.equal(state.player.energy, 0);
    assert.equal(state.tutorial.step, "damage-end");
    beginEndTurn(state);
    assert.equal(state.tutorial.step, "damage-review");
    assert.equal(state.player.shield, 7);
    completeEndTurn(state);
    assert.equal(state.player.shield, 7);
});

test("attack review records real HP loss when shield absorbs only part of the attack", () => {
    const state = createInitialState({ tutorial: true });
    playPair(state);
    state.player.shield = 3;
    beginEndTurn(state);
    assert.deepEqual(state.tutorial.attack, {
        incoming: 9, blocked: 3, damage: 6,
        shieldBefore: 3, shieldAfter: 0, hpBefore: 100, hpAfter: 94,
    });
    assert.equal(state.tutorial.step, "draw");
    assert.equal(state.phase, "enemy");
    assert.equal(state.player.energy, 0);
    assert.equal(beginEndTurn(state).allowed, false);
});

test("the healing lesson requires a real flush and restores actual missing HP", () => {
    const state = createInitialState({ tutorial: true });
    playPair(state);
    beginEndTurn(state);
    completeEndTurn(state);
    state.hand.forEach(card => { card.selected = card.rank === "K"; });
    playSelectedCards(state);
    beginEndTurn(state);
    completeEndTurn(state);
    assert.equal(state.tutorial.step, "unshielded");
    assert.equal(state.enemy.intent.value, 9);
    assert.equal(state.player.shield, 7);
    assert.deepEqual(beginEndTurn(state), { allowed: true, blocked: 7, damage: 2 });
    assert.equal(state.tutorial.step, "wound-review");
    assert.equal(state.player.hp, 98);
    assert.equal(state.player.energy, 3);
    assert.equal(state.run.turn, 3);
    assert.equal(completeEndTurn(state), true);
    assert.equal(state.tutorial.step, "heal");
    assert.equal(state.hand.every(card => card.suit === "hearts"), true);
    state.hand[0].selected = true;
    assert.equal(playSelectedCards(state).allowed, false);
    assert.equal(beginEndTurn(state).allowed, false);
    assert.equal(tutorialAllows(state, "blackjack"), false);
    state.hand.forEach(card => { card.selected = true; });
    const played = playSelectedCards(state);
    assert.equal(played.allowed, true);
    assert.equal(played.evaluation.name, "FLUSH");
    assert.equal(state.player.hp, 100);
    assert.equal(state.enemy.hp, 25);
    assert.equal(state.hand.length, 0);
    assert.equal(state.player.energy, 0);
    assert.equal(state.tutorial.step, "heal-end");
    beginEndTurn(state);
    assert.equal(state.tutorial.step, "heal-review");
    assert.equal(state.player.hp, 91);
    completeEndTurn(state);
    assert.equal(state.tutorial.step, "deal");
});

test("tutorial draws fixed hands only on new turns and conserves all 52 cards", () => {
    const state = createInitialState({ tutorial: true });
    const opening = [...state.hand];
    playPair(state);
    assert.equal(state.hand.length, 0);
    beginEndTurn(state);
    completeEndTurn(state);
    assert.equal(state.hand.length, 5);
    assert.ok(state.hand.every(card => !opening.includes(card)));
    assert.equal(state.hand.filter(card => card.rank === "K").length, 1);
    state.hand.forEach(card => { card.selected = card.rank === "K"; });
    playSelectedCards(state);
    assert.equal(state.hand.length, 0);
    assert.equal(state.discardPile.length, 10);
    const cards = [...state.hand, ...state.drawPile, ...state.discardPile];
    assert.equal(cards.length, 52);
    assert.equal(new Set(cards.map(card => card.id)).size, 52);
});

test("fixed blackjack requires Hit then Stand and uses normal combat effects", () => {
    const state = createInitialState({ tutorial: true });
    reachBlackjack(state);
    assert.equal(dealRound(state), true);
    assert.equal(state.tutorial.step, "hit");
    assert.equal(stand(state), false);
    assert.equal(hit(state), true);
    assert.equal(state.tutorial.step, "stand");
    assert.equal(hit(state), false);
    assert.equal(stand(state), true);
    assert.equal(state.blackjack.playerTotal, 18);
    assert.equal(state.blackjack.dealerTotal, 17);
    assert.equal(state.enemy.hp, 7);
    assert.equal(state.player.energy, 2);
    assert.equal(state.tutorial.step, "finish");
    const cards = [...state.hand, ...state.drawPile, ...state.discardPile, ...state.usedCards];
    assert.equal(cards.length, 52);
    assert.equal(new Set(cards.map(card => card.id)).size, 52);
});

test("completion requires lessons, victory, and actual next-fight transition", () => {
    const state = createInitialState({ tutorial: true });
    assert.equal(startNextFight(state), false);
    assert.equal(state.tutorial.step, "energy");
    reachBlackjack(state);
    dealRound(state);
    hit(state);
    stand(state);
    applyAction(state, { type: "attack", amount: 7 });
    assert.equal(state.tutorial.step, "finish");
    assert.equal(startNextFight(state), true);
    assert.equal(state.run.floor, 2);
    assert.equal(state.tutorial.step, "complete");
    assert.equal(tutorialAllows(state, "end-turn"), true);
});

test("defeat and restart do not complete tutorial; normal runs have no lesson restrictions", () => {
    const state = createInitialState({ tutorial: true });
    state.player.hp = 0;
    state.result = "defeat";
    assert.equal(startNextFight(state), false);
    assert.equal(state.tutorial.step, "energy");
    const reference = state;
    resetGameState(state, { tutorial: true });
    assert.equal(state, reference);
    assert.equal(state.tutorial.step, "energy");
    resetGameState(state);
    assert.equal(state.tutorial, null);
    assert.equal(tutorialAllows(state, "end-turn"), true);
    assert.equal(state.hand.length, 5);
});

test("normal runs still randomize cards and encounters without tutorial overrides", (t) => {
    const random = t.mock.method(Math, "random", () => 0);
    const first = createInitialState();
    random.mock.mockImplementation(() => 0.99);
    const second = createInitialState();
    assert.notDeepEqual(first.hand.map(card => card.id), second.hand.map(card => card.id));
    assert.notEqual(first.enemy.name, second.enemy.name);
    assert.equal(first.tutorial, null);
    assert.equal(second.tutorial, null);
    assert.equal(first.mode, "blackjack");
});

test("tutorial setup is independent and only reserves teaching draws", () => {
    const first = createInitialState({ tutorial: true });
    const second = createInitialState({ tutorial: true });
    playPair(first);
    assert.equal(second.tutorial.step, "energy");
    assert.equal(second.hand.length, 5);
    assert.equal(second.player.shield, 0);
    assert.notEqual(first.hand[0], second.hand[0]);
});

test("normal blackjack naturals still resolve immediately", () => {
    const state = createInitialState();
    const deck = [...state.hand, ...state.drawPile];
    const draws = ["A:spades", "K:hearts", "10:clubs", "7:diamonds"]
        .map(key => deck.find(card => `${card.rank}:${card.suit}` === key));
    state.drawPile = draws.reverse();
    assert.equal(dealRound(state), true);
    assert.equal(state.blackjack.status, "done");
    assert.equal(state.blackjack.outcome, "natural");
    assert.equal(state.blackjack.damage, Math.min(30, state.enemy.maxHp));
});
