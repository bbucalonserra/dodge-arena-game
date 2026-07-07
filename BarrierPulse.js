/**
 * Localised ripple plus colour flash when a car hits the barrier. Each hit
 * spawns an expanding ring that grows and fades at the contact point.
 */
class BarrierPulse {
    constructor() {
        /** @type {Array<object>} Live ripple rings. */
        this.pulses = [];
    }

    /**
     * Spawns a ripple ring at a barrier contact point.
     * @param {number} x - Contact x in pixels.
     * @param {number} y - Contact y in pixels.
     * @return {void}
     */
    emit(x, y) {
        this.pulses.push({ x: x, y: y, r: 6, life: 1.0 });
    }

    /**
     * Grows each ring and ages it; prunes finished pulses.
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
     * Draws each pulse as an expanding, fading coloured ring.
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
