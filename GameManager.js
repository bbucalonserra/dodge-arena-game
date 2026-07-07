/**
 * Central orchestrator. Manages mode state, car spawning, collision policy,
 * and coordinates update/draw of every subsystem each frame.
 */
class GameManager {
    /**
     * @param {PhysicsWorld} physics - The shared physics facade.
     * @param {number} arenaX - Arena left edge on the canvas.
     * @param {number} arenaY - Arena top edge on the canvas.
     * @param {number} arenaW - Arena width in pixels.
     * @param {number} arenaH - Arena height in pixels.
     */
    constructor(physics, arenaX, arenaY, arenaW, arenaH) {
        this.physics = physics;
        this.arenaX = arenaX;
        this.arenaY = arenaY;
        this.arenaW = arenaW;
        this.arenaH = arenaH;

        // Start Zone occupies the left 20% of the arena.
        this.startZoneW = arenaW * 0.2;

        /** @type {StandardCar|null} */
        this.playerCar = null;
        /** @type {Array<OpponentCar>} */
        this.opponents = [];

        /** @type {boolean} */
        this.spawnArmed = false;
        /** @type {number} Current mode (0 = no mode selected yet). */
        this.currentMode = 0;

        // Animation subsystems.
        this.motionTrail = new MotionTrail();
        this.impactFlash = new ImpactFlash();
        this.barrierPulse = new BarrierPulse();

        // Extension subsystems.
        this.damageSystem = new DamageSystem();
        this.minimap = new Minimap(arenaX, arenaY, arenaW, arenaH, 0.15);

        // Physics configs for the two opponent types.
        this.standardConfig = {
            density: 0.0012,
            enginePower: 0.0009,
            maxSpeed: 7,
            turnRate: 0.06,
            frictionAir: 0.05,
            bodyColor: "#3EA85E",
            type: "standard"
        };
        this.slowConfig = {
            density: 0.0028,
            enginePower: 0.0007,
            maxSpeed: 4,
            turnRate: 0.045,
            frictionAir: 0.07,
            bodyColor: "#D4883E",
            type: "slow"
        };

        this.registerCollisionHandler();
    }

    // ── Mode management ──────────────────────────────────────────────

    /**
     * Clears all cars from the world and resets state for a fresh mode.
     * @return {void}
     */
    clearCars() {
        if (this.playerCar) {
            this.physics.remove(this.playerCar.body);
            this.playerCar = null;
        }
        for (const opp of this.opponents) {
            this.physics.remove(opp.body);
        }
        this.opponents = [];
        this.spawnArmed = false;
        this.damageSystem.reset();
    }

    /**
     * Activates Mode 1: four static opponents parked in the Start Zone.
     * @return {void}
     */
    startMode1() {
        this.clearCars();
        this.currentMode = 1;

        const spacing = (this.arenaH - 80) / carNumbers;
        for (let i = 0; i < carNumbers; i++) {
            const x = this.arenaX + this.startZoneW / 2;
            const y = this.arenaY + 60 + i * spacing;
            const cfg = i < 2 ? this.standardConfig : this.slowConfig;
            const opp = new OpponentCar(this.physics, x, y, cfg, new StaticStrategy());
            this.opponents.push(opp);
        }
    }

    /**
     * Activates Mode 2: four opponents at random positions with random
     * headings, moving in straight lines.
     * @return {void}
     */
    startMode2() {
        this.clearCars();
        this.currentMode = 2;
        this.spawnOpponentsRandom((heading) => {
            return new StraightStrategy(heading, 2.5);
        });
    }

    /**
     * Activates Mode 3: four opponents at random positions following
     * sinusoidal trajectories at constant speed.
     * @return {void}
     */
    startMode3() {
        this.clearCars();
        this.currentMode = 3;
        this.spawnOpponentsRandom((heading) => {
            return new SineStrategy(heading, 2.5, 0.6, 0.4);
        });
    }

    /**
     * Spawns carNumbers opponents at random non-overlapping positions
     * within the arena (excluding the Start Zone) with random headings.
     * Uses a separation check to avoid stacking.
     * @param {function} strategyFactory - Receives a heading, returns a strategy.
     * @return {void}
     */
    spawnOpponentsRandom(strategyFactory) {
        const positions = [];
        const minSep = 100;

        for (let i = 0; i < carNumbers; i++) {
            let x, y, valid;
            let attempts = 0;
            do {
                x = this.arenaX + this.startZoneW + 80 +
                    random(this.arenaW - this.startZoneW - 160);
                y = this.arenaY + 60 + random(this.arenaH - 120);
                valid = positions.every(
                    (p) => dist(p.x, p.y, x, y) > minSep
                );
                attempts++;
            } while (!valid && attempts < 200);

            positions.push({ x: x, y: y });

            const heading = random(TWO_PI);
            const cfg = i < 2 ? this.standardConfig : this.slowConfig;
            const strategy = strategyFactory(heading);
            const opp = new OpponentCar(this.physics, x, y, cfg, strategy);
            this.opponents.push(opp);
        }
    }

    // ── Spawn mechanism ──────────────────────────────────────────────

    /**
     * Arms the spawn mechanism. The player must then click inside the
     * Start Zone to insert the player car.
     * @return {void}
     */
    armSpawn() {
        if (this.currentMode === 0) return;
        this.spawnArmed = true;
    }

    /**
     * Attempts to spawn the player car at (mx, my). Succeeds only if
     * spawn is armed, the click is inside the Start Zone, and the position
     * does not overlap any existing car.
     * @param {number} mx - Mouse x in canvas pixels.
     * @param {number} my - Mouse y in canvas pixels.
     * @return {boolean} Whether the spawn succeeded.
     */
    trySpawn(mx, my) {
        if (!this.spawnArmed || this.playerCar) return false;

        // Must be inside the Start Zone.
        if (
            mx < this.arenaX ||
            mx > this.arenaX + this.startZoneW ||
            my < this.arenaY ||
            my > this.arenaY + this.arenaH
        ) {
            return false;
        }

        // Overlap check against every existing car.
        const minSep = 70;
        for (const opp of this.opponents) {
            if (dist(mx, my, opp.body.position.x, opp.body.position.y) < minSep) {
                return false;
            }
        }

        this.playerCar = new StandardCar(this.physics, mx, my, "#3B8BD4");
        this.spawnArmed = false;
        return true;
    }

    // ── Collision policy ─────────────────────────────────────────────

    /**
     * Registers the matter.js collision handler that implements the opponent
     * heading policy (180 degrees on barrier, plus or minus 90 on car-car) and
     * triggers animations and damage.
     * @return {void}
     */
    registerCollisionHandler() {
        this.physics.onCollisionStart((event) => {
            for (const pair of event.pairs) {
                const a = pair.bodyA;
                const b = pair.bodyB;
                const contactPoint = pair.collision.supports[0] ||
                    { x: (a.position.x + b.position.x) / 2,
                        y: (a.position.y + b.position.y) / 2 };

                const aIsBarrier = a.label === "barrier";
                const bIsBarrier = b.label === "barrier";
                const aIsCar = a.label === "car";
                const bIsCar = b.label === "car";

                if (aIsCar && bIsBarrier) {
                    this.onBarrierHit(a.carRef, contactPoint);
                } else if (bIsCar && aIsBarrier) {
                    this.onBarrierHit(b.carRef, contactPoint);
                } else if (aIsCar && bIsCar) {
                    this.onCarCarHit(a.carRef, b.carRef, contactPoint);
                }
            }
        });
    }

    /**
     * Handles a car hitting the barrier: reverses opponent heading by 180
     * degrees and fires the barrier pulse animation.
     * @param {Car} car - The car that hit the barrier.
     * @param {object} point - {x, y} of the contact.
     * @return {void}
     */
    onBarrierHit(car, point) {
        this.barrierPulse.emit(point.x, point.y);
        this.damageSystem.registerHit(car);

        if (car instanceof OpponentCar && car.strategy.heading !== undefined) {
            car.strategy.heading += Math.PI;
            if (car.strategy.baseHeading !== undefined) {
                car.strategy.baseHeading += Math.PI;
            }
        }
    }

    /**
     * Handles a car-to-car collision: rotates opponent heading(s) by
     * plus or minus 90 degrees and fires the impact flash animation.
     * @param {Car} carA - First car in the collision.
     * @param {Car} carB - Second car in the collision.
     * @param {object} point - {x, y} of the contact.
     * @return {void}
     */
    onCarCarHit(carA, carB, point) {
        this.impactFlash.emit(point.x, point.y);
        this.damageSystem.registerHit(carA);
        this.damageSystem.registerHit(carB);

        const deflect = (car) => {
            if (car instanceof OpponentCar && car.strategy.heading !== undefined) {
                const sign = random() > 0.5 ? 1 : -1;
                car.strategy.heading += sign * (Math.PI / 2);
                if (car.strategy.baseHeading !== undefined) {
                    car.strategy.baseHeading += sign * (Math.PI / 2);
                }
            }
        };
        deflect(carA);
        deflect(carB);
    }

    // ── Per-frame update & draw ──────────────────────────────────────

    /**
     * Reads player input and applies throttle/steer accordingly.
     * @return {void}
     */
    handleInput() {
        if (!this.playerCar) return;
        if (keyIsDown(UP_ARROW)) this.playerCar.throttle(1);
        if (keyIsDown(DOWN_ARROW)) this.playerCar.throttle(-1);
        if (keyIsDown(LEFT_ARROW)) this.playerCar.steer(-1);
        if (keyIsDown(RIGHT_ARROW)) this.playerCar.steer(1);
    }

    /**
     * Advances one frame of game logic: input, car updates, animation updates.
     * @return {void}
     */
    update() {
        this.handleInput();

        if (this.playerCar) {
            this.playerCar.update();
            this.motionTrail.emit(
                this.playerCar.body.position.x,
                this.playerCar.body.position.y,
                this.playerCar.getSpeed(),
                this.playerCar.bodyColor
            );
        }

        for (const opp of this.opponents) {
            opp.update();
            this.motionTrail.emit(
                opp.body.position.x,
                opp.body.position.y,
                opp.getSpeed(),
                opp.bodyColor
            );
        }

        this.motionTrail.update();
        this.impactFlash.update();
        this.barrierPulse.update();
        this.damageSystem.update();
    }

    /**
     * Draws the arena (barriers, start zone, mode label), all cars with
     * damage tinting, all animations, and the HUD (minimap, spawn indicator).
     * @return {void}
     */
    drawArena() {
        // Arena floor.
        fill(230, 235, 240);
        noStroke();
        rect(this.arenaX, this.arenaY, this.arenaW, this.arenaH);

        // Start Zone.
        fill(180, 215, 240);
        rect(this.arenaX, this.arenaY, this.startZoneW, this.arenaH);

        // Start Zone label.
        push();
        fill(100);
        textSize(20);
        textAlign(CENTER, CENTER);
        translate(
            this.arenaX + this.startZoneW / 2,
            this.arenaY + this.arenaH / 2
        );
        rotate(-HALF_PI);
        text("START ZONE", 0, 0);
        pop();

        // Thick perimeter barrier.
        const t = this.physics.wallThickness;
        fill(80);
        noStroke();
        // Top.
        rect(this.arenaX - t, this.arenaY - t, this.arenaW + t * 2, t);
        // Bottom.
        rect(this.arenaX - t, this.arenaY + this.arenaH, this.arenaW + t * 2, t);
        // Left.
        rect(this.arenaX - t, this.arenaY, t, this.arenaH);
        // Right.
        rect(this.arenaX + this.arenaW, this.arenaY, t, this.arenaH);
    }

    /**
     * Draws all cars with damage tint applied.
     * @return {void}
     */
    drawCars() {
        const drawWithDamage = (car) => {
            const originalColor = car.bodyColor;
            car.bodyColor = this.damageSystem.getTintedColor(car);
            car.draw();
            car.bodyColor = originalColor;
        };

        for (const opp of this.opponents) {
            drawWithDamage(opp);
        }
        if (this.playerCar) {
            drawWithDamage(this.playerCar);
        }
    }

    /**
     * Master draw call: arena, trails, cars, effects, HUD.
     * @return {void}
     */
    draw() {
        this.drawArena();
        this.motionTrail.draw();
        this.drawCars();
        this.impactFlash.draw();
        this.barrierPulse.draw();
        this.damageSystem.drawSmoke();

        // HUD.
        const allCars = [...this.opponents];
        if (this.playerCar) allCars.push(this.playerCar);
        this.minimap.draw(allCars, this.playerCar);

        this.drawHUD();
    }

    /**
     * Draws on-screen text: current mode, spawn status, controls hint.
     * @return {void}
     */
    drawHUD() {
        push();
        fill(50);
        noStroke();
        textSize(17);
        textAlign(LEFT, TOP);
        const x = this.arenaX;
        const y = 10;
        text(
            "Mode: " + (this.currentMode || "none") +
            "  |  [1/2/3] Switch  |  [I] Arm spawn  |  Arrows: drive  |  [Esc] Menu",
            x, y
        );
        if (this.spawnArmed && !this.playerCar) {
            fill(200, 60, 60);
            text("SPAWN ARMED – click inside Start Zone", x, y + 22);
        }
        pop();
    }
}
