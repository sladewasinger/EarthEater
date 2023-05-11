import { EngineState } from "../../shared/EngineState";
import { Explosion } from "../../shared/Explosion";
import { GameState } from "../../shared/GameState";
import { MathUtils } from "../../shared/MathUtils";
import { Missile } from "../../shared/Missile";
import { SocketResponse } from "../../shared/SocketResponse";
import { Vector } from "../../shared/Vector";
import { Socket } from "socket.io";
import { ServerPlayer } from "./models/ServerPlayer";
import { ServerGameState } from "./models/ServerGameState";
import { Player } from "../../shared/Player";

export class Engine {
    fps: number = 60;
    gameState: ServerGameState;
    engineState: EngineState = new EngineState();
    started: boolean = false;
    lobbyId: string | undefined;
    isConnected: boolean = false;
    intervalId: NodeJS.Timer | undefined;

    constructor() {
        this.reset();
    }

    public reset() {
        clearInterval(this.intervalId);
        this.intervalId = undefined;

        this.started = false;
        this.gameState = new ServerGameState();
    }

    public async start(players: ServerPlayer[]) {
        if (this.started) {
            console.log("Engine already started");
            return;
        }

        this.started = true;

        this.gameState.terrainMesh = await this.createTerrainMesh();
        if (this.gameState.isSand) {
            while (this.smoothTerrain()) { /* keep smoothing until there are no more changes */ }
        }

        this.gameState.players = players;

        this.intervalId = setInterval(() => {
            this.update();
        }, 1000 / this.fps);
    }

    public update() {
        const now = Date.now();
        const dt = Math.min(now - this.gameState.lastUpdate, 1000 / 20);

        this.gameState.frame++;

        // apply gravity
        for (let player of this.gameState.players) {
            player.position.y += this.gameState.gravity.y * dt / 1000;

            // resolve player ground collision
            // land on lines between points

            for (let i = 0; i < this.gameState.terrainMesh.length - 1; i++) {
                let point1 = this.gameState.terrainMesh[i];
                let point2 = this.gameState.terrainMesh[i + 1];
                let slope = (point2.y - point1.y) / (point2.x - point1.x);
                let yIntercept = point1.y - slope * point1.x;
                let playerX = player.position.x + player.hitBox.x * 0.5;
                let y = slope * playerX + yIntercept;
                if (playerX >= point1.x && playerX <= point2.x && player.position.y >= y - player.hitBox.y) {
                    player.position.y = y - player.hitBox.y;
                }
            }

        }

        this.handlePlayerInput(dt);

        // update explosions
        for (let i = 0; i < this.gameState.explosions.length; i++) {
            let explosion = this.gameState.explosions[i];

            if (!explosion.isExploded) {
                // "explode" & move terrain points
                let explosionRadius = explosion.radius;
                let explosionPos = explosion.position;
                for (let point of this.gameState.terrainMesh) {
                    if (point.x >= explosionPos.x - explosionRadius && point.x <= explosionPos.x + explosionRadius) {
                        let yPos = explosionPos.y + Math.sqrt(Math.pow(explosionRadius, 2) - Math.pow(point.x - explosionPos.x, 2));
                        point.y = Math.min(this.gameState.worldHeight, Math.max(point.y, yPos));
                    }
                }

                // damage players
                for (let player of this.gameState.players) {
                    if (MathUtils.circleCollidesWithBox(explosionPos, explosionRadius, player.position, player.hitBox)) {
                        player.health -= explosion.damage;
                    }
                }
            }

            explosion.update(dt);
            if (explosion.timeLeftMs <= 0) {
                this.gameState.explosions.splice(i, 1);
            }
        }

        // blow up dead players
        for (let player of this.gameState.players) {
            if (player.isDead && !player.exploded) {
                player.exploded = true;
                this.createExplosion(player.position, 100, 40);
                //this.gameState.players.splice(this.gameState.players.indexOf(player), 1);
            }
        }

        if (this.gameState.isSand) {
            this.smoothTerrain();
        }

        // update missiles
        for (let missile of this.gameState.missiles) {
            missile.update(dt, this.gameState);
            if (missile.isExploded || missile.elapsedTime > this.engineState.maxMissileTimeMs) {
                this.gameState.missiles.splice(this.gameState.missiles.indexOf(missile), 1);
                this.createExplosion(missile.position, missile.explosionRadius, missile.damage);
            }
        }

        this.sendClientUpdate();

        this.gameState.lastUpdate = now;
    }

    private sendClientUpdate() {
        const data = {
            gameState: <GameState>{
                frame: this.gameState.frame,
                players: this.gameState.players.map(p => <Player>{
                    id: p.id,
                    name: p.name,
                    position: p.position,
                    hitBox: p.hitBox,
                    health: p.health,
                    color: p.color,
                    facingAngle: p.facingAngle,
                    canonLength: p.canonLength,
                    power: p.power,
                    exploded: p.exploded,
                    inputs: p.inputs,
                }),
                explosions: this.gameState.explosions,
                missiles: this.gameState.missiles,
                lastUpdate: this.gameState.lastUpdate,
                terrainMesh: this.gameState.terrainMesh,
                isSand: this.gameState.isSand,
                worldWidth: this.gameState.worldWidth,
                worldHeight: this.gameState.worldHeight,
                gravity: this.gameState.gravity,
                wind: this.gameState.wind,
                currentPlayerIndex: this.gameState.currentPlayerIndex,
            }
        };

        const response = SocketResponse.success(data);

        for (const player of this.gameState.players) {
            player.socket.emit('gameStateUpdate', response);
        }
    }

    public handleKeyUp(key: any, player: ServerPlayer) {
        const p = this.gameState.players.find(p => p.id === player.id);
        if (p) {
            p.inputs[key] = false;
        }
    }

    public handleKeyDown(key: any, player: ServerPlayer) {
        const p = this.gameState.players.find(p => p.id === player.id);
        if (p) {
            p.inputs[key] = true;
        }
    }

    private handlePlayerInput(dt: number) {
        for (let player of this.gameState.players) {
            const inputs = player.inputs;

            const maxSlope = 2;
            const speed = 20;
            let direction = 0;

            if (inputs['d']) {
                direction = 1;
            }
            if (inputs['a']) {
                direction = -1;
            }

            if (direction !== 0) {
                // check slope of adjacent terrain points and halt movement if slope is too steep
                let playerPos = new Vector(player.position.x + player.hitBox.x / 2, player.position.y);
                let terrainMesh = this.gameState.terrainMesh;
                let terrainPoint = [...terrainMesh]
                    .filter(a => a.x >= playerPos.x && a.x <= playerPos.x + player.hitBox.x)
                    .sort((a, b) => Vector.distance(a, playerPos) - Vector.distance(b, playerPos))[0];
                if (terrainPoint) {
                    let terrainPointIndex = terrainMesh.indexOf(terrainPoint);
                    let nextTerrainPoint = terrainMesh[terrainPointIndex + direction];
                    if (nextTerrainPoint) {
                        let slope = (nextTerrainPoint.y - terrainPoint.y) / (nextTerrainPoint.x - terrainPoint.x);
                        if (direction === -1 && slope < maxSlope || direction === 1 && slope > -maxSlope) {
                            player.position.x += direction * speed * dt / 1000;
                        }
                    }
                }
            }

            let angleAdjustment = 0;

            if (inputs['q']) {
                angleAdjustment = -0.001;
                if (inputs["shift"]) {
                    angleAdjustment *= 10;
                }
            }
            if (inputs['e']) {
                angleAdjustment = 0.001;
                if (inputs["shift"]) {
                    angleAdjustment *= 10;
                }
            }

            if (angleAdjustment !== 0) {
                player.facingAngle += angleAdjustment;
                player.facingAngle = MathUtils.clamp(player.facingAngle, Math.PI, 2 * Math.PI);
            }

            if (inputs['w']) {
                player.power += 2;
                player.power = MathUtils.clamp(player.power, this.engineState.minCanonVelocity, this.engineState.maxCanonVelocity);
            }
            if (inputs['s']) {
                player.power -= 2;
                player.power = MathUtils.clamp(player.power, this.engineState.minCanonVelocity, this.engineState.maxCanonVelocity);
            }
        }
    }

    private smoothTerrain() {
        let changesMade = false;

        for (let i = 0; i < this.gameState.terrainMesh.length - 3; i++) {
            let point = this.gameState.terrainMesh[i];
            let nextPoint = this.gameState.terrainMesh[i + 1];
            if (nextPoint) {
                let diff = nextPoint.y - point.y;
                let maxPeak = 5;
                if (Math.abs(diff) > maxPeak) {
                    point.y += diff / 2;
                    nextPoint.y -= diff / 2;
                    changesMade = true;
                }
            }
        }

        return changesMade;
    }

    private createExplosion(pos: Vector, radius: number, damage: number) {
        let explosion = new Explosion(pos, radius, 1000, damage);
        this.gameState.explosions.push(explosion);
    }

    private fireMissile(pos: Vector, velocity: Vector) {
        let missile = new Missile(pos, velocity, 5, 20, 25);
        this.gameState.missiles.push(missile);
    }

    toggleDebug() {
        this.engineState.debug = !this.engineState.debug;
    }

    handleFire(player: ServerPlayer) {
        console.log('fire');
        const pos = player.getCanonTipPosition();
        const vel = player.getCanonTipVelocity();
        this.fireMissile(pos, vel);
    }

    handleImmediateInput(key: string) {
    }

    private async createTerrainMesh(): Promise<Vector[]> {
        let worldWidth = this.gameState.worldWidth;
        let worldHeight = this.gameState.worldHeight;
        let minHeight = 200; // Define the minimum height of the terrain here
        let maxHeight = worldHeight - 200; // Define the maximum height of the terrain here
        let startPos = new Vector(0, Math.round(worldHeight / 2));
        let endPosX = worldWidth;

        let terrainMesh = <Vector[]>[];
        terrainMesh.push(startPos);

        let resolution = 5; // space between points

        // implement midpoint displacement algorithm
        let points = [startPos, new Vector(endPosX, startPos.y)];

        const roughness = 0.4;

        let displacement = worldHeight;

        while (points.length < Math.floor(worldWidth / resolution)) {
            for (let i = 0; i < points.length - 1; i += 2) {
                let p1 = points[i];
                let p2 = points[i + 1];
                let mid = new Vector((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);

                //let displacement = Math.abs(p1.y - p2.y) * roughness;

                mid.y += MathUtils.random(-displacement, displacement);
                mid.y = Math.max(minHeight, Math.min(maxHeight, mid.y));

                points.splice(i + 1, 0, mid);
                //await this.sleep(1);

                this.gameState.terrainMesh = points;
            }
            displacement *= roughness;
        }
        terrainMesh.push(...points);
        terrainMesh.push(new Vector(endPosX, startPos.y));

        const bottomRight = new Vector(worldWidth, worldHeight);
        const bottomLeft = new Vector(0, worldHeight);
        terrainMesh.push(bottomRight);
        terrainMesh.push(bottomLeft);

        return terrainMesh;
    }
}
