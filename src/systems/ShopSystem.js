/** The shop after each floor's boss: spend blackjack chips on potions, cards, edits, Jokers and slots; sell Jokers. */
import { DECK_EDITS, RANKS, SUITS, addCard, findCard } from "./DeckSystem.js";
import { addJoker, availableJokers, getJoker, jokerSlots, removeJoker, sellPrice, JOKER_SLOTS } from "./JokerSystem.js";
import { healPlayer } from "./CombatSystem.js";
import { startNextFight } from "./RunSystem.js";

export const CARD_PRICE = 6;
export const REMOVE_PRICE = 8;
export const GILD_PRICE = 12;
/** One potion is restocked every time the shop opens. */
export const POTION_PRICE = 10;
export const POTION_HEAL = 25;
/** Extra Joker slots are expensive, and each one costs more than the last. */
export const SLOT_BASE_PRICE = 30;
export const SLOT_PRICE_STEP = 15;

export function slotPrice(state) {
    return SLOT_BASE_PRICE + SLOT_PRICE_STEP * (jokerSlots(state) - JOKER_SLOTS);
}
const SHOP_CARDS = 2;
const SHOP_JOKERS = 2;

function randomCard() {
    return { rank: RANKS[Math.floor(Math.random() * RANKS.length)], suit: SUITS[Math.floor(Math.random() * SUITS.length)] };
}

export function openShop(state) {
    const jokers = availableJokers(state).slice(0, SHOP_JOKERS)
        .map(joker => ({ kind: "joker", jokerId: joker.id, price: joker.price, sold: false }));
    const cards = Array.from({ length: SHOP_CARDS }, () => ({ kind: "card", ...randomCard(), price: CARD_PRICE, sold: false }));
    state.shop = { items: [{ kind: "potion", price: POTION_PRICE, sold: false }, ...jokers,
        { kind: "slot", price: slotPrice(state), sold: false }, ...cards,
        { kind: "remove", price: REMOVE_PRICE, sold: false },
        { kind: "gild", price: GILD_PRICE, sold: false }] };
    return state.shop;
}

export function canAfford(state, item) {
    return !item.sold && state.run.gold >= item.price;
}

/**
 * Buys a shop item.
 * @param {Object} state Mutable run state.
 * @param {number} index Item index.
 * @param {Object} choice `cardId` for remove or gild, `replaceIndex` for a Joker when slots are full.
 * @returns {Object} Whether it was bought, and a message.
 */
export function buyItem(state, index, { cardId = null, replaceIndex = null } = {}) {
    const item = state.shop?.items[index];
    if (!item || item.sold) return { ok: false, message: "That's no longer for sale." };
    if (state.run.gold < item.price) return { ok: false, message: "Not enough chips." };
    let message;
    if (item.kind === "joker") {
        if (!addJoker(state, item.jokerId, replaceIndex)) return { ok: false, message: "Choose a Joker to replace." };
        message = `Bought ${getJoker(item.jokerId).name}.`;
    } else if (item.kind === "potion") {
        message = `The potion restored ${healPlayer(state, POTION_HEAL)} HP.`;
    } else if (item.kind === "slot") {
        state.run.jokerSlots = jokerSlots(state) + 1;
        message = `You can now hold ${state.run.jokerSlots} Jokers.`;
    } else if (item.kind === "card") {
        addCard(state, item.rank, item.suit);
        message = `Added the ${item.rank} of ${item.suit} to your deck.`;
    } else {
        const card = cardId == null ? null : findCard(state, cardId);
        if (!card || !DECK_EDITS[item.kind].allows(card)) return { ok: false, message: "Choose a card." };
        message = DECK_EDITS[item.kind].apply(state, card);
    }
    state.run.gold -= item.price;
    item.sold = true;
    state.lastAction = message;
    return { ok: true, message };
}

export function shopNeedsJokerSlot(state, item) {
    return item.kind === "joker" && state.run.jokers.length >= jokerSlots(state);
}

export function sellJoker(state, jokerIndex) {
    const id = state.run.jokers[jokerIndex];
    if (!id) return false;
    removeJoker(state, jokerIndex);
    state.run.gold += sellPrice(id);
    state.lastAction = `Sold ${getJoker(id).name} for ${sellPrice(id)} chips.`;
    return true;
}

/** Closes the shop and climbs to the next floor's first fight. */
export function leaveShop(state) {
    if (!state.shop) return false;
    state.shop = null;
    return startNextFight(state);
}
