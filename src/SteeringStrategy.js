/** Class representing an opponent steering strategy. */
class SteeringStrategy {
    /**
     * Applies the strategy's steering to the given car (defined by subclasses).
     * @param {Car} car - The opponent car this strategy controls.
     * @return {void}
     */
    apply(car) {
        throw new Error("SteeringStrategy.apply must be implemented by subclass");
    }

    /**
     * Sets velocity and angle directly instead of applying forces, since
     * opponents follow prescribed paths and shouldn't drift or lose speed to
     * drag.
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

/** Class representing a stationary steering strategy. */
class StaticStrategy extends SteeringStrategy {
    /**
     * Zeros again the velocity every frame so the car stays put even when rammed.
     * @param {Car} car - The parked opponent.
     * @return {void}
     */
    apply(car) {
        car.physics.Body.setVelocity(car.body, { x: 0, y: 0 });
    }
}

/** Class representing a straight line steering strategy. */
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
     * Drives the car along its fixed heading at constant speed.
     * @param {Car} car - The opponent to drive.
     * @return {void}
     */
    apply(car) {
        this.enforceHeading(car, this.heading, this.speed);
    }
}

/** Class representing a sine wave steering strategy. */
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
     * Advances the oscillation and drives the car along its weaving heading.
     * @param {Car} car - The opponent to drive.
     * @return {void}
     */
    apply(car) {
        // One frame of phase at 60 FPS.
        this.phase += this.frequency * (Math.PI * 2) / 60;
        const heading = this.baseHeading + Math.sin(this.phase) * this.amplitude;
        this.enforceHeading(car, heading, this.speed);
    }
}
