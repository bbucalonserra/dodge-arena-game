/** Class representing an opponent car. */
class OpponentCar extends Car {
    /**
     * @param {PhysicsWorld} physics - Shared physics facade.
     * @param {number} x - Initial centre x in pixels.
     * @param {number} y - Initial centre y in pixels.
     * @param {object} config - Physical parameters (as in Car), plus bodyColor.
     * @param {SteeringStrategy} strategy - The driving behaviour to delegate to.
     */
    constructor(physics, x, y, config, strategy) {
        super(physics, x, y, config);
        this.strategy = strategy;
        this.type = config.type;
    }

    /**
     * @param {SteeringStrategy} strategy - The new behaviour.
     * @return {void}
     */
    setStrategy(strategy) {
        this.strategy = strategy;
    }

    /**
     * @return {void}
     */
    update() {
        this.strategy.apply(this);
        super.update();
    }
}
