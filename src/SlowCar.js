/**
 * Heavier and weaker than StandardCar, so it accelerates slowly and shoves
 * harder in collisions.
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
            // Density compensates the enlarged 118x70 body so mass, and hence
            // acceleration and top speed, match the original car.
            density: 0.000732,
            enginePower: 0.0007,
            maxSpeed: 4,
            turnRate: 0.045,
            bodyColor: bodyColor,
            frictionAir: 0.07,
            grip: 0.10
        });
        this.type = "slow";
    }
}
