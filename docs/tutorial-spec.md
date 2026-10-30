# Guided Opening

Status: implemented for the core-loop overhaul (2-energy poker, mulligans, decaying shield, enemy intents, rewards). Completion occurs on reaching fight 2.

## Objective

Teach the core loop by doing, then get out of the way. The player should finish the first fight on their own and never need to read the How to play dialog to keep going. Floors, the shop, Jokers and Curses are introduced in one line at the end and learned in play.

Principles:

- One action per step, learned by doing it. Short text: what to do and why it matters, not a rules dump.
- Lock only what the scripted cards depend on. Where the outcome doesn't matter, the player chooses (which cards to mulligan; double down, hit, stand or surrender).
- Every effect uses the normal rules. Only the setup is scripted: the opening hand, the first blackjack cards, the Goblin's first two moves and its HP.

## Steps

| # | Step | The player does | Allowed | Teaches |
|---|---|---|---|---|
| 1 | `intro` | Reads the tip, clicks **Let's go** | nothing else | Enemy intent; 3 energy; costs (poker 2, mulligan 1, deal 1) |
| 2 | `pair` | Selects both 7s and plays them | only the pair | Poker hands; only played cards are discarded |
| 3 | `mulligan` | Swaps any 1 to 3 cards | selecting, mulligan | Mulligans; the hand carries into next turn |
| 4 | `end-turn` | Clicks End turn | End turn | The enemy acts; shield blocks first, then halves for a turn, then vanishes |
| 5 | `blackjack` | Switches to blackjack, deals, plays the round | blackjack actions only | Blackjack basics, chips, loss penalty; double down and surrender |
| 6 | `free` | Finishes the Goblin | everything | Reading varied intents; turns now end on their own |

After step 6 the reward dialog adds one line about rewards. Reaching fight 2 marks the tutorial complete and shows a closing tip: floors, bosses, the Curse choice and the shop.

## Scripted setup

- Opening hand: 7♠ 7♥ K♠ 2♦ 3♣. The Goblin's first move is an attack for 9, so the pair's 25 shield blocks it and 16 decays to 8.
- The first blackjack round is fixed whatever the player mulliganed: those five cards wait at the bottom of the draw pile and move to the top when step 5 starts. You get 6 + 5 = 11, the Goblin shows 10 with a 7 underneath, and the next card is a 10. Doubling down wins 42, hitting wins 21, standing loses.
- The Goblin has 60 HP in the tutorial so even a doubled 21 doesn't end the fight: the player always gets a free-play turn. Its second move is an attack for 6; after that its moves are random.
- All 52 cards stay unique; nothing is faked or granted.

## Guidance and completion

- Lessons advance only after the action succeeds (`advanceTutorial`), never on dismissal, except step 1.
- The tooltip points at the control to use next (cards, then Play cards; cards, then Mulligan; the Blackjack toggle, then Deal, then Double down).
- Turns don't end automatically until step 6.
- Completion is stored locally via `tutorialPreferences.js` when the player reaches fight 2. Losing or abandoning earlier doesn't count; replaying doesn't erase completion.
- **Hints** (optional tips during normal play) never restrict actions.

## Files

- `src/systems/TutorialSystem.js`: setup, step order, `tutorialAllows()`, `advanceTutorial()`.
- `src/scenes/tutorialLessons.js`: lesson text and targets, testable without the DOM.
- `src/scenes/GuideView.js`, `guidePosition.js`, `guide.css`: tooltip display and placement.
- `tests/tutorial.test.js`, `tests/tutorialLessons.test.js`: setup, locks, progression and completion.
