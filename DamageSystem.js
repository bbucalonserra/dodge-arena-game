/**
 * Tracks cumulative collision damage per car and produces visual feedback:
 * chassis tint shifts from original colour toward dark red, and smoke
 * particles emit when damage exceeds a threshold.
 */
class DamageSystem {
    constructor() {
        /** @type {Map<Matter.Body, number>} Damage counters keyed by body. */
        this.damageMap = new Map();
        /** @type {Array<object>} Active smoke particles. */
        this.smokeParticles = [];
        this.maxDamage = 10;
        this.smokeThreshold = 5;
    }

    /**
     * Registers a collision hit for a car, increasing its damage counter.
     * If the car exceeds the smoke threshold, a puff is emitted.
     * @param {Car} car - The car that took a hit.
     * @return {void}
     */
    registerHit(car) {
        const current = this.damageMap.get(car.body) || 0;
        const next = Math.min(current + 1, this.maxDamage);
        this.damageMap.set(car.body, next);

        if (next >= this.smokeThreshold) {
            this.emitSmoke(car.body.position.x, car.body.position.y);
        }
    }

    /**
     * Spawns a cluster of grey smoke particles at a position.
     * @param {number} x - Centre x.
     * @param {number} y - Centre y.
     * @return {void}
     */
    emitSmoke(x, y) {
        for (let i = 0; i < 5; i++) {
            this.smokeParticles.push({
                x: x + random(-8, 8),
                y: y + random(-8, 8),
                vx: random(-0.5, 0.5),
                vy: random(-1.2, -0.3),
                r: random(4, 9),
                life: 1.0
            });
        }
    }

    /**
     * Ages and prunes smoke particles.
     * @return {void}
     */
    update() {
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const s = this.smokeParticles[i];
            s.x += s.vx;
            s.y += s.vy;
            s.r += 0.3;
            s.life -= 0.03;
            if (s.life <= 0) this.smokeParticles.splice(i, 1);
        }
    }

    /**
     * Draws all smoke particles as expanding grey puffs.
     * @return {void}
     */
    drawSmoke() {
        noStroke();
        for (const s of this.smokeParticles) {
            fill(130, 130, 130, s.life * 150);
            ellipse(s.x, s.y, s.r * 2);
        }
    }

    /**
     * Returns a damage-tinted colour for a car. At zero damage the original
     * colour is returned; at max damage it shifts fully to dark red.
     * @param {Car} car - The car to query.
     * @return {p5.Color} The tinted colour.
     */
    getTintedColor(car) {
        const dmg = this.damageMap.get(car.body) || 0;
        const t = dmg / this.maxDamage;
        const base = color(car.bodyColor);
        return lerpColor(base, color(120, 30, 30), t);
    }

    /**
     * Resets all damage (used when switching modes).
     * @return {void}
     */
    reset() {
        this.damageMap.clear();
        this.smokeParticles = [];
    }
}
