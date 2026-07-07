/**
 * Speed-dependent fading trail left behind moving cars. Each frame a car
 * moves fast enough, a faint mark is spawned at its position; marks fade
 * and shrink over their lifetime. Update advances/prunes; draw renders.
 */
class MotionTrail {
    constructor() {
        /** @type {Array<object>} Live trail marks. */
        this.marks = [];
    }

    /**
     * Spawns a trail mark for a car if it is moving fast enough. Mark size
     * and starting opacity scale with speed so faster cars leave stronger trails.
     * @param {number} x - Car centre x in pixels.
     * @param {number} y - Car centre y in pixels.
     * @param {number} speed - Current car speed in pixels per step.
     * @param {string} color - Base colour of the trail (car's colour).
     * @return {void}
     */
    emit(x, y, speed, color) {
        if (speed < 1) return;
        this.marks.push({
            x: x,
            y: y,
            r: map(speed, 1, 7, 4, 12),
            life: 1.0,
            color: color
        });
    }

    /**
     * Ages every mark, reducing its life; removes fully-faded marks.
     * @return {void}
     */
    update() {
        for (let i = this.marks.length - 1; i >= 0; i--) {
            this.marks[i].life -= 0.04;
            if (this.marks[i].life <= 0) this.marks.splice(i, 1);
        }
    }

    /**
     * Draws every mark as a fading, shrinking circle.
     * @return {void}
     */
    draw() {
        noStroke();
        for (const m of this.marks) {
            const c = color(m.color);
            c.setAlpha(m.life * 120);
            fill(c);
            ellipse(m.x, m.y, m.r * m.life * 2);
        }
    }
}
