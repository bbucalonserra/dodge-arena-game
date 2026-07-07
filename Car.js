/**
 * Base class for every car in the arena. Owns a matter.js body and knows
 * how to accelerate it (force-based throttle), steer it (rotation), cap
 * its speed, and render itself as a layered p5 drawing that follows the
 * body's position and angle. Physical personality (mass, engine power,
 * colour, top speed) is injected via config so subclasses stay tiny.
 */
class Car {
    /**
     * @param {PhysicsWorld} physics - The shared physics facade to register into.
     * @param {number} x - Initial centre x position in canvas pixels.
     * @param {number} y - Initial centre y position in canvas pixels.
     * @param {object} config - Physical and visual parameters.
     * @param {number} config.density - matter.js density; higher means heavier.
     * @param {number} config.enginePower - Force magnitude applied per throttle frame.
     * @param {number} config.maxSpeed - Speed cap in pixels per physics step.
     * @param {number} config.turnRate - Radians rotated per steer frame.
     * @param {string} config.bodyColor - Fill colour of the chassis.
     * @param {number} config.frictionAir - Air drag simulating tyre-ground friction.
     */
    constructor(physics, x, y, config) {
        this.physics = physics;
        this.w = 60;
        this.h = 36;

        this.enginePower = config.enginePower;
        this.maxSpeed = config.maxSpeed;
        this.turnRate = config.turnRate;
        this.bodyColor = config.bodyColor;

        // The physical avatar of this car inside matter.js.
        this.body = physics.Bodies.rectangle(x, y, this.w, this.h, {
            density: config.density,
            frictionAir: config.frictionAir,
            restitution: 0.6,
            friction: 0.05,
            label: "car"
        });

        // Back-reference so collision events can find the Car from its body.
        this.body.carRef = this;

        physics.add(this.body);
    }

    /**
     * Applies forward (or reverse) thrust along the car's current heading.
     * Called every frame the throttle key is held, so force accumulates
     * into acceleration through the physics integrator.
     * @param {number} direction - +1 for forward, -1 for reverse.
     * @return {void}
     */
    throttle(direction) {
        const angle = this.body.angle;
        const force = {
            x: Math.cos(angle) * this.enginePower * direction,
            y: Math.sin(angle) * this.enginePower * direction
        };
        this.physics.Body.applyForce(this.body, this.body.position, force);
    }

    /**
     * Rotates the car by turnRate radians. Steering only bites while the
     * car is actually moving, mimicking that a parked car can't turn.
     * @param {number} direction - +1 to steer right, -1 to steer left.
     * @return {void}
     */
    steer(direction) {
        const speed = this.getSpeed();
        if (speed < 0.1) return;
        this.physics.Body.rotate(this.body, this.turnRate * direction);
    }

    /**
     * Returns the current scalar speed of the car in pixels per step.
     * @return {number} The magnitude of the body's velocity vector.
     */
    getSpeed() {
        const v = this.body.velocity;
        return Math.sqrt(v.x * v.x + v.y * v.y);
    }

    /**
     * Clamps the car to its maximum speed by rescaling the velocity vector
     * when it exceeds the cap. Called once per frame after throttle.
     * @return {void}
     */
    capSpeed() {
        const speed = this.getSpeed();
        if (speed > this.maxSpeed) {
            const scale = this.maxSpeed / speed;
            this.physics.Body.setVelocity(this.body, {
                x: this.body.velocity.x * scale,
                y: this.body.velocity.y * scale
            });
        }
    }

    /**
     * Per-frame logic hook. The base car only enforces its speed cap;
     * subclasses and the game layer drive throttle/steer externally.
     * @return {void}
     */
    update() {
        this.capSpeed();
    }

    /**
     * Renders the car as a layered drawing at the body's position and angle.
     * Uses p5 matrix transforms so the drawing is authored in local space.
     * @return {void}
     */
    draw() {
        const pos = this.body.position;
        const angle = this.body.angle;

        push();
        translate(pos.x, pos.y);
        rotate(angle);

        // Chassis.
        rectMode(CENTER);
        noStroke();
        fill(this.bodyColor);
        rect(0, 0, this.w, this.h, 8);

        // Bumpers (front and rear darker bars).
        fill(40);
        rect(this.w / 2 - 3, 0, 6, this.h - 6, 3);
        rect(-this.w / 2 + 3, 0, 6, this.h - 6, 3);

        // Windshield.
        fill(180, 220, 255, 200);
        rect(6, 0, 16, this.h - 14, 4);

        // Headlights (front corners).
        fill(255, 245, 150);
        ellipse(this.w / 2 - 5, -this.h / 2 + 6, 6, 6);
        ellipse(this.w / 2 - 5, this.h / 2 - 6, 6, 6);

        pop();
    }
}
