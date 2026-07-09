class MotionTrail {
    constructor() {
        /** @type {Array<object>} */
        this.marks = [];
    }

    /**
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
     * @return {void}
     */
    update() {
        for (let i = this.marks.length - 1; i >= 0; i--) {
            this.marks[i].life -= 0.04;
            if (this.marks[i].life <= 0) this.marks.splice(i, 1);
        }
    }

    /**
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
