/** Controls enemy resolution and deals a fresh hand each turn. */
import { applyEnemyAttack } from "./CombatSystem.js";
import { discardHand, drawCards, HAND_SIZE } from "./DeckSystem.js";
import { rollIntent } from "./RunSystem.js";
import { advanceTutorial, tutorialAllows } from "./TutorialSystem.js";

/**
 * Locks player input and resolves one enemy action without starting a new turn.
 * @param {Object} state Mutable battle state.
 * @returns {Object} Acceptance and actual enemy damage outcome.
 */
export function beginEndTurn(state) {
    if (state.phase !== "player" || state.player.hp <= 0 || state.enemy.hp <= 0 || state.blackjack?.status === "playing" || !tutorialAllows(state, "end-turn")) {
        return { allowed: false };
    }
    state.phase = "enemy";
    state.hand.forEach(card => { card.selected = false; });
    state.selection = { cards: [], value: 0, results: [], primaryAction: null };
    const outcome = applyEnemyAttack(state);
    if (["block", "damage-end", "unshielded", "heal-end"].includes(state.tutorial?.step)) {
        state.tutorial.attack = {
            incoming: state.enemy.intent.value,
            ...outcome,
            shieldBefore: state.player.shield + outcome.blocked,
            shieldAfter: state.player.shield,
            hpBefore: state.player.hp + outcome.damage,
            hpAfter: state.player.hp,
        };
    }
    advanceTutorial(state, "enemy-attack");
    state.lastAction = `${state.enemy.name} attacked: blocked ${outcome.blocked}; lost ${outcome.damage} HP.`;
    return { allowed: true, ...outcome };
}

/**
 * Starts a surviving player's next turn after the input lock has elapsed.
 * @param {Object} state Mutable battle state.
 * @returns {boolean} Whether a new player turn was started.
 */
export function completeEndTurn(state) {
    if (state.phase !== "enemy" || state.player.hp <= 0 || state.enemy.hp <= 0) return false;
    state.run.turn += 1;
    state.player.energy = state.player.maxEnergy;
    state.blackjack = null;
    discardHand(state);
    drawCards(state, HAND_SIZE);
    rollIntent(state.enemy);
    state.phase = "player";
    advanceTutorial(state, "new-turn");
    if (["damage", "unshielded", "heal", "deal"].includes(state.tutorial?.step)) state.enemy.intent.value = 9;
    state.lastAction += ` New hand drawn; energy restored; ${state.player.shield} shield carried over.`;
    return true;
}
