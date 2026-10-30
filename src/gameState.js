/** Creates and resets state for a random run of fights drawn from a shuffled deck. */
import { createDeck, drawCards, shuffle, HAND_SIZE } from "./systems/DeckSystem.js";
import { createEncounters, createEnemy, withArticle } from "./systems/RunSystem.js";
import { setupTutorial } from "./systems/TutorialSystem.js";

/**
 * Creates an independent run with a shuffled deck, random fights and an opening hand.
 * @returns {Object} Initial player, enemy, run, deck and hand data.
 */
export function createInitialState({ tutorial = false } = {}) {
    const encounters = createEncounters(tutorial ? "Goblin" : null);
    const state = {
        phase: "player",
        mode: "blackjack",
        result: null,
        lastAction: "",
        player: { hp: 100, maxHp: 100, shield: 0, energy: 3, maxEnergy: 3 },
        enemy: createEnemy(encounters[0]),
        run: { floor: 1, turn: 1, gold: 0, encounters },
        drawPile: shuffle(createDeck()),
        discardPile: [],
        hand: [],
        usedCards: [],
        blackjack: null,
        tutorial: null,
        selection: { cards: [], value: 0, results: [], primaryAction: null },
    };
    state.lastAction = `A new run begins. ${withArticle(state.enemy.name)} blocks the way.`;
    if (tutorial) setupTutorial(state);
    drawCards(state, HAND_SIZE);
    return state;
}

/**
 * Restores initial values while preserving the state reference held by the UI.
 * @param {Object} state Battle state to reset.
 */
export function resetGameState(state, options) {
    Object.assign(state, createInitialState(options));
}

export const gameState = createInitialState();
