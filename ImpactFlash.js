/**
 * Brief expanding spark ring at the point of a car-to-car collision.
 * Each impact spawns several radial sparks that fly outward and fade.
 */
class ImpactFlash {
    constructor() {
        /** @type {Array<object>} Live spark particles. */
        this.sparks = [];
    }

    /**
     * Spawns a burst of sparks radiating from a collision point.
     * @param {number} x - Impact x in pixels.
     * @param {number} y - Impact y in pixels.
     * @return {void}
     */
    emit(x, y) {
        const count = 10;
        for (let i = 0; i < count; i++) {
            const a = (Math.PI * 2 * i) / count;
            this.sparks.push({
                x: x,
                y: y,
                vx: Math.cos(a) * 3,
                vy: Math.sin(a) * 3,
                life: 1.0
            });
        }
    }

    /**
     * Moves each spark outward and ages it; prunes dead sparks.
     * @return {void}
     */
    update() {
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const s = this.sparks[i];
            s.x += s.vx;
            s.y += s.vy;
            s.vx *= 0.9;
            s.vy *= 0.9;
            s.life -= 0.05;
            if (s.life <= 0) this.sparks.splice(i, 1);
        }
    }

    /**
     * Draws each spark as a fading bright dot.
     * @return {void}
     */
    draw() {
        noStroke();
        for (const s of this.sparks) {
            fill(255, 220, 80, s.life * 255);
            ellipse(s.x, s.y, 5 * s.life);
        }
    }
}
