/** Class representing a barrier collision ripple. */
class BarrierPulse {
    constructor() {
        /**
         * An array of active pulse objects, each holding its position, radius, and remaining life.
         * @type {Array<object>}
         */
        this.pulses = [];
    }

    /**
     * Emits a new expanding ripple at the given coordinates.
     * @param {number} x
     * @param {number} y
     * @return {void}
     */
    emit(x, y) {
        this.pulses.push({ x: x, y: y, r: 6, life: 1.0 });
    }

    /**
     * Updates each pulse's radius and life, removing those that have expired.
     * @return {void}
     */
    update() {
        for (let i = this.pulses.length - 1; i >= 0; i--) {
            this.pulses[i].r += 2.5;
            this.pulses[i].life -= 0.05;
            if (this.pulses[i].life <= 0) this.pulses.splice(i, 1);
        }
    }

    /**
     * Draws every active pulse as an expanding, fading ring.
     * @return {void}
     */
    draw() {
        noFill();
        strokeWeight(3);
        for (const p of this.pulses) {
            stroke(255, 120, 40, p.life * 200);
            ellipse(p.x, p.y, p.r * 2);
        }
        strokeWeight(1);
    }
}
