import { advanceTutorial, isTutorialActive, isTutorialAttackReview } from "../systems/TutorialSystem.js";
import { getHintsEnabled, saveHintsEnabled } from "../tutorialPreferences.js";
import { getTutorialLesson } from "./tutorialLessons.js";
import { positionGuide } from "./guidePosition.js";
import "./guide.css";

export class GuideView {
    constructor(state, onAdvance) {
        this.state = state;
        this.enabled = getHintsEnabled();
        this.panel = document.getElementById("guide");
        this.label = document.getElementById("guide-label");
        this.title = document.getElementById("guide-title");
        this.body = document.getElementById("guide-body");
        this.facts = document.getElementById("guide-facts");
        this.highlight = document.getElementById("guide-highlight");
        this.dismiss = document.getElementById("guide-dismiss");
        this.forecast = document.getElementById("turn-forecast");
        this.toggle = document.getElementById("hints-button");
        this.toggle.addEventListener("click", () => {
            this.enabled = !this.enabled;
            saveHintsEnabled(this.enabled);
            this.dismissedKey = null;
            this.revealRequested = this.enabled;
            this.refresh();
        });
        this.dismiss.addEventListener("click", () => {
            if (this.state.tutorial?.step === "energy" && !this.state.result) {
                advanceTutorial(this.state, "energy-explained");
                onAdvance();
                return;
            }
            if (isTutorialAttackReview(this.state) && this.state.phase === "enemy" && !this.state.result) {
                onAdvance("next-turn");
                return;
            }
            this.dismissedKey = this.lesson?.key;
            const target = this.describedTarget ?? document.querySelector(this.lesson.target);
            this.refresh();
            target?.focus({ preventScroll: true });
        });
        window.addEventListener("resize", () => this.schedulePosition());
        document.addEventListener("scroll", () => this.schedulePosition(), true);
        const observer = new ResizeObserver(() => this.schedulePosition());
        observer.observe(this.panel);
        observer.observe(document.getElementById("hand"));
    }

    refresh() {
        const state = this.state;
        const active = isTutorialActive(state);
        this.toggle.setAttribute("aria-pressed", String(this.enabled));
        this.toggle.textContent = `Hints: ${this.enabled ? "on" : "off"}`;
        this.toggle.disabled = active;
        this.toggle.title = active ? "Tutorial guidance stays on until you reach the next fight." : "Show optional combat tips";
        let lesson = getTutorialLesson(state);
        if (!lesson && this.enabled) {
            lesson = { key: `hint:${state.mode}:${state.result}`, title: "Choose your approach", target: ".mode-toggle",
                body: state.result ? "Next fight carries your HP forward and heals up to 10. Beat the final boss to complete the demo." :
                    state.mode === "poker" ? "Poker spends all 3 energy on one effect: high card up to 15 damage, a pair for 25 shield, or a flush for 30 healing. No mid-turn redraw. Shield persists up to 40, but clears between enemies." :
                        "Blackjack can hit harder than a single poker card, but losing or busting causes an immediate attack. Get closer to 21 than the enemy. Hit draws, Stand stops; the enemy draws to 17. Ties refund energy." };
        }
        document.querySelectorAll(".guide-card-target").forEach(element => element.classList.remove("guide-card-target"));
        this.describedTarget?.removeAttribute("aria-describedby");
        this.lesson = lesson;
        const visible = lesson && lesson.key !== this.dismissedKey && document.getElementById("menu").hidden;
        this.panel.hidden = !visible;
        this.highlight.hidden = !visible;
        if (visible) {
            this.label.textContent = active ? `Learn by playing / ${lesson.number} of 10` : "Field notes";
            this.title.textContent = lesson.title;
            this.body.textContent = lesson.body;
            const canContinue = ["energy", "finish"].includes(state.tutorial?.step) || isTutorialAttackReview(state);
            this.dismiss.hidden = active && (!canContinue || Boolean(state.result));
            this.dismiss.textContent = !state.result && isTutorialAttackReview(state) ? "Start next turn" :
                !state.result && state.tutorial?.step === "energy" ? "Try poker" : "Keep playing";
            this.facts.replaceChildren(...(lesson.facts ?? []).map(text => {
                const item = document.createElement("li");
                item.textContent = text;
                return item;
            }));
            this.facts.hidden = !lesson.facts?.length;
            if (lesson.target === "#hand") {
                document.querySelectorAll("#hand-inputs button:not(:disabled)").forEach(element => element.classList.add("guide-card-target"));
            }
            const target = document.querySelector(lesson.target);
            const control = (target.matches("button:not(:disabled)") ? target : target.querySelector("button:not(:disabled)")) ??
                (!this.dismiss.hidden ? this.dismiss : null);
            this.describedTarget = control;
            control?.setAttribute("aria-describedby", "guide-title guide-body guide-facts");
            if (this.lastKey !== lesson.key && (active || lesson.key === "complete" || this.revealRequested)) {
                target.scrollIntoView({ block: "center", inline: "nearest" });
                if (active) control?.focus({ preventScroll: true });
            }
            this.schedulePosition();
        }
        this.lastKey = visible ? lesson.key : null;
        this.revealRequested = false;
        const attack = state.enemy.intent?.value ?? 0;
        const blocked = Math.min(attack, state.player.shield);
        this.forecast.textContent = state.result ? "" : isTutorialAttackReview(state) ?
            "Attack resolved. Review your HP and shield, then choose Start next turn to draw 5 cards and refill energy." :
            `Click End turn: ${state.enemy.name} attacks for ${attack}; shield blocks ${blocked}; you lose ${Math.min(state.player.hp, attack - blocked)} HP. Then: 5 cards, ${state.player.maxEnergy} energy; ${state.player.shield - blocked} shield carries over.`;
    }

    schedulePosition() {
        if (this.frame) return;
        this.frame = requestAnimationFrame(() => {
            this.frame = null;
            this.position();
        });
    }

    position() {
        if (this.panel.hidden) return;
        const target = document.querySelector(this.lesson.target);
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const onScreen = rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0;
        this.panel.style.visibility = onScreen ? "visible" : "hidden";
        this.highlight.style.visibility = onScreen ? "visible" : "hidden";
        if (!onScreen) return;
        this.panel.style.maxHeight = `${window.innerHeight - 24}px`;
        const placed = positionGuide(rect, this.panel.getBoundingClientRect(), {
            width: document.documentElement.clientWidth, height: window.innerHeight,
        });
        Object.assign(this.panel.style, { left: `${placed.left}px`, top: `${placed.top}px`, maxHeight: `${placed.maxHeight}px` });
        this.panel.style.setProperty("--guide-arrow", `${placed.arrow}px`);
        this.panel.style.setProperty("--guide-left", `${placed.left}px`);
        this.panel.style.setProperty("--guide-top", `${placed.top}px`);
        this.panel.style.setProperty("--guide-right", `${placed.left + this.panel.offsetWidth}px`);
        this.panel.style.setProperty("--guide-bottom", `${placed.top + this.panel.offsetHeight}px`);
        this.panel.dataset.side = placed.side;
        Object.assign(this.highlight.style, {
            left: `${rect.left - 5}px`, top: `${rect.top - 5}px`,
            width: `${rect.width + 10}px`, height: `${rect.height + 10}px`,
        });
    }
}
