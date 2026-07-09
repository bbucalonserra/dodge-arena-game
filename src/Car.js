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
     * @param {number} [config.grip] - Fraction of lateral velocity killed per frame.
     */
    constructor(physics, x, y, config) {
        this.physics = physics;
        this.w = 118;
        this.h = 70;

        this.enginePower = config.enginePower;
        this.maxSpeed = config.maxSpeed;
        this.turnRate = config.turnRate;
        this.bodyColor = config.bodyColor;
        this.grip = config.grip !== undefined ? config.grip : 0.15;

        this.slipAngle = 0;
        this.isDrifting = false;
        this.boostTimer = 0;

        this.body = physics.Bodies.rectangle(x, y, this.w, this.h, {
            density: config.density,
            frictionAir: config.frictionAir,
            restitution: 0.6,
            friction: 0.05,
            label: "car"
        });

        // Lets the collision handler recover the Car from a matter.js body.
        this.body.carRef = this;

        physics.add(this.body);
    }

    /**
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
     * @param {number} direction - +1 to steer right, -1 to steer left.
     * @return {void}
     */
    steer(direction) {
        // A stationary car can't turn.
        const speed = this.getSpeed();
        if (speed < 0.1) return;
        this.physics.Body.rotate(this.body, this.turnRate * direction);
    }

    /**
     * @return {number} The magnitude of the body's velocity vector.
     */
    getSpeed() {
        const v = this.body.velocity;
        return Math.sqrt(v.x * v.x + v.y * v.y);
    }

    /**
     * Split velocity into forward/lateral and bleed off a fraction of the
     * lateral part. Steering rotates the chassis instantly, so a hard turn
     * leaves velocity off-axis: the leftover lateral component is the drift,
     * and grip pulls it back into line over the next frames.
     * @return {void}
     */
    applyTyreFriction() {
        const angle = this.body.angle;
        const forwardX = Math.cos(angle);
        const forwardY = Math.sin(angle);
        const lateralX = -forwardY;
        const lateralY = forwardX;
        const v = this.body.velocity;

        const forwardMag = v.x * forwardX + v.y * forwardY;
        const lateralMag = v.x * lateralX + v.y * lateralY;

        const retainedLateral = lateralMag * (1 - this.grip);

        this.physics.Body.setVelocity(this.body, {
            x: forwardX * forwardMag + lateralX * retainedLateral,
            y: forwardY * forwardMag + lateralY * retainedLateral
        });

        this.slipAngle = Math.atan2(retainedLateral, Math.abs(forwardMag) + 0.0001);
        const speed = Math.sqrt(
            forwardMag * forwardMag + retainedLateral * retainedLateral
        );
        this.isDrifting = speed > 2.5 && Math.abs(this.slipAngle) > 0.28;
    }

    /**
     * @param {number} targetSpeed - Forward speed to reach, in pixels per step.
     * @param {number} capFrames - Frames the raised speed cap stays in effect.
     * @return {void}
     */
    boost(targetSpeed, capFrames) {
        const angle = this.body.angle;
        const fx = Math.cos(angle);
        const fy = Math.sin(angle);
        const v = this.body.velocity;
        const forwardMag = v.x * fx + v.y * fy;
        if (forwardMag < targetSpeed) {
            const add = targetSpeed - forwardMag;
            this.physics.Body.setVelocity(this.body, {
                x: v.x + fx * add,
                y: v.y + fy * add
            });
        }
        this.boostTimer = capFrames;
    }

    /**
     * Raised cap while boosting so a pad can fling the car past its top speed.
     * @return {void}
     */
    capSpeed() {
        const cap = this.boostTimer > 0 ? this.maxSpeed * 1.8 : this.maxSpeed;
        const speed = this.getSpeed();
        if (speed > cap) {
            const scale = cap / speed;
            this.physics.Body.setVelocity(this.body, {
                x: this.body.velocity.x * scale,
                y: this.body.velocity.y * scale
            });
        }
    }

    /**
     * @return {void}
     */
    update() {
        this.applyTyreFriction();
        this.capSpeed();
        if (this.boostTimer > 0) this.boostTimer--;
    }

    /**
     * @param {boolean} [highlight] - Draw a bright outline to mark the player.
     * @return {void}
     */
    draw(highlight) {
        const pos = this.body.position;
        const angle = this.body.angle;

        push();
        translate(pos.x, pos.y);
        rotate(angle);

        rectMode(CENTER);
        if (highlight) {
            stroke(255);
            strokeWeight(4);
        } else {
            noStroke();
        }
        fill(this.bodyColor);
        rect(0, 0, this.w, this.h, 15);

        noStroke();
        // Front and rear bumpers.
        fill(40);
        rect(this.w / 2 - 6, 0, 11, this.h - 11, 6);
        rect(-this.w / 2 + 6, 0, 11, this.h - 11, 6);

        // Windshield.
        fill(180, 220, 255, 200);
        rect(11, 0, 31, this.h - 28, 8);

        // Headlights.
        fill(255, 245, 150);
        ellipse(this.w / 2 - 10, -this.h / 2 + 11, 11, 11);
        ellipse(this.w / 2 - 10, this.h / 2 - 11, 11, 11);

        pop();
    }
}
