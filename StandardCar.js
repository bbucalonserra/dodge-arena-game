/**
 * A nimble, realistic car. Used for the player and for two opponents.
 * Light chassis, responsive engine, higher top speed.
 * @extends Car
 */
class StandardCar extends Car {
    /**
     * @param {PhysicsWorld} physics - Shared physics facade.
     * @param {number} x - Initial centre x in pixels.
     * @param {number} y - Initial centre y in pixels.
     * @param {string} bodyColor - Chassis colour (player uses a distinct one).
     */
    constructor(physics, x, y, bodyColor) {
        super(physics, x, y, {
            density: 0.0012,
            enginePower: 0.0009,
            maxSpeed: 7,
            turnRate: 0.06,
            bodyColor: bodyColor,
            frictionAir: 0.05
        });
        this.type = "standard";
    }
}
