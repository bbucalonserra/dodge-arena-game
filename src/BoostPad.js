/** Class representing a speed boost pad. */
class BoostPad {
    /**
     * @param {number} x - Centre x in pixels.
     * @param {number} y - Centre y in pixels.
     * @param {number} w - Pad width in pixels.
     * @param {number} h - Pad height in pixels.
     * @param {number} angle - Chevron orientation in radians.
     */
    constructor(x, y, w, h, angle) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.angle = angle;
    }

    /**
     * Reports whether the given point lies within the pad's bounds.
     * @param {number} px
     * @param {number} py
     * @return {boolean}
     */
    contains(px, py) {
        return (
            px >= this.x - this.w / 2 &&
            px <= this.x + this.w / 2 &&
            py >= this.y - this.h / 2 &&
            py <= this.y + this.h / 2
        );
    }

    /**
     * Renders the pulsing pad and its directional chevrons.
     * @return {void}
     */
    draw() {
        const pulse = 0.5 + 0.5 * Math.sin(frameCount * 0.15);

        push();
        translate(this.x, this.y);
        rectMode(CENTER);

        noStroke();
        fill(60, 200, 255, 50 + pulse * 60);
        rect(0, 0, this.w, this.h, 10);
        noFill();
        stroke(120, 230, 255, 180);
        strokeWeight(2);
        rect(0, 0, this.w, this.h, 10);

        rotate(this.angle);
        noStroke();
        fill(210, 245, 255, 150 + pulse * 90);
        for (let i = -1; i <= 1; i++) {
            const cx = i * 16;
            triangle(cx - 6, -14, cx - 6, 14, cx + 8, 0);
        }
        pop();
    }
}
