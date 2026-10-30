# Juniper

A playing-card roguelike prototype built with JavaScript, Vite and PixiJS.

[Play Juniper](https://ljf920727.github.io/card-roguelike/)

## Run locally

Use Node.js 24 with npm, matching the deployment workflow. Vite also supports Node.js 20.x from 20.19, or Node.js 22.12 and newer. Install dependencies with `npm ci`, then run `npm run dev` and open the local URL printed by Vite. `npm run build` creates a production build in `dist`; `npm run preview` serves it locally for verification.

Use **Light mode / Dark mode** at the top right to switch appearance. The choice is saved locally and survives battle restarts and page reloads.

## Deploy to GitHub Pages

A repository administrator must select **GitHub Actions** as the source in **Settings → Pages → Build and deployment**. Once `.github/workflows/deploy-pages.yml` is on `main`, pushes to `main` build and deploy the game. You can also open **Actions → Deploy to GitHub Pages → Run workflow** and select `main`; other branches are skipped.

The workflow uses Node.js 24, installs the locked dependencies with `npm ci`, and uploads only `dist`. Vite's base path comes from the Pages configuration, supporting both a repository subpath and a custom domain. No personal access token is required. See the [GitHub Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) and [Vite deployment guide](https://vite.dev/guide/static-deploy.html#github-pages).

To check the repository subpath locally:

```sh
npm run build -- --base=/card-roguelike/
npm run preview -- --base=/card-roguelike/
```

Open the preview URL ending in `/card-roguelike/`, check that the game and tab icon load, then start or replay the tutorial. Play the highlighted pair: energy should fall to 0 and shield rise to 25. End turn, review the attack, and start the next turn: 16 shield should carry over and five cards should appear. Repeat after deployment using the `github-pages` environment URL in Actions.

## Play a run

### First-time tutorial

**Play tutorial** starts at 100 HP against a Goblin. Follow ten short,
interactive lessons: inspect energy, play two 7s for 25 shield, then block an attack.
Carry the remaining 16 shield into a 15-damage King play on the next turn. Watch
banked shield get consumed by attacks, then play five hearts to heal up to 30 HP.
Switch to blackjack for a quick
rules explanation, then Deal, Hit and Stand in a scripted round. Finish the fight using either mode and choose
**Next fight** to complete the tutorial. Combat effects and costs are the real game
rules; the setup only fixes the teaching cards and opening attack.

Guidance appears beside the cards or control being explained, with an outline and
arrow. Select the highlighted cards and the tooltip moves to **Play cards**.
The opening tip explains the 3-energy budget and shared poker/blackjack costs.
The **End turn** lesson makes the sequence explicit: the Goblin attacks first,
then you draw five cards and refill to 3 energy. Unspent energy does not carry over,
but surviving shield does, capped at 40. Shield clears only when facing a new enemy.
After each teaching attack, the tutorial pauses on your HP and shield with an exact
before/after breakdown. Choose **Start next turn** when ready; no timer advances
this review or clears the remaining shield. Normal combat keeps its existing pace.
Poker demonstrates flexible shield, healing, and reliable high-card damage;
blackjack demonstrates more damage per energy than high card at the risk of
immediate enemy attacks. Strong poker combinations can still hit harder. Dismiss
the final comparison with **Keep playing** once free play begins.

Turns stay manual during the guided opening. Unrelated controls are disabled until
their lesson is reached. Cards support pointer selection or Tab and Space/Enter.
The End turn forecast shows incoming damage, shield blocking, and HP loss.

Completion is stored locally, separately from run state. Later runs are random;
**Hints** toggles optional combat tips and remembers the choice. **Replay tutorial**
in Menu always starts the guided setup without clearing prior completion. Leaving
or losing before reaching fight 2 does not count as completing the tutorial. If
browser storage is unavailable, completion lasts only for the current page session.
There are no accounts or saved runs yet. See [tutorial spec](docs/tutorial-spec.md).

### Normal runs

The game opens on a main menu. **Play** starts a run, **How to play** shows the rules, and the theme button switches between light and dark. During a run, **Menu** in the top bar or the Esc key brings the menu back with **Continue run** and **New run**.

Each run starts at 100 HP and spans four fights against randomly chosen enemies; the last one is a boss (Ogre or Witch). You play from a shuffled 52-card deck and draw 5 cards each turn.

You have 3 energy per turn. Pick a combo type with the **Blackjack / Poker** toggle, then spend energy in that mode. You can't switch modes or end your turn in the middle of a blackjack round.

- **Blackjack:** **Deal** (1 energy) gives you 2 cards from the draw pile and the enemy 2, one face down. **Hit** takes another card, **Stand** stops; the enemy then draws until it reaches 17. Aces count as 11 or 1; J/Q/K count as 10. Win and the enemy takes damage equal to your total (a natural blackjack, Ace plus a 10-value card, deals 30). Lose or bust and the enemy hits you for its attack value, with shield absorbing first. A tie (push) refunds the energy.
- **Poker:** select 1 to 5 cards and click **Play cards** (3 energy). This uses the full turn's energy budget. The best selected poker hand is played:

  | Hand | Effect |
  |---|---|
  | Royal flush | 100 damage |
  | Straight flush | 75 damage, heal 25 |
  | Four of a kind | 65 damage |
  | Full house | 45 damage, 25 shield |
  | Flush | heal 30 |
  | Straight | 45 damage (A-2-3-4-5 counts; no wrap-around) |
  | Three of a kind | 35 damage |
  | Two pair | 40 shield |
  | Pair | 25 shield |
  | High card | highest card value x 1.5, rounded up, capped at 15 |

Every valid poker play costs 3 energy and discards the entire hand, including
unplayed cards. No mid-turn redraw occurs; draw five cards at the start of your
next turn. Poker requires all 3 energy remaining; a paid blackjack round leaves
too little unless a push refunds that energy.
High card uses blackjack values (face cards 10, Ace 11) before scaling and capping,
so 10/J/Q/K/A all deal 15 damage. Shield stacks to 40 and persists between turns;
attacks consume it, and moving to a new enemy clears it. Healing caps at max HP.
Invalid plays do not spend energy, discard, or draw.

Outside the tutorial opening, your turn ends on its own about a second after you run out of cards or energy (unless a blackjack round is still in progress); controls lock during that pause. You can also end it early with **End turn**.

**End turn** resolves the enemy's displayed attack. Shield absorbs damage first. If you survive, your remaining hand is discarded, you draw 5 cards, energy refills to 3, unused shield carries over, and the enemy rolls its next attack. When the draw pile runs out, the discard pile is reshuffled into it. Controls briefly lock during enemy resolution so a double click cannot end two turns.

Defeating an enemy shows **Next fight**. Your HP carries over and you recover up to 10 HP before the next enemy. Beating the boss completes the run; reaching 0 HP ends it. Either way the main button becomes **New run**, which starts a fresh random run. **New run** in the side panel abandons the current run at any time.

Jokers, rewards and deckbuilding are future work. Battle visuals use PixiJS drawing code and system fonts; the browser tab icon is a bundled PNG. No runtime requests to external asset services are needed.

## What Each File Does

Tutorial lesson setup, restrictions, and action-driven progression live in
`src/systems/TutorialSystem.js`. `src/scenes/tutorialLessons.js` supplies contextual
lesson content; `src/scenes/guidePosition.js` places tooltips without covering their
targets. `src/scenes/GuideView.js` displays lessons, tips, and the turn forecast;
`src/scenes/guide.css` styles guidance and keyboard card
controls. `src/tutorialPreferences.js` handles completion and hint storage so
future account integration can replace local persistence independently of combat.

Run `npm test` for the Node built-in test suite, and `npm run build` for production
verification. No additional test dependencies are required.

This project separates the UI, game rules, combat logic, and game data so team members can work on different parts without interfering with each other.

### `src/gameState.js`

**Purpose:** Stores the current game data.

Examples:

- Player HP
- Shield
- Energy
- Enemy HP
- Enemy intent
- Battle phase
- Victory or defeat result
- Turn
- Draw pile, discard pile and played cards
- Run progress and the random fight list
- Current hand
- Selection preview and latest action feedback

`createInitialState()` creates independent battle data. `resetGameState()` restores it while preserving the outer state reference used by the UI.

working on **game logic or balancing** can edit this file when new game state values are needed.

Example:

```js
const gameState = {
    player: {
        hp: 100,
        maxHp: 100,
        shield: 0,
        energy: 3,
    },
};
```

✅ Safe to modify when adding new game state values.

⚠️ Avoid renaming existing properties unless the other files using them are also updated.

---

### `src/components/CardView.js`

**Purpose:** Controls how an individual playing card looks and behaves.

It currently handles:

- Card rank
- Card suit
- Red / black card colours
- Card selection
- Selected card highlight
- Card position when selected

working on **card UI or visual design** can edit this file.

Examples of things that can be changed:

- Card size
- Font size
- Card border
- Selection animation
- Hover effect
- Card artwork

✅ UI changes are welcome.

⚠️ Avoid changing the card data structure:

```js
id
rank
suit
selected
```

unless the team agrees to update the rest of the project. Card IDs are unique across the 52-card deck; selection and play validation share these card objects.

---

### `src/scenes/BattleScene.js`

**Purpose:** Connects the battle screen to the game state.

The interface itself is HTML in `index.html`, laid out with flexbox and grid in `src/style.css`. `BattleScene` fills in its text, wires up the buttons and keeps it in sync with the state:

- Player HUD (HP bar, shield, energy chips)
- Enemy token, HP ring and intent
- Run progress, deck counts and rules for the active combo type
- Blackjack / Poker combo type toggle
- Selected card preview and feedback
- Play cards / Next fight / New run and End turn buttons
- Light / dark mode, published as CSS custom properties from `themes.js`

Only the player hand is drawn with PixiJS. `resize()` scales the cards to the width of the `#hand` element and sizes the canvas to fit.

Selection previews come from `RuleEngine`. Play validation and resource consumption are delegated to `PlaySystem`; enemy turns are delegated to `TurnSystem`. Keep combination detection and combat calculations in those systems.

This is the main **battle UI file**.

working on:

- HUD layout
- Enemy display
- Buttons
- Battle screen
- Visual feedback

can work here.

✅ Safe to improve UI and add new battle elements.

⚠️ This file is large and is used by many parts of the prototype. Try not to completely rewrite it without discussing or backup.

---

### `src/systems/BlackjackSystem.js`

**Purpose:** Calculates Blackjack card values and runs blackjack rounds.

It handles:

- Number cards
- J / Q / K = 10
- Ace = 11 or 1
- Blackjack total
- `dealRound()`, `hit()` and `stand()` against the enemy dealer, who draws to 17
- Resolving a round: damage on a win, the enemy's attack on a loss or bust, an energy refund on a push

Example:

```text
A + K = 21
```

This file should mainly be changed by team members working on **card rules**.

✅ Safe to change if we decide to modify Blackjack rules.

⚠️ Do not put UI code inside this file.

---

### `src/systems/RuleEngine.js`

**Purpose:** Finds the best poker hand in the selected cards and returns its combat actions.

A hand can grant more than one action (a full house deals damage and gives shield), so evaluations return an `actions` list that `PlaySystem` applies in order through `CombatSystem.applyActions()`.

✅ Good place for gameplay-rule development.

⚠️ Keep hand detection in `src/systems/rules/` rather than in `RuleEngine.js`.

---

### `src/systems/rules/PokerRule.js`

**Purpose:** Detects all ten poker hands, from high card to royal flush, in 1 to 5 cards, and defines each hand's effect in `POKER_HANDS`. The side panel's hand list is generated from `POKER_HANDS`, so changing an effect there updates the UI too.

✅ Safe for gameplay balancing.

---

### `src/systems/CombatSystem.js`

**Purpose:** Applies combat actions to the game state.

Current actions:

```text
attack
defend
heal
```

Examples:

```text
attack
→ reduce enemy HP

defend
→ increase player Shield

heal
→ increase player HP
```

working on **combat mechanics** can extend this file.

Future actions could include:

```text
buff
debuff
poison
stun
draw
energy
```

✅ Safe to add new combat action types.

⚠️ Card-combination detection should stay in the Rule Engine, not here.

---

### `src/systems/PlaySystem.js`

**Purpose:** Validates and resolves a player card play.

It checks the battle phase, live selection, combination and available energy. A valid play delegates its effect to `CombatSystem`, consumes 3 energy, discards the whole hand and clears selection. No replacement cards are drawn until next turn. Invalid plays leave battle resources unchanged.

Keep play permission and resource consumption here; keep combination detection in `RuleEngine` and rendering in `BattleScene`.

---

### `src/systems/TurnSystem.js`

**Purpose:** Resolves the enemy turn and deals the next hand.

`beginEndTurn()` enters the enemy phase and delegates shield-first damage to `CombatSystem`. `completeEndTurn()` advances the turn, preserves unused shield, restores energy, discards the hand, draws 5 cards and rolls the next attack. `CombatSystem` caps shield at 40 and detects victory/defeat; `RunSystem` clears shield between enemies.

---

### `src/systems/DeckSystem.js`

**Purpose:** Creates and shuffles the 52-card deck, draws cards (reshuffling the discard pile when the draw pile is empty) and discards the hand at the end of a turn.

---

### `src/systems/RunSystem.js`

**Purpose:** Builds a run's random fight list (three enemies, then a boss), creates enemies, rolls their attack intent and moves the player to the next fight after a victory.

`BattleScene` handles the short input-lock timer and cancels it on restart; turn calculations remain here.

---

### `src/scenes/MenuScreen.js`

**Purpose:** Shows the main menu over the battle and routes Play / Continue run, New run, How to play and the theme toggle to `BattleScene`. While the menu is open the battle is made inert, so it can't be clicked or tabbed into.

---

### `src/main.js`

**Purpose:** Starts PixiJS and loads the battle scene.

It:

- Creates the PixiJS application for the card canvas
- Adds the canvas to the `#hand` element
- Creates `BattleScene` and opens the `MenuScreen`
- Hides the loading splash once the scene is ready

This is mainly a startup file.

⚠️ Please avoid changing this file unless you are adding a new scene, changing application startup, or fixing a related issue.

---

### `src/themes.js`

**Purpose:** Defines the dark and light color palettes and saves the local appearance preference.

Theme preference is separate from battle data. `BattleScene` repaints the views; switching appearance or restarting does not reset the preference. Unavailable browser storage does not prevent switching.

---

### `src/style.css`

**Purpose:** Lays out and styles the battle interface.

It uses flexbox and grid, so the layout adapts to the screen: the side panel moves below the table under 900px wide, and the hand row stacks with a horizontal combo toggle under 640px. Colors are CSS custom properties set from `themes.js`.

✅ Safe for UI / presentation changes.

---

### `index.html`, `public/card-icon.png` and `.github/workflows/deploy-pages.yml`

`index.html` holds the battle interface markup, the loading splash (styled inline so it shows before the main stylesheet loads) and references the browser tab icon in `public/card-icon.png`. The deployment workflow builds the Vite site with the Pages base path and publishes only `dist`.

---

## Recommended

To avoid merge conflicts, everyone can divide work by system.

### UI / Art

Work mainly in:

```text
src/components/CardView.js
src/scenes/BattleScene.js
src/themes.js
src/style.css
```

Possible tasks:

- Improve card visuals
- Add HP bars
- Add icons
- Add enemy artwork
- Add animations
- Improve button design

---

### Card Rules

Work mainly in:

```text
src/systems/rules/
src/systems/RuleEngine.js
src/systems/BlackjackSystem.js
```

Possible tasks:

- Straight
- Flush
- Three of a Kind
- Full House
- New attack / defense / healing combinations

When possible, create a new rule file.

Example:

```text
src/systems/rules/FlushRule.js
```

instead of adding a large amount of code directly into `RuleEngine.js`.

---

### Combat Logic

Work mainly in:

```text
src/systems/CombatSystem.js
src/systems/PlaySystem.js
src/systems/TurnSystem.js
src/gameState.js
```

Possible tasks:

- Enemy attacks
- Shield damage
- Energy costs
- Buffs
- Debuffs
- Death checking
- Turn resolution

---

### Deck / Card Logic

`src/systems/DeckSystem.js` handles the 52-card deck: creating, shuffling, drawing, discarding and reshuffling the discard pile. Jokers are not in the deck yet; their behavior still needs to be agreed by the team.

---

### Turn System

The `End turn` button delegates enemy damage and the next draw to `src/systems/TurnSystem.js`:

```text
Player plays cards
→ Enemy acts
→ Shield updates
→ Hand and played cards discarded
→ 5 new cards drawn
→ Energy restored
→ Enemy rolls its next attack
→ Next turn
```

Rewards and deckbuilding between fights remain future work.

---

## Important Development Rule

Try to keep these responsibilities separate:

```text
CardView
→ How cards look

BattleScene
→ Battle rendering, input events and UI timing

RuleEngine / rules
→ What card combinations mean

CombatSystem
→ Combat effects, HP bounds and victory / defeat detection

PlaySystem
→ Play validation, energy cost and used-card movement

TurnSystem
→ Enemy resolution and next-turn restoration

gameState
→ Current game data and reset

themes
→ Appearance colors and local preference
```

For example:

Do **not** calculate Pair rules inside `BattleScene.js`.

Instead:

```text
BattleScene
→ requests a play

PlaySystem
→ validates the live selection through RuleEngine

RuleEngine
→ returns the Pair shield action

PlaySystem
→ delegates the combat effect

CombatSystem
→ gives Shield

PlaySystem
→ consumes 3 energy and discards the hand until next turn

BattleScene
→ updates the display
```

Keep state and card schema changes coordinated with their consumers, and add new combination rules in separate files whenever possible. Keeping these systems separate helps team members work independently.

---
