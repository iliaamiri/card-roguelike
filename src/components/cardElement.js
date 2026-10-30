/** Builds small HTML playing cards for blackjack rows, reward pickers and the shop. */
export const SUIT_SYMBOLS = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠", jinx: "✖" };

export function createCardElement(card, faceDown = false) {
    const element = document.createElement("span");
    if (faceDown) {
        element.className = "bj-card back";
        element.setAttribute("aria-label", "Face-down card");
        return element;
    }
    const jinx = card.suit === "jinx";
    const red = card.suit === "hearts" || card.suit === "diamonds";
    const symbol = SUIT_SYMBOLS[card.suit];
    element.className = `bj-card ${jinx ? "jinx" : red ? "red" : "black"}${card.gilded ? " gilded" : ""}`;
    element.setAttribute("aria-label", jinx ? "Jinx card" : `${card.gilded ? "Gilded " : ""}${card.rank} of ${card.suit}`);
    const rank = document.createElement("span");
    rank.textContent = jinx ? symbol : `${card.rank}${symbol}`;
    const corner = document.createElement("span");
    corner.className = "corner";
    corner.textContent = card.gilded ? "★" : symbol;
    element.append(rank, corner);
    return element;
}

export function cardLabel(card) {
    return card.suit === "jinx" ? "Jinx" : `${card.rank}${SUIT_SYMBOLS[card.suit]}`;
}
