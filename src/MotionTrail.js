/** Class representing a fading motion trail. */
class MotionTrail {
    constructor() {
        /**
         * An array of trail objects, each holding its position, radius, colour, and remaining life.
         * @type {Array<object>}
         */
        this.marks = [];
    }

    /**
     * Adds a trail mark behind a moving car, where it's sized by speed.
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
            // Faster cars leave larger marks.
            r: map(speed, 1, 7, 4, 12),
            life: 1.0,
            color: color
        });
    }

    /**
     * Fades each mark and removes those that have expired.
     * @return {void}
     */
    update() {
        for (let i = this.marks.length - 1; i >= 0; i--) {
            this.marks[i].life -= 0.04;
            if (this.marks[i].life <= 0) this.marks.splice(i, 1);
        }
    }

    /**
     * Renders every active trail mark as a fading dot.
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
