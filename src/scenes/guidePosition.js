/** Place a coachmark beside its target, never over the action it explains. */
export function positionGuide(rect, size, viewport) {
    const margin = 12;
    const gap = 14;
    const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
    const above = rect.top - gap - margin;
    const below = viewport.height - rect.bottom - gap - margin;
    let side;
    if (above >= size.height) side = "above";
    else if (below >= size.height) side = "below";
    else if (viewport.width - rect.right - gap - margin >= size.width) side = "right";
    else if (rect.left - gap - margin >= size.width) side = "left";
    else side = above >= below ? "above" : "below";

    const vertical = side === "above" || side === "below";
    const maxHeight = vertical ? Math.max(40, side === "above" ? above : below) : viewport.height - margin * 2;
    const height = Math.min(size.height, maxHeight);
    const left = vertical ? clamp(rect.left + rect.width / 2 - size.width / 2, margin, viewport.width - size.width - margin) :
        side === "right" ? rect.right + gap : rect.left - gap - size.width;
    const top = vertical ? (side === "above" ? rect.top - gap - height : rect.bottom + gap) :
        clamp(rect.top + rect.height / 2 - height / 2, margin, viewport.height - height - margin);
    const arrow = vertical ? clamp(rect.left + rect.width / 2 - left, 20, size.width - 20) :
        clamp(rect.top + rect.height / 2 - top, 20, height - 20);
    return { left, top, side, maxHeight, arrow };
}
