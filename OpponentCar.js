/**
 * A self-driving opponent car. Inherits all physical and visual behaviour
 * from Car, and delegates its per-frame movement to a composed steering
 * strategy. Physical personality (standard or slow) is chosen via config;
 * driving behaviour (static, straight, sine) is chosen via strategy —
 * the two dimensions are independent, avoiding a class explosion.
 * @extends Car
 */
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
     * Swaps the active steering strategy at runtime (e.g. when switching
     * modes reuses a car, though the game typically rebuilds cars per mode).
     * @param {SteeringStrategy} strategy - The new behaviour.
     * @return {void}
     */
    setStrategy(strategy) {
        this.strategy = strategy;
    }

    /**
     * Per-frame update: let the strategy drive, then enforce the speed cap
     * inherited from Car.
     * @return {void}
     */
    update() {
        this.strategy.apply(this);
        super.update();
    }
}
