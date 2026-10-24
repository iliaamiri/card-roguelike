import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState, resetGameState } from "../src/gameState.js";
import { createDeck } from "../src/systems/DeckSystem.js";
import { playSelectedCards } from "../src/systems/PlaySystem.js";
import { beginEndTurn, completeEndTurn } from "../src/systems/TurnSystem.js";

function pokerState() {
    const state = createInitialState();
    const deck = createDeck();
    state.mode = "poker";
    state.hand = deck.splice(0, 5);
    state.drawPile = deck;
    state.enemy.hp = state.enemy.maxHp = 1000;
    return state;
}

for (const count of [1, 2, 5]) {
    test(`playing ${count} poker cards costs all 3 energy and waits until next turn to draw`, () => {
        const state = pokerState();
        const original = [...state.hand];
        original.slice(0, count).forEach(card => { card.selected = true; });
        assert.equal(playSelectedCards(state).allowed, true);
        assert.equal(state.player.energy, 0);
        assert.equal(state.hand.length, 0);
        assert.deepEqual(new Set(state.discardPile), new Set(original));
        assert.equal(state.drawPile.length, 47);
        assert.equal(state.selection.cards.length, 0);
        const cards = [...state.hand, ...state.drawPile, ...state.discardPile, ...state.usedCards];
        assert.equal(cards.length, 52);
        assert.equal(new Set(cards.map(card => card.id)).size, 52);
    });
}

test("poker cannot be played after spending energy on blackjack", () => {
    const state = pokerState();
    state.player.energy = 1;
    state.hand[0].selected = true;
    const before = JSON.stringify(state);
    assert.equal(playSelectedCards(state).allowed, false);
    assert.equal(JSON.stringify(state), before);
    assert.equal(state.hand.length, 5);
    assert.equal(state.drawPile.length, 47);
    assert.equal(state.discardPile.length, 0);
});

test("a winning poker play consumes energy but does not draw another hand", () => {
    const state = pokerState();
    state.enemy.hp = 1;
    state.hand[0].selected = true;
    playSelectedCards(state);
    assert.equal(state.result, "victory");
    assert.equal(state.player.energy, 0);
    assert.equal(state.hand.length, 0);
    assert.equal(state.drawPile.length, 47);
    assert.equal(state.discardPile.length, 5);
});

test("invalid plays do not spend energy, discard, or redraw", () => {
    const state = pokerState();
    const before = JSON.stringify(state);
    assert.equal(playSelectedCards(state).allowed, false);
    assert.equal(JSON.stringify(state), before);
    state.hand[0].selected = true;
    state.player.energy = 0;
    const exhausted = JSON.stringify(state);
    assert.equal(playSelectedCards(state).allowed, false);
    assert.equal(JSON.stringify(state), exhausted);
});

test("one poker play exhausts the turn budget and a new hand arrives next turn", () => {
    const state = pokerState();
    state.hand[0].selected = true;
    assert.equal(playSelectedCards(state).allowed, true);
    assert.equal(playSelectedCards(state).allowed, false);
    assert.equal(state.player.energy, 0);
    assert.equal(state.hand.length, 0);
    assert.equal(beginEndTurn(state).allowed, true);
    assert.equal(completeEndTurn(state), true);
    assert.equal(state.player.energy, 3);
    assert.equal(state.hand.length, 5);
});

test("next-turn draw recycles the discard pile without losing or duplicating cards", () => {
    const state = pokerState();
    state.discardPile = state.drawPile;
    state.drawPile = [];
    state.hand[0].selected = true;
    playSelectedCards(state);
    beginEndTurn(state);
    completeEndTurn(state);
    assert.equal(state.hand.length, 5);
    const cards = [...state.hand, ...state.drawPile, ...state.discardPile];
    assert.equal(cards.length, 52);
    assert.equal(new Set(cards.map(card => card.id)).size, 52);
});

test("new runs and resets start at 100 HP, including tutorial runs", () => {
    for (const tutorial of [false, true]) {
        const state = createInitialState({ tutorial });
        assert.equal(state.player.hp, 100);
        state.player.hp = 12;
        resetGameState(state, { tutorial });
        assert.equal(state.player.hp, 100);
        assert.equal(state.player.hp, state.player.maxHp);
    }
});
