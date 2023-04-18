import { GameState } from "./models/GameState";
import { Renderer } from "./Renderer";
import { Vector } from "./models/Vector";
import { Player } from "./models/Player";
import { Mouse } from "./models/Mouse";
import { Explosion } from "./models/Explosion";
import { MathUtils } from "./models/MathUtils";
import { Missile } from "./models/Missile";

export class EngineState {
    fireDelay: number = 1000;
    fireDebounce: boolean = false;
    myPlayerId: string | undefined;
}

export class Engine {
    fps: number = 60;
    gameState: GameState;
    engineState: EngineState = new EngineState();
    mouse: Mouse;

    constructor(public renderer: Renderer) {
        this.gameState = new GameState();

        this.mouse = new Mouse(this.renderer.canvas);

        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    get myPlayer() {
        return this.gameState.players.find(p => p.id === this.engineState.myPlayerId);
    }

    onKeyUp(e: KeyboardEvent): any {
        this.gameState.inputs[e.key] = false;
    }

    onKeyDown(e: KeyboardEvent): any {
        this.gameState.inputs[e.key] = true;
    }

    public async start() {
        this.gameState.terrainMesh = await this.createTerrainMesh();

        const player = new Player('test');
        player.color = 'blue';
        this.gameState.players.push(player);
        this.engineState.myPlayerId = player.id;
        this.myPlayer!.position = new Vector(505, 300);

        // zoom out canvas to fit screen
        if (this.renderer.canvas.width / this.gameState.worldWidth > this.renderer.canvas.height / this.gameState.worldHeight)
            this.renderer.zoom(this.renderer.canvas.height / this.gameState.worldHeight);
        else
            this.renderer.zoom(this.renderer.canvas.width / this.gameState.worldWidth);

        setInterval(() => {
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

        // create explosion
        if (this.mouse.left && !this.engineState.fireDebounce) {
            let mouseWorldPos = this.renderer.getWorldPosition(this.mouse.position);
            this.createExplosion(mouseWorldPos);
        }

        for (let i = 0; i < this.gameState.explosions.length; i++) {
            let explosion = this.gameState.explosions[i];

            if (!explosion.isExploded) {
                let explosionRadius = explosion.radius;
                let explosionPos = explosion.position;
                for (let point of this.gameState.terrainMesh) {
                    if (point.x >= explosionPos.x - explosionRadius && point.x <= explosionPos.x + explosionRadius) {
                        let yPos = explosionPos.y + Math.sqrt(Math.pow(explosionRadius, 2) - Math.pow(point.x - explosionPos.x, 2));
                        point.y = Math.min(this.gameState.worldHeight, Math.max(point.y, yPos));
                    }
                }
            }

            explosion.update(dt);
            if (explosion.timeLeftMs <= 0) {
                this.gameState.explosions.splice(i, 1);
            }
        }

        if (this.gameState.isSand) {
            for (let i = 0; i < this.gameState.terrainMesh.length - 3; i++) {
                let point = this.gameState.terrainMesh[i];
                let nextPoint = this.gameState.terrainMesh[i + 1];
                if (nextPoint) {
                    const timeScale = 1000 / this.fps / dt;
                    let diff = nextPoint.y - point.y;
                    let maxPeak = 5;
                    if (Math.abs(diff) > maxPeak) {
                        point.y += diff * timeScale / 2;
                        nextPoint.y -= diff / 2;
                    }
                }
            }
        }

        this.renderer.render(this.gameState);

        // render explosions
        for (let explosion of this.gameState.explosions) {
            this.renderer.renderCircle(explosion.position, explosion.radius, 'rgba(255, 0, 0, 0.5)');
        }

        // render missiles
        for (let missile of this.gameState.missiles) {
            missile.update(dt, this.gameState);
            if (missile.isExploded) {
                this.gameState.missiles.splice(this.gameState.missiles.indexOf(missile), 1);
                this.createExplosion(missile.position);
            }
            this.renderer.renderCircle(missile.position, missile.radius, 'rgba(0, 0, 0, 0.5)');
        }

        this.gameState.lastUpdate = now;
    }

    private createExplosion(pos: Vector) {
        let explosion = new Explosion(pos, 50, 1000);
        this.gameState.explosions.push(explosion);
    }

    private fireMissile(pos: Vector, direction: Vector, speed: number) {
        let missile = new Missile(pos, Vector.scale(direction, speed), 5);
        this.gameState.missiles.push(missile);
    }

    private handlePlayerInput(dt: number) {
        if (!this.myPlayer) {
            return;
        }

        const maxSlope = 2;
        const speed = 20;
        if (this.gameState.inputs['d']) {
            // check slope of adjacent terrain points and halt movement if slope is too steep
            let player = this.myPlayer!;
            let playerPos = player.position;
            let playerHitBox = player.hitBox;
            let terrainMesh = this.gameState.terrainMesh;
            let terrainPoint = terrainMesh.find(p => p.x >= playerPos.x && p.x <= playerPos.x + playerHitBox.x);
            if (terrainPoint) {
                let terrainPointIndex = terrainMesh.indexOf(terrainPoint);
                let nextTerrainPoint = terrainMesh[terrainPointIndex + 1];
                if (nextTerrainPoint) {
                    let slope = (nextTerrainPoint.y - terrainPoint.y) / (nextTerrainPoint.x - terrainPoint.x);
                    console.log(slope)
                    if (slope < -maxSlope) {
                        return;
                    }
                }
            }
            this.myPlayer!.position.x += speed * dt / 1000;
        }
        if (this.gameState.inputs['a']) {
            // check slope of line at player center and halt movement if slope is too steep
            let player = this.myPlayer!;
            let playerPos = player.position.clone();
            let playerHitBox = player.hitBox;
            let terrainMesh = this.gameState.terrainMesh;
            let terrainPoint = terrainMesh.find(p => p.x >= playerPos.x && p.x <= playerPos.x + playerHitBox.x);
            if (terrainPoint) {
                let terrainPointIndex = terrainMesh.indexOf(terrainPoint);
                let nextTerrainPoint = terrainMesh[terrainPointIndex - 1];
                if (nextTerrainPoint) {
                    let slope = (nextTerrainPoint.y - terrainPoint.y) / (nextTerrainPoint.x - terrainPoint.x);
                    console.log(slope)
                    if (slope > maxSlope) {
                        return;
                    }
                }
            }
            this.myPlayer!.position.x -= speed * dt / 1000;
        }

        if (this.gameState.inputs['q']) {
            this.myPlayer.facingAngle -= 0.01;
        }
        if (this.gameState.inputs['e']) {
            this.myPlayer.facingAngle += 0.01;
        }

        this.myPlayer.facingAngle = MathUtils.clamp(this.myPlayer.facingAngle, Math.PI, 2 * Math.PI);

        if (this.gameState.inputs[' '] && !this.engineState.fireDebounce) {
            this.engineState.fireDebounce = true;
            setTimeout(() => {
                this.engineState.fireDebounce = false;
            }, this.engineState.fireDelay);

            let pos = this.myPlayer.position.clone();
            pos = Vector.add(pos, Vector.fromAngle(this.myPlayer.facingAngle, 50));
            this.fireMissile(pos, Vector.fromAngle(this.myPlayer.facingAngle, 1), 500);
        }
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

        let resolution = 10; // space between points

        // implement midpoint displacement algorithm

        // seed:
        const seedX = worldWidth / 2;
        const seedY = worldHeight * 0.5 + MathUtils.random(-worldHeight * 0.5, worldHeight * 0.5);

        let points = [startPos, new Vector(seedX, seedY), new Vector(endPosX, startPos.y)];
        const roughness = 1.3;

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
                this.renderer.render(this.gameState);

            }
            displacement *= 2 ** (-roughness);
        }
        terrainMesh.push(...points);



        // for (let i = 0; i < endPosX; i += resolution) {
        //     let pos = new Vector(i, Math.max(minHeight, Math.min(maxHeight, lastPos.y + (Math.random() * 2 - 1) * 100 * jaggedness)));
        //     terrainMesh.push(pos);
        //     lastPos = pos;
        // }
        terrainMesh.push(new Vector(endPosX, startPos.y));

        const bottomRight = new Vector(worldWidth, worldHeight);
        const bottomLeft = new Vector(0, worldHeight);
        terrainMesh.push(bottomRight);
        terrainMesh.push(bottomLeft);

        return terrainMesh;
    }
}
