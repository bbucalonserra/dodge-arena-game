/**
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
            // Density compensates the enlarged 118x70 body so mass, and hence
            // acceleration and top speed, match the original car.
            density: 0.000314,
            enginePower: 0.0009,
            maxSpeed: 7,
            turnRate: 0.06,
            bodyColor: bodyColor,
            frictionAir: 0.05,
            grip: 0.18
        });
        this.type = "standard";
    }
}
