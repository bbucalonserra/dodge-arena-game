/**
 * Heads-up minimap rendered at a corner of the canvas. Redraws the
 * arena and all cars at reduced scale, giving the player spatial
 * awareness of opponents outside the viewport.
 */
class Minimap {
    /**
     * @param {number} arenaX - Arena left edge on the main canvas.
     * @param {number} arenaY - Arena top edge on the main canvas.
     * @param {number} arenaW - Arena width in pixels.
     * @param {number} arenaH - Arena height in pixels.
     * @param {number} scale - Reduction factor (e.g. 0.15 = 15% size).
     */
    constructor(arenaX, arenaY, arenaW, arenaH, scale) {
        this.arenaX = arenaX;
        this.arenaY = arenaY;
        this.arenaW = arenaW;
        this.arenaH = arenaH;
        this.scale = scale;
        this.mapW = arenaW * scale;
        this.mapH = arenaH * scale;
        // Position: top-right corner with 10px margin.
        this.drawX = arenaX + arenaW - this.mapW - 10;
        this.drawY = arenaY + 10;
    }

    /**
     * Renders the minimap background and car blips. Each car is a small
     * coloured dot at its scaled position; the player blinks to stand out.
     * @param {Array<Car>} cars - All cars currently in the arena.
     * @param {Car|null} playerCar - The player car (blinks), or null.
     * @return {void}
     */
    draw(cars, playerCar) {
        // Semi-transparent background.
        push();
        fill(0, 0, 0, 120);
        stroke(200);
        strokeWeight(1);
        rect(this.drawX, this.drawY, this.mapW, this.mapH, 4);

        noStroke();
        for (const car of cars) {
            const cx = this.drawX + (car.body.position.x - this.arenaX) * this.scale;
            const cy = this.drawY + (car.body.position.y - this.arenaY) * this.scale;
            const isPlayer = car === playerCar;
            // Player dot blinks every 30 frames.
            if (isPlayer && frameCount % 30 < 15) {
                fill(255);
            } else {
                fill(car.bodyColor);
            }
            ellipse(cx, cy, isPlayer ? 8 : 5);
        }
        pop();
    }
}
