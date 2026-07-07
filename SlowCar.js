/**
 * A heavy, sluggish car. Used for two opponents. Greater mass and weaker
 * engine make it accelerate slowly and shove harder in collisions.
 * @extends Car
 */
class SlowCar extends Car {
    /**
     * @param {PhysicsWorld} physics - Shared physics facade.
     * @param {number} x - Initial centre x in pixels.
     * @param {number} y - Initial centre y in pixels.
     * @param {string} bodyColor - Chassis colour.
     */
    constructor(physics, x, y, bodyColor) {
        super(physics, x, y, {
            density: 0.0028,
            enginePower: 0.0007,
            maxSpeed: 4,
            turnRate: 0.045,
            bodyColor: bodyColor,
            frictionAir: 0.07
        });
        this.type = "slow";
    }
}
