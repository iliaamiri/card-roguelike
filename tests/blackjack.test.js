import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState } from "../src/gameState.js";
import {
    canDoubleDown, dealRound, doubleDown, hit, scoreHand, stand, surrender, NATURAL_CHIPS, WIN_CHIPS,
} from "../src/systems/BlackjackSystem.js";

const card = (rank, id, extra = {}) => ({ id, rank, suit: "spades", selected: false, ...extra });

/** Stacks the draw pile so cards come out in the listed order: player, player, dealer, dealer, then hits. */
function stacked(order) {
    const state = createInitialState();
    state.mode = "blackjack";
    state.drawPile = order.map((rank, i) => card(rank, 100 + i)).reverse();
    state.enemy.hp = state.enemy.maxHp = 1000;
    state.enemy.penalty = 10;
    return state;
}

test("a win deals your total and pays chips", () => {
    const state = stacked(["10", "9", "10", "7"]);
    dealRound(state);
    stand(state);
    assert.equal(state.blackjack.outcome, "win");
    assert.equal(state.enemy.hp, 981);
    assert.equal(state.run.gold, WIN_CHIPS);
});

test("a natural pays 30 damage and natural chips", () => {
    const state = stacked(["A", "K", "10", "7"]);
    dealRound(state);
    assert.equal(state.blackjack.outcome, "natural");
    assert.equal(state.enemy.hp, 970);
    assert.equal(state.run.gold, NATURAL_CHIPS);
});

test("doubling down costs 1 more energy, takes one card and doubles damage and chips", () => {
    const state = stacked(["6", "5", "10", "7", "9"]);
    dealRound(state);
    assert.equal(canDoubleDown(state), true);
    doubleDown(state);
    assert.equal(state.player.energy, 1);
    assert.equal(state.blackjack.player.length, 3);
    assert.equal(state.blackjack.outcome, "win");
    assert.equal(state.enemy.hp, 1000 - 40);
    assert.equal(state.run.gold, WIN_CHIPS * 2);
});

test("a doubled loss doubles the penalty", () => {
    const state = stacked(["6", "5", "10", "9", "2"]);
    dealRound(state);
    doubleDown(state);
    assert.equal(state.blackjack.outcome, "lose");
    assert.equal(state.player.hp, 80);
});

test("surrender takes half the loss penalty", () => {
    const state = stacked(["10", "6", "10", "9"]);
    dealRound(state);
    surrender(state);
    assert.equal(state.blackjack.outcome, "surrender");
    assert.equal(state.player.hp, 95);
    assert.equal(hit(state), false);
});

test("Insurance covers the first loss each fight only", () => {
    const state = stacked(["10", "6", "10", "9", "10", "6", "10", "9"]);
    state.run.jokers = ["insurance"];
    dealRound(state);
    stand(state);
    assert.equal(state.blackjack.insured, true);
    assert.equal(state.player.hp, 100);
    dealRound(state);
    stand(state);
    assert.equal(state.player.hp, 90);
});

test("High Roller adds damage and chips; gilded cards add damage", () => {
    const state = stacked(["10", "9", "10", "7"]);
    state.drawPile.at(-1).gilded = true;
    state.run.jokers = ["high-roller"];
    dealRound(state);
    stand(state);
    assert.equal(state.enemy.hp, 1000 - (19 + 5 + 6));
    assert.equal(state.run.gold, WIN_CHIPS + 5);
});

test("pushes refund energy unless the house rule says otherwise", () => {
    const state = stacked(["10", "8", "10", "8"]);
    dealRound(state);
    stand(state);
    assert.equal(state.blackjack.outcome, "push");
    assert.equal(state.player.energy, 3);
    const strict = stacked(["10", "8", "10", "8"]);
    strict.run.rules = { noPushRefund: true };
    dealRound(strict);
    stand(strict);
    assert.equal(strict.player.energy, 2);
});

test("under the soft 17 house rule the dealer hits a soft 17", () => {
    const soft = stacked(["10", "8", "A", "6", "3"]);
    dealRound(soft);
    stand(soft);
    assert.equal(soft.blackjack.dealer.length, 2);
    const strict = stacked(["10", "8", "A", "6", "3"]);
    strict.run.rules = { dealerHitsSoft17: true };
    dealRound(strict);
    stand(strict);
    assert.equal(strict.blackjack.dealer.length, 3);
    assert.equal(strict.blackjack.outcome, "lose");
});

test("a jinx counts as 5 in blackjack and blocks a natural", () => {
    assert.deepEqual(scoreHand([card("X", 1), card("K", 2)]), { total: 15, soft: false });
    assert.deepEqual(scoreHand([card("A", 1), card("6", 2)]), { total: 17, soft: true });
});
