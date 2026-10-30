/** Jokers are passive rule changes; the other systems ask hasJoker() at the point each rule applies. */
import { shuffle } from "./DeckSystem.js";

export const JOKER_SLOTS = 3;
/** How many cards Card Counter reveals from the top of the draw pile. */
export const CARD_COUNTER_REVEAL = 3;

export const JOKERS = [
    { id: "whetstone", name: "Whetstone", text: "Pairs and two pairs also deal 6 damage.", price: 18 },
    { id: "sleight", name: "Sleight of Hand", text: "Your first mulligan each turn is free.", price: 16 },
    { id: "insurance", name: "Insurance", text: "Your first blackjack loss each fight costs no HP.", price: 16 },
    { id: "card-counter", name: "Card Counter", text: `See the top ${CARD_COUNTER_REVEAL} cards of your draw pile.`, price: 14 },
    { id: "high-roller", name: "High Roller", text: "Blackjack wins deal 6 more damage and pay 5 more chips.", price: 20 },
    { id: "bulwark", name: "Bulwark", text: "Shield decays to 75% instead of 50%.", price: 16 },
    { id: "bleeding-heart", name: "Bleeding Heart", text: "Each heart in a played poker hand heals 2 HP.", price: 14 },
    { id: "lucky-seven", name: "Lucky Seven", text: "High card can deal up to 21 damage instead of 15.", price: 14 },
    { id: "overclock", name: "Overclock", text: "+1 energy every turn.", price: 28 },
];

/** Effects that change the player's stats while a Joker is held. */
const ON_HOLD = {
    overclock: (state, sign) => {
        state.player.maxEnergy += sign;
        state.player.energy = Math.max(0, state.player.energy + sign);
    },
};

export function getJoker(id) {
    return JOKERS.find(joker => joker.id === id) ?? null;
}

export function hasJoker(state, id) {
    return Boolean(state.run?.jokers?.includes(id));
}

export function jokerSlots(state) {
    return state.run?.jokerSlots ?? JOKER_SLOTS;
}

/** Adds a Joker, replacing the one at replaceIndex when every slot is taken. */
export function addJoker(state, id, replaceIndex = null) {
    const jokers = state.run.jokers;
    if (!getJoker(id) || jokers.includes(id)) return false;
    if (jokers.length >= jokerSlots(state)) {
        if (replaceIndex == null || !jokers[replaceIndex]) return false;
        ON_HOLD[jokers[replaceIndex]]?.(state, -1);
        jokers[replaceIndex] = id;
    } else {
        jokers.push(id);
    }
    ON_HOLD[id]?.(state, 1);
    return true;
}

export function removeJoker(state, index) {
    const [id] = state.run.jokers.splice(index, 1);
    if (id) ON_HOLD[id]?.(state, -1);
    return id ?? null;
}

export function sellPrice(id) {
    return Math.floor((getJoker(id)?.price ?? 0) / 2);
}

/** Jokers the player doesn't own yet, in random order. */
export function availableJokers(state) {
    return shuffle(JOKERS.filter(joker => !hasJoker(state, joker.id)));
}
