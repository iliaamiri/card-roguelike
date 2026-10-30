# Guided Combat Demo

Status: approved and implemented. Completion occurs on reaching fight 2.

## Objective

Teach a new player the combat loop through play, then let them finish the demo's
four-fight run without mandatory guidance. Keep rewards, accounts, progression,
shops, and deckbuilding out of scope.

Confirmed requirements:

- First run introduces mechanics with guided play and fixed opening cards.
- Subsequent runs use random cards and encounters, with optional hints.
- Tutorial completion must eventually be usable as an account progression flag.

## Proposed Experience

1. First Play starts a guided run in poker mode against a fixed opening enemy.
   First anchor a tooltip to the three energy chips. Explain the 3-energy budget,
   full-turn 3-energy poker versus 1-energy Deal, free Hit/Stand, and attack-before-refill order.
   The player chooses Try poker to continue without spending any resources.
   Then anchor guidance to the highlighted cards instead of a top text panel.
   Explain the four-fight goal.
2. Supply a fixed five-card opening hand with one obvious pair. Ask the player
   to select and play that pair for 25 shield and all 3 energy. Discard the whole
   hand without drawing again until next turn. The next hand contains a King
   for 15 reliable High card damage, also costing 3 energy.
3. Ask the player to end the turn. Show incoming damage, how much shield blocks,
   and actual HP lost. Explain that the next turn restores energy, preserves shield,
   and replaces the poker hand. Explicitly state that clicking End turn triggers
   the Goblin's attack before any refill. Its fixed attack is 9, within its normal range.
   Hold the resolved attack on the HP/shield display until the player chooses
   Start next turn. Show actual blocked damage, HP lost, and before/after resource
   values; do not clear shield or refill energy on an automatic timer in this lesson.
4. All runs start at 100 HP. Show shield carrying from 25 to 16 after the first
   attack, then to 7 after the King's attack turn. End one practice turn without
   adding shield: 7 blocks part of the next 9-damage attack, leaving 98 HP.
   Pause for review. Play a flush for up to 30 healing, costing all 3 energy, then
   end that turn and review its unshielded attack before blackjack. No free energy
   refills or shield removal are used to force the tutorial sequence.
5. Introduce blackjack using a fixed draw sequence that supports Hit and Stand.
   Explain that it draws from the shared deck, not the poker hand. State before
   dealing that a loss causes an immediate attack in addition to End Turn's attack.
   Explain the goal of 21, card values, bust, ties, dealer drawing to 17, and
   natural blackjack. Compare its 18 damage for 1 energy with the King's 15 for 3:
   higher damage per energy at higher risk, not stronger than every poker combo.
6. Release turn-by-turn restrictions once these lessons are demonstrated. Guide
   the player through defeating the opening enemy and choosing Next fight.
7. Explain carried HP and between-fight healing at that transition. Mark tutorial
   complete, then continue the remaining random fights without mandatory guidance.
8. End with a clear demo victory or defeat screen and a replay action.

Only the teaching setup is deterministic. Preserve all 52 unique cards and normal
combat calculations; do not fake damage, silently grant resources, or duplicate
cards. Fix the opening enemy's teaching attack as needed for a predictable block.

Balance pass: high card is ceil(value x 1.5), capped at 15. Pair gives 25 shield,
two pair 40, three of a kind 35 damage, straight 45, flush heals 30, full house
45 damage + 25 shield, four of a kind 65 damage, straight flush 75 damage + 25
healing, and royal flush 100 damage. Shield stacks to 40, persists between turns,
and is cleared by moving to the next enemy. Healing is capped at max HP.

## Guidance And Completion

- Advance lessons only after the required gameplay action succeeds, not merely
  because a prompt was dismissed.
- Outline the relevant cards/control. Move the tooltip from selection to the play
  button once the required cards are selected. Follow resize and scrolling, fit
  small screens, and do not cover the target action. Keep keyboard focus on the
  next usable control; hide guidance while the menu is open.
- Disable automatic End Turn during mandatory lessons so explanations remain
  readable and the player explicitly learns the turn boundary.
- Keep tutorial progress in run state, separate from persistent completion.
- Store completion locally for now. Treat missing or unavailable storage as
  incomplete; failed persistence must not interrupt the active run.
- Keep completion reads/writes behind a small dedicated module so account data
  can replace local storage later without changing combat systems.
- Offer Replay tutorial from the menu, independent of existing completion.
- Offer an optional contextual Hints toggle for normal play. Hints must not
  restrict actions or alter randomness. Keep existing How to play reference.
- Abandoning or losing before the final lesson must not mark completion.
- Replaying an already completed tutorial must not erase prior completion.

## Tech Stack And Structure

Retain JavaScript ES modules, Vite 8, PixiJS 8, and HTML/CSS interface.

- `src/gameState.js`: create normal or tutorial run state.
- `src/systems/`: deterministic tutorial setup and action-driven lesson progress.
- `src/scenes/`: contextual guidance, menu routing, and existing battle controller.
- `src/scenes/tutorialLessons.js`, `guidePosition.js`: testable tooltip content
  and viewport positioning, separate from DOM synchronization.
- Dedicated preference module: local completion and hints preferences.
- `index.html`, `src/style.css`: accessible guidance and controls using existing styles.
- `tests/`: Node built-in test runner for setup, progression, and persistence behavior.
- `README.md`: player-facing tutorial behavior and verification commands.

Keep combat effects in existing systems. Tutorial code observes successful actions
and constrains lesson inputs; it must not implement a second combat engine.

## Commands

- Install: `npm ci`
- Develop: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- Proposed test script: `npm test`, running `node --test` without new dependencies.

## Code Style

Match nearby JavaScript formatting and prefer named exports and small functions.
For example, a lesson transition should consume an explicit successful event:

```js
export function advanceTutorial(state, event) {
    if (!state.tutorial || state.tutorial.step !== "block") return;
    if (event.type === "turn-ended" && event.blocked > 0) {
        state.tutorial.step = "blackjack";
    }
}
```

Names and event shape are illustrative, not a required event-bus architecture.

## Testing And Success Criteria

- Unit tests prove fixed tutorial setup preserves 52 unique cards.
- Normal run creation still shuffles and selects encounters without tutorial overrides.
- Invalid or unrelated actions cannot advance lessons or consume locked resources.
- Completion occurs only at the agreed final lesson and survives reload when storage works.
- Abandon, defeat, replay, and unavailable storage paths behave as described above.
- Browser verification covers a fresh visitor, tutorial replay, returning player,
  hints toggle, restarting during guidance, and menu navigation.
- Guidance and controls remain usable at desktop and mobile widths in both themes.
- Player can complete the demo without consulting external instructions.
- Build and automated tests pass before handoff.

## Boundaries

- Always: preserve normal combat rules, explain costs before actions, cancel stale
  lesson work on restart, and keep tutorial completion independent of run victory.
- Ask first: change combat balance, remove either card mode, add dependencies, or
  introduce account/backend infrastructure.
- Never: add shops, rewards, deckbuilding, or pretend local completion is account data.

## Completion Decision

Complete after the first Next fight transition. This measures learning the loop,
not winning the demo. Boss victory is not required. When local storage is blocked,
the battle controller retains completion for the active page session only.
