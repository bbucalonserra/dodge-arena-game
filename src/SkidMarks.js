/** Class representing tyre skid marks. */
class SkidMarks {
    constructor() {
        /**
         * An array of mark objects, each holding its position and remaining life.
         * @type {Array<object>}
         */
        this.marks = [];
        // Bound the buffer so a long drift can't grow it without limit.
        this.maxMarks = 500;
    }

    /**
     * Adds a skid mark at the given point, discarding the oldest if the buffer is full.
     * @param {number} x - Mark x in pixels.
     * @param {number} y - Mark y in pixels.
     * @return {void}
     */
    emit(x, y) {
        this.marks.push({ x: x, y: y, life: 1.0 });
        if (this.marks.length > this.maxMarks) this.marks.shift();
    }

    /**
     * Fades each mark and removes those that have expired.
     * @return {void}
     */
    update() {
        for (let i = this.marks.length - 1; i >= 0; i--) {
            this.marks[i].life -= 0.006;
            if (this.marks[i].life <= 0) this.marks.splice(i, 1);
        }
    }

    /**
     * Renders every active mark as a dark, fading dot.
     * @return {void}
     */
    draw() {
        noStroke();
        for (const m of this.marks) {
            fill(30, 30, 30, m.life * 90);
            ellipse(m.x, m.y, 5);
        }
    }

    /**
     * Clears all marks.
     * @return {void}
     */
    reset() {
        this.marks = [];
    }
}
