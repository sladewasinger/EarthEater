import { Camera } from "./Camera";
import { Explosion } from "../../shared/Explosion";
import { Vector } from "../../shared/Vector";
import { GameState } from "../../shared/GameState";
import { MathUtils } from "../../shared/MathUtils";
import { Missile } from "../../shared/Missile";

class Cloud {
    constructor(public position: Vector, public radius: number) { }
}

export class Renderer {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D | undefined;
    offscreenCanvas: HTMLCanvasElement;
    camera: Camera = new Camera();
    images: { [key: string]: HTMLImageElement } = {};
    explosions: Explosion[] = [];
    clouds: Cloud[] = [];
    timeOfDay: number = 0;
    id: string = '';

    constructor() {
        this.id = MathUtils.uuidv4();

        this.canvas = document.createElement('canvas');
        document.body.appendChild(this.canvas);

        this.offscreenCanvas = document.createElement('canvas');

        window.addEventListener('resize', this.resize.bind(this));
        this.resize();
    }

    delete() {
        this.explosions = [];
        this.clouds = [];
        window.removeEventListener('resize', this.resize.bind(this));
        document.body.removeChild(this.canvas);
    }

    getWorldPosition(pos: Vector): Vector {
        let worldPos = new Vector(pos.x / this.camera.zoom + this.camera.x, pos.y / this.camera.zoom + this.camera.y);
        return worldPos;
    }

    zoom(zoom: number) {
        this.camera.zoom = zoom;
    }

    pan(x: number, y: number) {
        this.camera.x = x;
        this.camera.y = y;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;

        this.offscreenCanvas.width = this.canvas.width;
        this.offscreenCanvas.height = this.canvas.height;
    }

    getDarkColor() {
        if (this.timeOfDay > 6000 && this.timeOfDay < 20600) {
            return '#000000';
        } else {
            return '#ffffff';
        }
    }

    getLightColor() {
        if (this.timeOfDay > 6000 && this.timeOfDay < 20600) {
            return '#ffffff';
        } else {
            return '#000000';
        }
    }

    async loadAssets() {
        return new Promise<void>((resolve) => {
            const imageNames = ['stone_texture.png'];
            let imagesLoaded = 0;
            for (let imageName of imageNames) {
                const image = new Image();
                image.onload = () => {
                    imagesLoaded++;
                    if (imagesLoaded === imageNames.length) {
                        resolve();
                    }
                };
                image.src = `./${imageName}`;
                this.images[imageName] = image;
            }
        });
    }

    public render(gameState: GameState, dt: number) {
        if (!this.context) {
            let ctx = this.canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');
            this.context = ctx;
        }

        this.context.imageSmoothingEnabled = false;

        this.timeOfDay = (gameState.frame * 5) % 24000 + 0;

        // Clear the canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.offscreenCanvas.getContext('2d')?.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);

        this.renderSky(this.context, gameState);
        this.renderSun(this.context, gameState);
        this.renderMoon(this.context, gameState);
        this.renderClouds(this.context, gameState, dt);
        this.renderTerrainMesh(this.context, gameState);
        this.renderPlayers(this.context, gameState);
        this.renderHelpText(this.context, gameState);
        this.renderPlayerInfo(this.context, gameState);
        this.renderDebugInfo(this.context, gameState);
    }

    private adjustToCamera(ctx: CanvasRenderingContext2D) {
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.camera.x, -this.camera.y);
    }

    private renderSky(ctx: CanvasRenderingContext2D, gameState: GameState) {
        ctx.save();
        this.adjustToCamera(ctx);

        // render sky
        let grd = ctx.createLinearGradient(0, 0, 0, gameState.worldHeight);
        // gradient colors based on time of day (frame)

        type Color = [number, number, number];
        interface TimeToColors {
            [time: number]: [Color, Color];
        }

        function lerp(a: number, b: number, t: number) {
            return a + (b - a) * t;
        }

        function mixColors(color1: Color, color2: Color, t: number) {
            return [
                lerp(color1[0], color2[0], t),
                lerp(color1[1], color2[1], t),
                lerp(color1[2], color2[2], t),
            ];
        }

        // Gradient colors based on time of day (frame)
        const night = <Color>[0, 0, 0];
        const dawn = <Color>[255, 140, 0];
        const day = <Color>[135, 206, 235];
        const day2 = <Color>[155, 190, 255];
        const dusk = <Color>[238, 130, 238];

        const timeToColors: TimeToColors = {
            0: [night, night],
            5000: [night, dawn],
            7200: [dawn, dawn],
            8000: [dawn, day],
            9000: [day, day],
            12000: [day, day],
            15000: [day2, day2],
            18800: [day2, dusk],
            20600: [night, dusk],
            24000: [night, night],
        };

        let prevTime = 0;
        let prevColors = timeToColors[prevTime];
        let nextTime = 0;
        let nextColors = prevColors;

        for (const timeStr in timeToColors) {
            const time = parseFloat(timeStr);
            if (this.timeOfDay >= prevTime && this.timeOfDay < time) {
                nextTime = time;
                nextColors = timeToColors[time];
                break;
            }
            prevTime = time;
            prevColors = timeToColors[time];
        }

        let t = (this.timeOfDay - prevTime) / (nextTime - prevTime);
        let color1 = mixColors(prevColors[0], nextColors[0], t);
        let color2 = mixColors(prevColors[1], nextColors[1], t);

        grd.addColorStop(0, `rgb(${Math.round(color1[0])}, ${Math.round(color1[1])}, ${Math.round(color1[2])})`);
        grd.addColorStop(1, `rgb(${Math.round(color2[0])}, ${Math.round(color2[1])}, ${Math.round(color2[2])})`);

        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, gameState.worldWidth, gameState.worldHeight);

        ctx.restore();
    }

    private renderSun(ctx: CanvasRenderingContext2D, gameState: GameState) {
        ctx.save();
        this.adjustToCamera(ctx);

        ctx.beginPath();
        ctx.rect(0, 0, gameState.worldWidth, gameState.worldHeight);
        ctx.clip();

        // Sun's angle based on game frame
        let sunAngle = (2 * Math.PI * this.timeOfDay) / 24000;

        // sun follows arc based on game frame
        let sunX = gameState.worldWidth / 2 - Math.sin(sunAngle) * 600;
        let sunY = gameState.worldHeight / 2 + 100 + Math.cos(sunAngle) * gameState.worldHeight / 2;

        // orange glow
        ctx.shadowColor = "#ff7f00";
        ctx.shadowBlur = 40;

        ctx.fillStyle = "#ffff00";
        ctx.beginPath();
        ctx.arc(sunX, sunY, 100, 0, 2 * Math.PI);
        ctx.fill();

        if (this.timeOfDay < 5000 || this.timeOfDay > 20600) {
            // draw stars
            ctx.fillStyle = "#ffffff";
            const mulberry32 = MathUtils.mulberry32(1234);
            for (let i = 0; i < 100; i++) {
                let x = mulberry32() * gameState.worldWidth;
                let y = mulberry32() * gameState.worldHeight;
                let size = mulberry32() * 2;
                ctx.fillRect(x, y, size, size);
            }
        }

        ctx.restore();
    }

    private renderMoon(ctx: CanvasRenderingContext2D, gameState: GameState) {
        ctx.save();
        this.adjustToCamera(ctx);

        ctx.rect(0, 0, gameState.worldWidth, gameState.worldHeight);
        ctx.clip();

        // render moon
        let moonAngle = (2 * Math.PI * (this.timeOfDay + 12000)) / 24000;
        let moonX = gameState.worldWidth / 2 - Math.sin(moonAngle) * 500;
        let moonY = gameState.worldHeight / 2 + 60 + Math.cos(moonAngle) * 500;

        let offscreenCtx = this.offscreenCanvas.getContext('2d');
        if (!offscreenCtx) {
            throw new Error("Could not get offscreen canvas context");
        }

        // Clear the offscreen canvas
        offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);

        // Draw the outer circle on the offscreen canvas
        offscreenCtx.fillStyle = "#ffffff";
        offscreenCtx.beginPath();
        offscreenCtx.arc(50, 50, 50, 0, 2 * Math.PI);
        offscreenCtx.fill();

        // Draw the inner circle (subtractive) on the offscreen canvas
        offscreenCtx.globalCompositeOperation = "destination-out";
        offscreenCtx.beginPath();
        offscreenCtx.arc(50 + 20, 50, 50, 0, 2 * Math.PI);
        offscreenCtx.fill();

        // Reset composite operation to default on the offscreen canvas
        offscreenCtx.globalCompositeOperation = "source-over";

        // Draw the crescent moon on the main canvas with shadow
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 20;
        ctx.drawImage(this.offscreenCanvas, moonX - 50, moonY - 50);

        // Reset shadow settings
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    private setupClouds(gameState: GameState) {
        // setup clouds
        let random = MathUtils.mulberry32(5);
        for (let i = 0; i < 10; i++) {
            let relativeX = random() * gameState.worldWidth;
            let relativeY = random() * gameState.worldHeight;
            for (let j = 0; j < random() * 3 + 2; j++) {
                let size = random() * 50 + 50;
                let x = relativeX + random() * 100 - 50;
                let y = relativeY + random() * 100 - 50;
                this.clouds.push(new Cloud(new Vector(x, y), size));
            }
        }
    }

    private renderClouds(ctx: CanvasRenderingContext2D, gameState: GameState, dt: number) {
        ctx.save();
        this.adjustToCamera(ctx);

        // create a clipping region based on the canvas dimensions
        ctx.beginPath();
        ctx.rect(0, 0, gameState.worldWidth, gameState.worldHeight);
        ctx.clip();

        // draw circles to form clouds
        ctx.fillStyle = "#ffffff";

        if (this.clouds.length === 0) {
            this.setupClouds(gameState);
        }

        for (let cloud of this.clouds) {
            // move clouds
            cloud.position.x += gameState.wind.x * dt / 1000;
            cloud.position.y += gameState.wind.y * dt / 1000;

            if (cloud.position.x + cloud.radius < 0) {
                cloud.position.x = gameState.worldWidth;
            } else if (cloud.position.x - cloud.radius > gameState.worldWidth) {
                cloud.position.x = -cloud.radius;
            }

            if (cloud.position.y < 0) {
                cloud.position.y = gameState.worldHeight;
            } else if (cloud.position.y > gameState.worldHeight) {
                cloud.position.y = 0;
            }

            // draw cloud
            ctx.beginPath();
            ctx.arc(cloud.position.x, cloud.position.y, cloud.radius, 0, 2 * Math.PI);
            ctx.fill();
        }

        ctx.restore();
    }

    private renderTerrainMesh(ctx: CanvasRenderingContext2D, gameState: GameState) {
        let terrainMesh = gameState.terrainMesh;
        if (!terrainMesh || terrainMesh.length === 0) {
            return;
        }

        ctx.save();
        this.adjustToCamera(ctx);

        if (gameState.isSand) {
            // darker beige
            ctx.fillStyle = "#d2b48c";
        } else {
            // dark grey
            ctx.fillStyle = "#555";
        }
        ctx.beginPath();
        ctx.moveTo(terrainMesh[0].x, terrainMesh[0].y);
        for (let i = 1; i < terrainMesh.length; i++) {
            ctx.lineTo(terrainMesh[i].x, terrainMesh[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // draw rect around world bounds
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 5;
        ctx.strokeRect(0, 0, gameState.worldWidth, gameState.worldHeight);

        ctx.restore();
    }

    private renderPlayers(ctx: CanvasRenderingContext2D, gameState: GameState) {
        for (let player of gameState.players) {
            // draw tank as square
            ctx.save();
            this.adjustToCamera(ctx);

            // draw tank
            ctx.translate(player.position.x, player.position.y);

            // draw arrow pointing to current player
            if (player.id === gameState.players[gameState.currentPlayerIndex].id) {
                ctx.save();
                ctx.translate(player.hitBox.x / 2, - 75); // Adjust the translation

                ctx.strokeStyle = 'black';
                ctx.fillStyle = 'red';
                ctx.lineWidth = 2;

                ctx.beginPath();
                ctx.rect(-2.5, -5, 5, -20); // Arrow shaft
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-10, -10); // Left side of arrowhead
                ctx.lineTo(10, -10);  // Right side of arrowhead
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.restore();
            }

            ctx.fillStyle = player.color;
            ctx.fillRect(0, 0, player.hitBox.x, player.hitBox.y);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.strokeRect(0, 0, player.hitBox.x, player.hitBox.y);

            // draw x over dead player
            if (player.isDead) {
                ctx.save();
                ctx.translate(player.hitBox.x / 2, player.hitBox.y / 2);

                ctx.strokeStyle = 'black';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(-player.hitBox.x / 2, -player.hitBox.y / 2);
                ctx.lineTo(player.hitBox.x / 2, player.hitBox.y / 2);
                ctx.moveTo(player.hitBox.x / 2, -player.hitBox.y / 2);
                ctx.lineTo(-player.hitBox.x / 2, player.hitBox.y / 2);
                ctx.stroke();

                ctx.restore();
            }

            if (!player.isDead) {
                // draw player canon
                ctx.save();
                ctx.translate(player.hitBox.x / 2, player.hitBox.y / 2);
                ctx.rotate(player.facingAngle);
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, -2.5, player.canonLength, 5);
                ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
                ctx.lineWidth = 1;
                ctx.strokeRect(0, -2.5, player.canonLength, 5);
                ctx.restore();
            }

            // draw player name
            if (player.isDead) {
                ctx.translate(player.hitBox.x / 2, player.hitBox.y + 20);
            } else {
                ctx.translate(player.hitBox.x / 2, player.hitBox.y / 2 - 45);
            }
            ctx.fillStyle = this.getLightColor();
            ctx.font = "20px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const textSize = ctx.measureText(player.name);
            const fontHeight = (textSize.fontBoundingBoxAscent + textSize.fontBoundingBoxDescent) * 1.1;
            const width = textSize.width * 1.1;
            //ctx.fillRect(-width / 2, -fontHeight / 2, width, fontHeight);
            ctx.beginPath();
            ctx.roundRect(-width / 2, -fontHeight / 2, width, fontHeight, 5);
            ctx.fill();

            ctx.fillStyle = this.getDarkColor();
            ctx.fillText(player.name, 0, 0);

            // draw player health bar
            if (!player.isDead) {
                let R = (1 - player.health / 100) * 255;
                let G = 255 - R;
                let y = -fontHeight / 2 - 10;
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.roundRect(-width / 2, y, width, 5, 5);
                ctx.fill();
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(-width / 2, y, width, 5, 5);
                ctx.stroke();
                ctx.fillStyle = `rgb(${R}, ${G}, 0)`;
                ctx.beginPath();
                ctx.roundRect(-width / 2, y, width * (player.health / 100), 5, 5);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    public renderParabolicTrajectory(initialPosition: Vector, initialVelocity: Vector, gameState: GameState, numPoints: number = 100) {
        const ctx = this.context;
        if (!ctx) return;

        ctx.save();
        this.adjustToCamera(ctx);

        // Use a constant time step
        const dt = 60 / 1000;

        // Initial position and velocity of the missile
        let position = initialPosition.clone();
        let velocity = initialVelocity.clone();

        ctx.beginPath();
        ctx.moveTo(position.x, position.y);
        ctx.lineWidth = 2;

        // Draw the parabolic trajectory by iterating through the points
        for (let i = 0; i < numPoints; i++) {
            // Calculate the accumulated time
            const accumulatedTime = dt * (i + 1);

            // Calculate the updated velocity with wind effect
            const updatedVelocity = Vector.add(velocity, Vector.multiply(gameState.wind, 0.5 * accumulatedTime));

            // Calculate the new position based on the updated velocity and the accumulated time
            const newPosition = Vector.add(position, Vector.multiply(updatedVelocity, accumulatedTime));
            newPosition.y += 0.5 * gameState.gravity.y * accumulatedTime * accumulatedTime;

            // Draw line to the new position
            ctx.lineTo(newPosition.x, newPosition.y);
        }

        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = 5;
        ctx.stroke();

        ctx.strokeStyle = 'black';
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = 0;
        ctx.stroke();

        ctx.restore();
    }

    private renderDebugInfo(ctx: CanvasRenderingContext2D, gameState: GameState) {
        ctx.save();
        this.adjustToCamera(ctx);

        ctx.font = "20px Arial";
        ctx.fillStyle = "#000000";
        ctx.fillText(`Frame: ${gameState.frame}`, 10, 30);

        ctx.restore();
    }

    private renderHelpText(ctx: CanvasRenderingContext2D, gameState: GameState) {
        ctx.save();
        this.adjustToCamera(ctx);

        ctx.font = "20px Arial";
        ctx.fillStyle = "#000000";
        const textLines = [
            "Press 'a' or 'd' to move left and right.",
            "Press 'w' or 's' to increase/decrease power.",
            "Press 'q' or 'e' to finely adjust angle (hold [shift] to increase speed).",
            "Press 'space' to fire.",
            "Press '-' or '=' to zoom in and out (or scroll with mouse wheel).",
        ]
        const y = gameState.worldHeight - 30 * textLines.length - 10;
        for (let i = 0; i < textLines.length; i++) {
            ctx.fillText(textLines[i], 10, y + 30 * i);
        }

        ctx.restore();
    }

    private renderPlayerInfo(ctx: CanvasRenderingContext2D, gameState: GameState) {
        const player = gameState.players[gameState.currentPlayerIndex];
        if (!player) return;

        ctx.save();
        this.adjustToCamera(ctx);

        ctx.font = "20px Arial";
        ctx.fillStyle = "#000000";
        ctx.strokeStyle = "rgba(255, 255, 255, 1)";
        ctx.lineWidth = 0.1;
        let angleDegrees = player.facingAngle * 180 / Math.PI - 180;
        const textLines = [
            `Player ${gameState.currentPlayerIndex + 1} (${player.color})`,
            `Angle: ${angleDegrees.toFixed(2)}`,
            `Power: ${player.power.toFixed(2)}`,
        ]
        const y = gameState.worldHeight - 30 * textLines.length - 10;
        for (let i = 0; i < textLines.length; i++) {
            //ctx.strokeText(textLines[i], gameState.worldWidth - 10 - ctx.measureText(textLines[i]).width, y + 30 * i);
            ctx.fillText(textLines[i], gameState.worldWidth - 10 - ctx.measureText(textLines[i]).width, y + 30 * i);
        }


        ctx.restore();
    }

    public renderCircle(position: Vector, radius: number, color: string, strokeColor?: string | undefined) {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not found');

        ctx.save();
        this.adjustToCamera(ctx);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI);
        ctx.fill();

        if (strokeColor != undefined) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.restore();
    }

    public renderMissile(missile: Missile) {
        this.renderCircle(missile.position, missile.radius, this.getDarkColor(), this.getLightColor());
    }

    public renderRect(pos: Vector, size: Vector, color: string) {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not found');

        ctx.save();
        this.adjustToCamera(ctx);

        ctx.fillStyle = color;
        ctx.fillRect(
            pos.x,
            pos.y,
            size.x,
            size.y
        );

        ctx.restore();
    }
}
