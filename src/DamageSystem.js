/**
 * Per-car collision damage: tints the chassis toward red and, past a
 * threshold, emits smoke.
 */
class DamageSystem {
    constructor() {
        /** @type {Map<Matter.Body, number>} */
        this.damageMap = new Map();
        /** @type {Array<object>} */
        this.smokeParticles = [];
        this.maxDamage = 10;
        this.smokeThreshold = 5;
    }

    /**
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
     * @return {void}
     */
    reset() {
        this.damageMap.clear();
        this.smokeParticles = [];
    }
}
