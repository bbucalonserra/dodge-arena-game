/** Class representing a barrier collision ripple. */
class BarrierPulse {
    constructor() {
        /** @type {Array<object>} */
        this.pulses = [];
    }

    /**
     * @param {number} x - Contact x in pixels.
     * @param {number} y - Contact y in pixels.
     * @return {void}
     */
    emit(x, y) {
        this.pulses.push({ x: x, y: y, r: 6, life: 1.0 });
    }

    /**
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
