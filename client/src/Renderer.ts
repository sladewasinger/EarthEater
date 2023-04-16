import { Camera } from "./Camera";
import { Vector } from "./Vector";
import { GameState } from "./models/GameState";

class Explosion {
    public elapsedTime: number = 0;
    public constructor(public position: Vector, public radius: number, public durationMs: number) {
        setInterval(() => {
            this.elapsedTime += 1000 / 60;
        }, 1000 / 60);
    }

    get timeLeftMs() {
        return this.durationMs - this.elapsedTime;
    }
}

export class Renderer {
    canvas: HTMLCanvasElement;
    camera: Camera = new Camera();
    tileSize: number = 32;
    images: { [key: string]: HTMLImageElement } = {};
    explosions: Explosion[] = [];

    constructor() {
        this.canvas = document.createElement('canvas');
        document.body.appendChild(this.canvas);
        window.addEventListener('resize', () => this.resize());
        this.resize();
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

    public render(gameState: GameState) {
        let ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        ctx.imageSmoothingEnabled = false;

        // Clear the canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawTiles(ctx, gameState);
        this.drawPlayer(ctx, gameState);
        this.drawDynamite(ctx, gameState);
        this.drawExplosions(ctx);
    }

    private drawTiles(ctx: CanvasRenderingContext2D, gameState: GameState) {
        ctx.save();
        ctx.translate(-this.camera.x, -this.camera.y);
        ctx.scale(this.camera.zoom, this.camera.zoom);

        // Calculate the range of visible tiles
        const tileWidth = this.tileSize;
        const tileHeight = this.tileSize;
        const left = Math.floor(this.camera.x / (tileWidth * this.camera.zoom));
        const right = Math.ceil((this.camera.x + this.canvas.width) / (tileWidth * this.camera.zoom));
        const top = Math.floor(this.camera.y / (tileHeight * this.camera.zoom));
        const bottom = Math.ceil((this.camera.y + this.canvas.height) / (tileHeight * this.camera.zoom));

        ctx.save();
        ctx.beginPath();

        // Draw the visible tiles
        for (let y = top; y < bottom; y++) {
            for (let x = left; x < right; x++) {
                if (gameState.grid[y] && gameState.grid[y][x]) {
                    const tile = gameState.grid[y][x];
                    ctx.fillStyle = this.tileTypeToColor(tile.type);
                    const tileX = x * this.tileSize;
                    const tileY = y * this.tileSize;
                    const overlap = 1; // Overlap by 1 pixel to cover gaps
                    if (tile.type === 'stone') {
                        ctx.rect(
                            tileX - overlap / 2,
                            tileY - overlap / 2,
                            this.tileSize + overlap,
                            this.tileSize + overlap
                        );
                    }
                }
            }
        }

        ctx.clip();

        const imageWidth = this.images['stone_texture.png'].width;
        const imageHeight = this.images['stone_texture.png'].height;
        const startX = Math.floor(this.camera.x / (imageWidth * this.camera.zoom)) * imageWidth;
        const startY = Math.floor(this.camera.y / (imageHeight * this.camera.zoom)) * imageHeight;

        for (let i = 0; i <= Math.ceil(this.canvas.width / (imageWidth * this.camera.zoom)); i++) {
            for (let j = 0; j <= Math.ceil(this.canvas.height / (imageHeight * this.camera.zoom)); j++) {
                ctx.drawImage(
                    this.images['stone_texture.png'],
                    startX + i * imageWidth,
                    startY + j * imageHeight,
                    imageWidth,
                    imageHeight,
                );
            }
        }

        // remove clipping:
        ctx.restore();

        // draw grid lines

        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';

        for (let y = top; y < bottom; y++) {
            ctx.beginPath();
            ctx.moveTo(left * this.tileSize, y * this.tileSize);
            ctx.lineTo(right * this.tileSize, y * this.tileSize);
            ctx.stroke();
        }

        for (let x = left; x < right; x++) {
            ctx.beginPath();
            ctx.moveTo(x * this.tileSize, top * this.tileSize);
            ctx.lineTo(x * this.tileSize, bottom * this.tileSize);
            ctx.stroke();
        }

        for (let y = top; y < bottom; y++) {
            for (let x = left; x < right; x++) {
                if (gameState.grid[y] && gameState.grid[y][x]) {
                    const tile = gameState.grid[y][x];
                    ctx.fillStyle = this.tileTypeToColor(tile.type);
                    const tileX = x * this.tileSize;
                    const tileY = y * this.tileSize;
                    if (tile.type !== 'stone') {
                        ctx.fillRect(
                            tileX,
                            tileY,
                            this.tileSize,
                            this.tileSize,
                        );
                    }
                }
            }
        }

        // Restore the canvas context to its original state
        ctx.restore();
    }

    private drawPlayer(ctx: CanvasRenderingContext2D, gameState: GameState) {
        ctx.save();
        ctx.translate(-this.camera.x, -this.camera.y);
        ctx.scale(this.camera.zoom, this.camera.zoom);

        ctx.fillStyle = 'red';
        const playerX = gameState.player.position.x * this.tileSize;
        const playerY = gameState.player.position.y * this.tileSize;
        const playerSize = Math.ceil(this.tileSize);
        ctx.fillRect(
            playerX,
            playerY,
            playerSize,
            playerSize
        );

        // draw arrow showing player facing direction
        ctx.beginPath();
        ctx.moveTo(playerX + playerSize / 2, playerY + playerSize / 2);

        const endPos = Vector.add(new Vector(playerX + playerSize / 2, playerY + playerSize / 2), Vector.fromAngle(gameState.player.facingAngle, this.tileSize));
        //ctx.lineTo(playerX + playerSize / 2 + Math.cos(gameState.player.facingAngle) * playerSize / 2, playerY + playerSize / 2 + Math.sin(gameState.player.facingAngle) * playerSize / 2);
        ctx.lineTo(endPos.x, endPos.y);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = this.tileSize / 5;
        ctx.stroke();

        ctx.restore();
    }

    private drawDynamite(ctx: CanvasRenderingContext2D, gameState: GameState) {
        ctx.save();
        ctx.translate(-this.camera.x, -this.camera.y);
        ctx.scale(this.camera.zoom, this.camera.zoom);
        //ctx.rotate(Math.PI / 4); // dynamite is rotated 45 degrees


        for (const dynamite of gameState.dynamites) {
            const dynamiteSize = new Vector(this.tileSize / 4, this.tileSize);

            const dynamiteX = Math.round(dynamite.pos.x * this.tileSize) + this.tileSize / 2 - dynamiteSize.x / 2;
            const dynamiteY = Math.round(dynamite.pos.y * this.tileSize) + this.tileSize / 2 - dynamiteSize.y / 2;

            // rotate dynamite around its center 45 degrees
            ctx.save();
            ctx.translate(dynamiteX + dynamiteSize.x / 2, dynamiteY + dynamiteSize.y / 2);
            ctx.rotate(Math.PI / 4);
            ctx.translate(-dynamiteX - dynamiteSize.x / 2, -dynamiteY - dynamiteSize.y / 2);

            ctx.fillStyle = 'red';
            ctx.fillRect(
                dynamiteX,
                dynamiteY,
                dynamiteSize.x,
                dynamiteSize.y
            );
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'black';
            ctx.strokeRect(
                dynamiteX,
                dynamiteY,
                dynamiteSize.x,
                dynamiteSize.y
            );

            ctx.restore();

            // draw fuse
            ctx.beginPath();

            const startPos = new Vector(dynamiteX + this.tileSize / 2, dynamiteY);
            const fusePercent = Math.max(0, (1 - dynamite.elapsedTimeMs / dynamite.fuseMs));

            // draw fuse along bezier curve, shortening as it burns
            const cp1 = Vector.add(startPos, new Vector(this.tileSize, -this.tileSize));
            const endPos = Vector.add(startPos, new Vector(this.tileSize * 2, 0));

            const [curveStart, curveEnd] = this.subdivideBezierCurve(fusePercent, startPos, cp1, cp1, endPos);
            ctx.moveTo(curveStart[0].x, curveStart[0].y);
            ctx.bezierCurveTo(curveStart[1].x, curveStart[1].y, curveStart[2].x, curveStart[2].y, curveStart[3].x, curveStart[3].y);

            //ctx.lineTo(dynamiteX - this.tileSize / 2 + fuseLength, dynamiteY + this.tileSize / 2);

            let R = (255 * dynamite.elapsedTimeMs / dynamite.fuseMs) | 0;
            let G = (255 * (1 - dynamite.elapsedTimeMs / dynamite.fuseMs)) | 0;
            let B = 0;
            ctx.strokeStyle = `rgb(${R}, ${G}, ${B})`;
            ctx.lineWidth = this.tileSize / 5;
            ctx.stroke();

        }

        ctx.restore();
    }

    // I don't know - ChatGPT gave it to me
    private subdivideBezierCurve(t: number, p0: Vector, p1: Vector, p2: Vector, p3: Vector): [Vector[], Vector[]] {
        const p01 = Vector.lerp(p0, p1, t);
        const p12 = Vector.lerp(p1, p2, t);
        const p23 = Vector.lerp(p2, p3, t);
        const p012 = Vector.lerp(p01, p12, t);
        const p123 = Vector.lerp(p12, p23, t);
        const p0123 = Vector.lerp(p012, p123, t);

        return [
            [p0, p01, p012, p0123],
            [p0123, p123, p23, p3]
        ];
    }

    private drawExplosions(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(-this.camera.x, -this.camera.y);
        ctx.scale(this.camera.zoom, this.camera.zoom);

        for (const explosion of this.explosions) {
            ctx.beginPath();
            const radius = Math.max(0, explosion.radius * this.tileSize * (1 - (explosion.elapsedTime / explosion.durationMs)));
            ctx.arc(explosion.position.x * this.tileSize + this.tileSize / 2, explosion.position.y * this.tileSize + this.tileSize / 2, radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fill();
        }

        ctx.restore();
    }

    private tileTypeToColor(type: string) {
        switch (type) {
            case 'grass':
                return 'green';
            case 'stone':
                return '#000';
            case 'air':
                return 'rgba(128, 128, 128, 0.5)';
            default:
                return 'black';
        }
    }

    public queueExplosion(pos: Vector, explosionRadius: number, durationMs: number) {
        const explosion = new Explosion(pos, explosionRadius, durationMs);
        this.explosions.push(explosion);
        setTimeout(() => {
            this.explosions = this.explosions.filter(e => e !== explosion);
        }, durationMs);
    }

    public renderRect(pos: Vector, size: Vector, color: string) {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not found');

        ctx.save();
        ctx.translate(-this.camera.x, -this.camera.y);
        ctx.scale(this.camera.zoom, this.camera.zoom);

        ctx.fillStyle = color;
        ctx.fillRect(
            pos.x * this.tileSize,
            pos.y * this.tileSize,
            size.x * this.tileSize,
            size.y * this.tileSize
        );

        ctx.restore();
    }
}
