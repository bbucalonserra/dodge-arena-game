/**
 * Abstract base for opponent steering behaviours (Strategy pattern).
 * A strategy decides, each frame, how its car should move. Subclasses
 * override apply(); the base offers a shared helper that pushes a car
 * toward a target speed along a given heading.
 */
class SteeringStrategy {
    /**
     * Drives the car for one frame. Must be overridden by subclasses.
     * @param {Car} car - The opponent car this strategy controls.
     * @return {void}
     */
    apply(car) {
        throw new Error("SteeringStrategy.apply must be implemented by subclass");
    }

    /**
     * Pushes a car so its velocity points along `heading` at `targetSpeed`,
     * and rotates the chassis to face its travel direction. Keeps opponents
     * moving at an approximately constant speed regardless of drag.
     * @param {Car} car - The car to drive.
     * @param {number} heading - Desired travel direction in radians.
     * @param {number} targetSpeed - Desired speed in pixels per step.
     * @return {void}
     */
    enforceHeading(car, heading, targetSpeed) {
        car.physics.Body.setVelocity(car.body, {
            x: Math.cos(heading) * targetSpeed,
            y: Math.sin(heading) * targetSpeed
        });
        car.physics.Body.setAngle(car.body, heading);
    }
}

/**
 * Keeps a car completely still. Used by parked opponents in Mode 1.
 * @extends SteeringStrategy
 */
class StaticStrategy extends SteeringStrategy {
    /**
     * Zeroes the car's velocity every frame so it stays parked even if bumped.
     * @param {Car} car - The parked opponent.
     * @return {void}
     */
    apply(car) {
        car.physics.Body.setVelocity(car.body, { x: 0, y: 0 });
    }
}

/**
 * Drives a car in a straight line along a fixed heading at constant speed.
 * Used by opponents in Mode 2. The heading is mutated externally by the
 * collision policy (180 degrees on wall, plus or minus 90 on car contact).
 * @extends SteeringStrategy
 */
class StraightStrategy extends SteeringStrategy {
    /**
     * @param {number} heading - Initial travel direction in radians.
     * @param {number} speed - Constant travel speed in pixels per step.
     */
    constructor(heading, speed) {
        super();
        this.heading = heading;
        this.speed = speed;
    }

    /**
     * Moves the car one frame along its current heading at constant speed.
     * @param {Car} car - The opponent to drive.
     * @return {void}
     */
    apply(car) {
        this.enforceHeading(car, this.heading, this.speed);
    }
}

/**
 * Drives a car along a sine-wave trajectory at approximately constant
 * speed. Used by advanced opponents in Mode 3. The base heading is the
 * overall direction of travel; a sine term oscillates the instantaneous
 * heading around it to trace a wave.
 * @extends SteeringStrategy
 */
class SineStrategy extends SteeringStrategy {
    /**
     * @param {number} baseHeading - Overall direction of travel in radians.
     * @param {number} speed - Constant travel speed in pixels per step.
     * @param {number} amplitude - Peak heading deviation in radians.
     * @param {number} frequency - Oscillations per second.
     */
    constructor(baseHeading, speed, amplitude, frequency) {
        super();
        this.baseHeading = baseHeading;
        this.speed = speed;
        this.amplitude = amplitude;
        this.frequency = frequency;
        this.phase = 0;
    }

    /**
     * Advances the sine phase and drives the car along the oscillating
     * heading, producing a smooth wave while speed stays constant.
     * @param {Car} car - The opponent to drive.
     * @return {void}
     */
    apply(car) {
        // Advance phase by one frame's worth of angular progress (60 FPS).
        this.phase += this.frequency * (Math.PI * 2) / 60;
        const heading = this.baseHeading + Math.sin(this.phase) * this.amplitude;
        this.enforceHeading(car, heading, this.speed);
    }
}
