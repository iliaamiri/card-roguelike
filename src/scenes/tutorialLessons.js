import { isTutorialAttackReview, tutorialAllows } from "../systems/TutorialSystem.js";

/** Content stays independent of DOM positioning so lesson behavior can be tested. */
export function getTutorialLesson(state) {
    if (!state.tutorial) return null;
    const step = state.tutorial.step;
    if (step === "complete") {
        if (state.run.floor !== 2 || state.run.turn !== 1) return null;
        return { key: "complete", title: "Tutorial complete", target: "#fight-text",
            body: "Your HP carries into each fight, with up to 10 HP recovered after a win. Shield clears when you face a new enemy. Beat the remaining enemies and boss; future runs are random." };
    }
    if (state.result) {
        return { key: state.result, number: 10, target: "#play-button",
            title: state.result === "victory" ? "One down. Carry your HP forward." : "Try the lesson again",
            body: state.result === "victory" ? "Choose Next fight to recover up to 10 HP and finish the tutorial. HP carries forward, but all banked shield clears for the next enemy." :
                "Your HP reached zero. New run restarts the guided opening. Completion is saved only after you advance to fight 2." };
    }
    if (isTutorialAttackReview(state)) {
        const attack = state.tutorial.attack;
        const numbers = { draw: 3, "damage-review": 4, "wound-review": 5, "heal-review": 6 };
        return { key: step, number: numbers[step], target: ".stats", title: `Attack resolved: ${attack.damage} HP lost`,
            body: `The Goblin attacked for ${attack.incoming}. Your shield blocked ${attack.blocked} damage; you lost ${attack.damage} HP. Take a moment to check your health and shield above.`,
            facts: [`Shield: ${attack.shieldBefore} -> ${attack.shieldAfter}. HP: ${attack.hpBefore} -> ${attack.hpAfter}.`,
                `You still have ${state.player.energy} energy. Cards and energy have not refilled yet.`,
                "Choose Start next turn: draw 5 cards and refill to 3 energy. Leftover shield carries over, capped at 40. It clears only between enemies."] };
    }
    const selected = state.hand.filter(card => card.selected);
    const ready = selected.length > 0 && tutorialAllows(state, "play", selected);
    const handTarget = ready ? "#play-button" : "#hand";
    const lessons = {
        energy: { number: 1, target: "#energy-chips", title: "3 energy per turn",
            body: "These three chips are your energy budget. Poker costs all 3 energy: one reliable effect for the turn. Blackjack Deal costs 1, allowing up to three risky rounds. Hit and Stand are free.",
            facts: ["Choose poker before spending any energy on blackjack, or end your turn early.",
                "Clicking End turn makes the Goblin attack you.",
                "After that attack, start the next turn with 5 cards and 3 energy. Shield carries between turns, but clears between enemies."] },
        pair: { number: 2, target: handTarget, title: ready ? "Play the pair: 25 shield" : "Poker adapts to your hand",
            body: ready ? "Spend all 3 energy for 25 shield. Attacks consume shield first, and anything left stays for later turns. Shield cannot exceed 40. Your whole hand is discarded; draw again next turn." :
                "Pairs shield, flushes heal, and even a single card deals reliable damage. Try it: select the two highlighted 7s to make a pair.",
            facts: ready ? [] : ["Goal: beat four enemies, ending with a boss."] },
        damage: { number: 4, target: handTarget, title: ready ? "High card: 15 reliable damage" : "Your 16 shield carried over",
            body: ready ? "High card deals 1.5 times the highest card's value, rounded up and capped at 15. The King guarantees 15 damage for all 3 energy. Your banked shield stays intact until an attack consumes it." :
                "You drew a fresh hand and refilled to 3 energy without losing your remaining shield. Select the King for a dependable 15-damage attack." },
        block: { number: 3, target: "#end-turn-button", title: "End turn makes the Goblin attack",
            body: "You have 0 energy left. Click End turn and the Goblin attacks for 9 immediately. This button gives the enemy its turn; it is not a free refill.",
            facts: ["Your 25 shield blocks all 9 damage, leaving 16 shield and 0 HP lost.",
                "After the attack: draw 5 cards and refill to 3 energy. The remaining shield stays for this enemy."] },
        "damage-end": { number: 4, target: "#end-turn-button", title: "Attack while your shield protects you",
            body: "Your King dealt 15 damage and used all 3 energy. End turn: the Goblin attacks for 9, reducing your banked shield from 16 to 7 without touching HP." },
        unshielded: { number: 5, target: "#end-turn-button", title: "Banked shield can run out",
            body: "You still have 7 shield. For this practice turn, End turn without adding more: it blocks 7 of the Goblin's 9 damage, then the remaining 2 hits your HP. We will pause to review it, then heal.",
            facts: ["Shield persists, but it is spent when blocking. You cannot bank more than 40."] },
        heal: { number: 6, target: handTarget, title: ready ? "Flush: heal up to 30 HP" : "Use poker to recover",
            body: ready ? `A flush heals up to 30 HP for all 3 energy. At ${state.player.hp} HP, it restores ${Math.min(30, state.player.maxHp - state.player.hp)} HP, capped at ${state.player.maxHp}. Play it to heal; your next hand comes next turn.` :
                "Your shield ran out and you lost 2 HP. Select all five hearts for a flush: up to 30 healing for 3 energy. Healing cannot exceed your maximum HP." },
        "heal-end": { number: 6, target: "#end-turn-button", title: "Healing takes the whole turn",
            body: "The flush restored your HP but spent all 3 energy. With no shield remaining, End turn lets the Goblin deal 9 damage. Healing is recovery, not defense. Next turn we will try blackjack." },
        deal: state.mode === "poker" ? {
            number: 7, target: '.mode-option[data-mode="blackjack"]', title: "More damage, more risk",
            body: "Poker uses a full turn for one predictable effect. Blackjack costs 1 energy per round: up to three chances to beat poker's 15 high-card damage, but losing triggers an immediate attack. Switch to Blackjack.",
        } : {
            number: 7, target: "#play-button", title: "Blackjack in a nutshell",
            body: "Beat the enemy's total without going over 21. Deal: 1 energy, separate cards from the deck.",
            facts: ["2-10: shown value. J/Q/K: 10. Ace: 11 or 1.",
                "Win: your total as damage.",
                "Lose/bust: immediate attack. Tie: energy back."],
        },
        hit: { number: 8, target: "#play-button", title: "Hit: take one more card",
            body: "Your total is 10. Hit draws another card for no extra energy. Get closer to 21, but go over and you bust. The enemy's second card stays hidden until you stand." },
        stand: { number: 9, target: "#stand-button", title: "Stand: keep your 18",
            body: "Stand stops your draw and reveals the enemy's hand. The enemy draws until at least 17. Highest total without busting wins. Finish a round before switching modes or ending your turn.",
            facts: ["Natural blackjack (Ace + a 10-value card) deals 30 damage."] },
        finish: { number: 10, target: ".mode-toggle", title: "Choose the tool you need",
            body: "Your 18 beat 17: 18 damage for 1 energy, versus the King's reliable 15 for 3. Poker offers lasting shield, healing, or dependable damage; blackjack risks immediate attacks for more damage per energy. Defeat the Goblin, then choose Next fight." },
    };
    const lesson = lessons[step];
    const selectionStep = ["pair", "damage", "heal"].includes(step);
    const key = `${step}:${selectionStep ? ready : ""}:${step === "deal" ? state.mode : ""}`;
    return lesson ? { ...lesson, key } : null;
}
