import { shuffle } from "./DeckSystem.js";

/** One hand per teaching turn, followed by the blackjack round. */
const OPENING_DRAWS = [
    "7:spades", "7:hearts", "2:diamonds", "9:clubs", "3:clubs",
    "K:spades", "2:spades", "4:clubs", "6:hearts", "9:diamonds",
    "2:clubs", "3:spades", "5:diamonds", "8:clubs", "J:spades",
    "3:hearts", "5:hearts", "8:hearts", "Q:hearts", "A:hearts",
    "A:diamonds", "4:diamonds", "6:clubs", "J:hearts", "Q:spades",
    "6:spades", "4:hearts", "10:diamonds", "7:clubs", "8:spades",
];

export function setupTutorial(state) {
    const cards = new Map(state.drawPile.map(card => [`${card.rank}:${card.suit}`, card]));
    const fixed = OPENING_DRAWS.map(key => cards.get(key));
    const reserved = new Set(fixed);
    state.drawPile = [...shuffle(state.drawPile.filter(card => !reserved.has(card))), ...fixed.reverse()];
    state.mode = "poker";
    state.enemy.intent.value = 9;
    state.tutorial = { step: "energy" };
}

export function isTutorialActive(state) {
    return Boolean(state.tutorial && state.tutorial.step !== "complete");
}

export function isTutorialAttackReview(state) {
    return ["draw", "damage-review", "wound-review", "heal-review"].includes(state.tutorial?.step);
}

/** Guards both UI controls and system entry points; no resources spent on rejection. */
export function tutorialAllows(state, action, cards = []) {
    if (!isTutorialActive(state)) return true;
    switch (state.tutorial.step) {
        case "energy": return false;
        case "pair":
            return action === "poker" ||
                (action === "select" && cards.every(card => card.rank === "7")) ||
                (action === "play" && cards.length === 2 && cards.every(card => card.rank === "7"));
        case "damage":
            return (action === "select" || action === "play") && cards.length === 1 && cards[0].rank === "K";
        case "block":
        case "damage-end":
        case "heal-end": return action === "end-turn";
        case "unshielded": return action === "end-turn";
        case "draw":
        case "damage-review":
        case "heal-review":
        case "wound-review": return false;
        case "heal":
            return (action === "select" && cards.every(card => card.suit === "hearts")) ||
                (action === "play" && cards.length === 5 && cards.every(card => card.suit === "hearts"));
        case "deal": return action === "blackjack" || action === "deal";
        case "hit": return action === "hit";
        case "stand": return action === "stand";
        case "finish": return true;
        default: return false;
    }
}

/** Called only after successful actions by the gameplay systems. */
export function advanceTutorial(state, action) {
    if (!isTutorialActive(state)) return;
    const transitions = {
        energy: ["energy-explained", "pair"],
        pair: ["play", "block"],
        damage: ["play", "damage-end"],
        block: ["enemy-attack", "draw"],
        draw: ["new-turn", "damage"],
        "damage-end": ["enemy-attack", "damage-review"],
        "damage-review": ["new-turn", "unshielded"],
        unshielded: ["enemy-attack", "wound-review"],
        "wound-review": ["new-turn", "heal"],
        heal: ["play", "heal-end"],
        "heal-end": ["enemy-attack", "heal-review"],
        "heal-review": ["new-turn", "deal"],
        deal: ["deal", "hit"],
        hit: ["hit", "stand"],
        stand: ["stand", "finish"],
        finish: ["next-fight", "complete"],
    };
    const transition = transitions[state.tutorial.step];
    if (transition?.[0] === action) state.tutorial.step = transition[1];
}
