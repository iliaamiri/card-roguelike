/** Offers a choice of three rewards after each won fight, and a Curse choice after each boss. */
import { DECK_EDITS, SUITS, findCard, shuffle } from "./DeckSystem.js";
import { addJoker, availableJokers, getJoker, jokerSlots } from "./JokerSystem.js";
import { addCurse, availableCurses, getCurse, hasCurse, CURSE_OFFERS } from "./CurseSystem.js";
import { isBossFight, isFinalFight } from "./RunSystem.js";
import { openShop } from "./ShopSystem.js";

export const SKIP_CHIPS = 5;
const SUIT_SYMBOLS = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" };

function deckOffer(kind) {
    switch (kind) {
        case "remove": return { kind, title: "Remove a card", text: "Thin your deck: remove any card, jinxes included." };
        case "rank": return { kind, title: "Raise a card", text: "A card goes up one rank; a King becomes an Ace." };
        case "gild": return { kind, title: "Gild a card", text: "A gilded card adds 5 damage when it's in a played poker hand or a winning blackjack hand." };
        default: {
            const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
            return { kind: "suit", suit, title: `Paint a card ${SUIT_SYMBOLS[suit]}`, text: `Change one card's suit to ${suit}.` };
        }
    }
}

/** Two deck edits or upgrades plus a Joker, when one is left to offer. */
export function rollRewardOffers(state) {
    const kinds = shuffle(["remove", "suit", "rank", "gild"]);
    const joker = availableJokers(state)[0];
    const offers = kinds.slice(0, joker ? 2 : 3).map(deckOffer);
    if (joker) offers.push({ kind: "joker", jokerId: joker.id, title: joker.name, text: joker.text });
    return offers;
}

/** Creates the reward choice once a fight is won (the final boss ends the run instead). */
export function ensureRewards(state) {
    if (state.result !== "victory" || state.reward || isFinalFight(state)) return false;
    state.reward = { offers: rollRewardOffers(state), done: false };
    return true;
}

/** Cards in the deck that a deck-edit offer can target. */
export function eligibleCards(state, offer, cards) {
    const edit = DECK_EDITS[offer.kind];
    return edit ? cards.filter(card => edit.allows(card, offer.suit)) : [];
}

export function needsCard(offer) {
    return Boolean(DECK_EDITS[offer.kind]);
}

/** A Joker offer needs a slot to replace when every slot is full. */
export function needsJokerSlot(state, offer) {
    return offer.kind === "joker" && state.run.jokers.length >= jokerSlots(state);
}

/** After a boss: a Curse choice when any are left, then the shop. */
function finishReward(state) {
    state.reward.done = true;
    if (!isBossFight(state)) return;
    const offers = availableCurses(state).slice(0, CURSE_OFFERS).map(curse => curse.id);
    if (offers.length) state.curseChoice = { offers, done: false };
    else openShop(state);
}

export function chooseCurse(state, index) {
    const id = state.curseChoice?.offers[index];
    if (!id || state.curseChoice.done || !addCurse(state, id)) return { ok: false, message: "No Curse to take." };
    state.curseChoice.done = true;
    state.lastAction = `You took ${getCurse(id).name}.`;
    openShop(state);
    return { ok: true, message: state.lastAction };
}

export function skipCurse(state) {
    if (!state.curseChoice || state.curseChoice.done) return false;
    state.curseChoice.done = true;
    state.lastAction = "You walked away from the Curses.";
    openShop(state);
    return true;
}

/**
 * Applies a reward choice.
 * @param {Object} state Mutable run state.
 * @param {number} index Which offer was picked.
 * @param {Object} choice `cardId` for deck edits, `replaceIndex` for a Joker when slots are full.
 * @returns {Object} Whether it applied, and a message.
 */
export function chooseReward(state, index, { cardId = null, replaceIndex = null } = {}) {
    const offer = state.reward?.offers[index];
    if (!offer || state.reward.done) return { ok: false, message: "No reward to choose." };
    let message;
    if (offer.kind === "joker") {
        if (!addJoker(state, offer.jokerId, replaceIndex)) return { ok: false, message: "Choose a Joker to replace." };
        message = `${getJoker(offer.jokerId).name} joined your Jokers.`;
    } else {
        const card = cardId == null ? null : findCard(state, cardId);
        if (!card || !DECK_EDITS[offer.kind].allows(card, offer.suit)) return { ok: false, message: "Choose a card for this reward." };
        message = DECK_EDITS[offer.kind].apply(state, card, offer.suit);
    }
    state.lastAction = message;
    finishReward(state);
    return { ok: true, message };
}

export function skipReward(state) {
    if (!state.reward || state.reward.done) return false;
    const chips = SKIP_CHIPS * (hasCurse(state, "greed") ? 2 : 1);
    state.run.gold += chips;
    state.lastAction = `You skipped the reward and pocketed ${chips} chips.`;
    finishReward(state);
    return true;
}
