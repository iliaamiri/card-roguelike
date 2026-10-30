import test from "node:test";
import assert from "node:assert/strict";
import { positionGuide } from "../src/scenes/guidePosition.js";

test("tooltip sits above its target without covering it", () => {
    const rect = { left: 100, right: 300, top: 500, bottom: 600, width: 200, height: 100 };
    const placed = positionGuide(rect, { width: 320, height: 160 }, { width: 1000, height: 800 });
    assert.equal(placed.side, "above");
    assert.ok(placed.top + 160 < rect.top);
});

test("tooltip below a top-edge target stays within a narrow screen", () => {
    const rect = { left: 5, right: 105, top: 20, bottom: 60, width: 100, height: 40 };
    const placed = positionGuide(rect, { width: 296, height: 200 }, { width: 320, height: 640 });
    assert.equal(placed.side, "below");
    assert.ok(placed.top > rect.bottom);
    assert.ok(placed.left >= 12);
    assert.ok(placed.left + 296 <= 308);
});

test("short mobile screen clips tooltip height instead of covering target", () => {
    const rect = { left: 30, right: 290, top: 170, bottom: 310, width: 260, height: 140 };
    const placed = positionGuide(rect, { width: 296, height: 300 }, { width: 320, height: 480 });
    assert.ok(placed.maxHeight < 300);
    assert.ok(placed.top >= 12);
    assert.ok(placed.top + placed.maxHeight < rect.top || placed.top > rect.bottom);
});
