import { GameState } from "../../shared/GameState";
import { Renderer } from "./Renderer";
import { Vector } from "../../shared/Vector";
import { Player } from "../../shared/Player";
import { Mouse } from "./models/Mouse";
import { Explosion } from "../../shared/Explosion";
import { MathUtils } from "../../shared/MathUtils";
import { Missile } from "../../shared/Missile";
import * as socketio from "socket.io-client";
import { SocketResponse } from "../../shared/SocketResponse";
import { EngineState } from "../../shared/EngineState";

export class Engine extends EventTarget {
    fps: number = 60;
    gameState: GameState;
    engineState: EngineState = new EngineState();
    mouse: Mouse | undefined;
    socket: socketio.Socket;
    started: boolean = false;
    lobbyId: string | undefined;
    renderer: Renderer | undefined;
    isConnected: boolean = false;
    intervalId: NodeJS.Timer | undefined;

    constructor() {
        super();

        let hostname = "eartheater.azurewebsites.net";
        let port = 80;
        if (window.location.hostname === "localhost") {
            port = 3000;
            hostname = "localhost";
        }
        this.socket = socketio.connect(window.location.protocol + "//" + hostname + ":" + port);

        this.gameState = new GameState();

        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));

        this.bindSocketEvents();
    }

    bindSocketEvents(): void {
        this.socket.on("connect", () => {
            this.isConnected = true;
            this.dispatchEvent(new Event("connected"));
        });

        this.socket.on("disconnect", () => {
            this.isConnected = false;
            this.dispatchEvent(new Event("disconnected"));
        });
    }

    createLobby() {
        return new Promise<SocketResponse>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout: createLobby response not received within 5 seconds'));
            }, 5000);

            this.socket.emit('createLobby', null, (data: any) => {
                if (data.error) {
                    reject(data.error);
                    return;
                }

                clearTimeout(timeout);
                this.lobbyId = data.id;
                resolve(data);
            });
        });
    }

    joinLobby(lobbyId: string): Promise<SocketResponse> {
        return new Promise<SocketResponse>((resolve, reject) => {
            // Set a 5 second timeout
            const timeout = setTimeout(() => {
                reject(new Error('Timeout: joinLobby response not received within 5 seconds'));
            }, 5000);

            this.socket.emit('joinLobby', { lobbyId: lobbyId }, (data: any) => {
                if (data.error) {
                    reject(data.error);
                    return;
                }

                console.log(data);
                clearTimeout(timeout);
                resolve(data);
            });
        });
    }

    get myPlayer() {
        return this.gameState.players.find(p => p.id === this.engineState.myPlayerId);
    }

    onKeyUp(e: KeyboardEvent): any {
        this.gameState.inputs[e.key.toLowerCase()] = false;
        this.handleImmediateInput(e.key);
    }

    onKeyDown(e: KeyboardEvent): any {
        this.gameState.inputs[e.key.toLowerCase()] = true;
    }

    public reset() {
        clearInterval(this.intervalId);
        this.intervalId = undefined;

        this.renderer?.delete();
        delete this.renderer;

        this.mouse?.delete();
        delete this.mouse;

        this.started = false;
        this.gameState = new GameState();
    }

    public async start() {
        if (this.started) {
            console.log("Engine already started");
            return;
        }

        this.started = true;

        this.renderer = new Renderer();
        this.mouse = new Mouse(this.renderer.canvas);

        this.gameState.terrainMesh = await this.createTerrainMesh();
        if (this.gameState.isSand) {
            while (this.smoothTerrain()) { /* keep smoothing until there are no more changes */ }
        }
        const player = new Player('id1', 'Player 1');
        player.color = 'blue';
        player.position = new Vector(505, 300);
        this.gameState.players.push(player);
        this.engineState.myPlayerId = player.id;

        const player2 = new Player('id2', 'Player 2');
        player2.color = 'red';
        player2.position = new Vector(800, 300);
        this.gameState.players.push(player2);

        // zoom out canvas to fit screen
        if (this.renderer.canvas.width / this.gameState.worldWidth > this.renderer.canvas.height / this.gameState.worldHeight)
            this.renderer.zoom(this.renderer.canvas.height / this.gameState.worldHeight);
        else
            this.renderer.zoom(this.renderer.canvas.width / this.gameState.worldWidth);

        // center canvas on screen
        window.addEventListener('resize', () => this.centerCameraOnScreen());
        this.centerCameraOnScreen();

        this.intervalId = setInterval(() => {
            this.update();
        }, 1000 / this.fps);
    }

    private centerCameraOnScreen() {
        if (this.renderer === undefined) return;

        this.renderer.pan(
            -(window.innerWidth / this.renderer.camera.zoom - this.gameState.worldWidth) / 2,
            -(window.innerHeight / this.renderer.camera.zoom - this.gameState.worldHeight) / 2
        );
    }

    public update() {
        if (this.renderer === undefined || this.mouse === undefined) return;

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

        // create explosion on mouse click
        if (this.engineState.debug && this.mouse.left && !this.engineState.fireDebounce) {
            this.engineState.fireDebounce = true;
            setTimeout(() => this.engineState.fireDebounce = false, this.engineState.fireDelay);
            let mouseWorldPos = this.renderer.getWorldPosition(this.mouse.position);
            this.createExplosion(mouseWorldPos, 50, 100);
        }

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

        this.renderer.render(this.gameState, dt);

        // render explosions
        for (let explosion of this.gameState.explosions) {
            this.renderer.renderCircle(explosion.position, explosion.radius, 'rgba(255, 0, 0, 0.5)');
        }

        // render missiles
        for (let missile of this.gameState.missiles) {
            missile.update(dt, this.gameState);
            if (missile.isExploded || missile.elapsedTime > this.engineState.maxMissileTimeMs) {
                this.gameState.missiles.splice(this.gameState.missiles.indexOf(missile), 1);
                this.createExplosion(missile.position, missile.explosionRadius, missile.damage);
            }
            this.renderer.renderMissile(missile);
        }

        if (this.engineState.debug && this.myPlayer) {
            this.renderer.renderParabolicTrajectory(
                this.myPlayer.getCanonTipPosition(),
                this.myPlayer.getCanonTipVelocity(),
                this.gameState, 100
            );
        }

        this.gameState.lastUpdate = now;
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

    private handlePlayerInput(dt: number) {
        if (!this.myPlayer || this.myPlayer.isDead || this.gameState.players[this.gameState.currentPlayerIndex] !== this.myPlayer) {
            return;
        }

        const maxSlope = 2;
        const speed = 20;
        let direction = 0;
        if (this.gameState.inputs['d']) {
            direction = 1;
        }
        if (this.gameState.inputs['a']) {
            direction = -1;
        }
        if (direction !== 0) {
            // check slope of adjacent terrain points and halt movement if slope is too steep
            let player = this.myPlayer!;
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
                        this.myPlayer!.position.x += direction * speed * dt / 1000;
                    }
                }
            }
        }

        let angleAdjustment = 0;

        if (this.gameState.inputs['q']) {
            angleAdjustment = -0.001;
            if (this.gameState.inputs["shift"]) {
                angleAdjustment *= 10;
            }
        }
        if (this.gameState.inputs['e']) {
            angleAdjustment = 0.001;
            if (this.gameState.inputs["shift"]) {
                angleAdjustment *= 10;
            }
        }
        if (angleAdjustment !== 0) {
            this.myPlayer.facingAngle += angleAdjustment;
            this.myPlayer.facingAngle = MathUtils.clamp(this.myPlayer.facingAngle, Math.PI, 2 * Math.PI);
        }

        if (this.gameState.inputs['w']) {
            this.myPlayer.power += 2;
            this.myPlayer.power = MathUtils.clamp(this.myPlayer.power, this.engineState.minCanonVelocity, this.engineState.maxCanonVelocity);
        }
        if (this.gameState.inputs['s']) {
            this.myPlayer.power -= 2;
            this.myPlayer.power = MathUtils.clamp(this.myPlayer.power, this.engineState.minCanonVelocity, this.engineState.maxCanonVelocity);
        }

        if (this.gameState.inputs[' '] && !this.engineState.fireDebounce) {
            this.engineState.fireDebounce = true;
            setTimeout(() => {
                this.engineState.fireDebounce = false;
            }, this.engineState.fireDelay);

            this.fireMissile(this.myPlayer.getCanonTipPosition(), this.myPlayer.getCanonTipVelocity());
        }

        if (this.gameState.inputs['0']) {
            this.centerCameraOnScreen();
        }
    }

    toggleDebug() {
        this.engineState.debug = !this.engineState.debug;
    }

    handleImmediateInput(key: string) {
        if (this.renderer === undefined) return;

        if (key === '0') {
            this.centerCameraOnScreen();
        }

        if (key === '1') {
            this.toggleDebug();
        }

        if (key === '-') {
            this.renderer.zoom(this.renderer.camera.zoom - 0.1);
            this.centerCameraOnScreen();
        }

        if (key === '+' || key === '=') {
            this.renderer.zoom(this.renderer.camera.zoom + 0.1);
            this.centerCameraOnScreen();
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
