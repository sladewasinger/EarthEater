import { Camera } from "./Camera";
import { Explosion } from "./models/Explosion";
import { Vector } from "./models/Vector";
import { GameState } from "./models/GameState";
import { MathUtils } from "./models/MathUtils";

export class Renderer {
    canvas: HTMLCanvasElement;
    camera: Camera = new Camera();
    images: { [key: string]: HTMLImageElement } = {};
    explosions: Explosion[] = [];

    constructor() {
        this.canvas = document.createElement('canvas');
        document.body.appendChild(this.canvas);
        window.addEventListener('resize', () => this.resize());
        this.resize();
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
        this.renderGradientBackground(ctx);
        this.renderSun(ctx);
        this.renderTerrainMesh(ctx, gameState);
        this.renderPLayers(ctx, gameState);
    }

    private adjustToCamera(ctx: CanvasRenderingContext2D) {
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.camera.x, -this.camera.y);
    }

    private renderGradientBackground(ctx: CanvasRenderingContext2D) {
        ctx.save();

        let grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grd.addColorStop(0, "#8ED6FF");
        grd.addColorStop(1, "#004CB3");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.restore();
    }

    private renderSun(ctx: CanvasRenderingContext2D) {
        ctx.save();

        ctx.fillStyle = "#ffff00";
        ctx.beginPath();
        ctx.arc(610, 180, 100, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();
    }

    private renderClouds(ctx: CanvasRenderingContext2D) {
        ctx.save();

        // draw circles to form clouds
        ctx.fillStyle = "#ffffff";

        const mulberryRandom = MathUtils.mulberry32(1234);

        for (let i = 0; i < 10; i++) {
            let x = mulberryRandom() * this.canvas.width;
            let y = mulberryRandom() * this.canvas.height;
            let radius = mulberryRandom() * 100;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fill();
        }

        ctx.restore();
    }

    private renderTerrainMesh(ctx: CanvasRenderingContext2D, gameState: GameState) {
        let terrainMesh = gameState.terrainMesh;

        ctx.save();
        this.adjustToCamera(ctx);

        // darker beige
        ctx.fillStyle = "#d2b48c";
        ctx.beginPath();
        ctx.moveTo(terrainMesh[0].x, terrainMesh[0].y);
        for (let i = 1; i < terrainMesh.length; i++) {
            ctx.lineTo(terrainMesh[i].x, terrainMesh[i].y);
        }
        ctx.closePath();
        ctx.fill();

        // draw rect around world bounds
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 5;
        ctx.strokeRect(0, 0, gameState.worldWidth, gameState.worldHeight);

        ctx.restore();
    }

    private renderPLayers(ctx: CanvasRenderingContext2D, gameState: GameState) {
        for (let player of gameState.players) {
            // draw tank as square
            ctx.save();
            this.adjustToCamera(ctx);

            ctx.translate(player.position.x, player.position.y);
            ctx.fillStyle = player.color;
            ctx.fillRect(0, 0, player.hitBox.x, player.hitBox.y);

            // draw player health bar
            let R = (1 - player.health / 100) * 255;
            let G = 255 - R;
            ctx.fillStyle = `rgb(${R}, ${G}, 0)`;
            ctx.fillRect(0, -10, player.hitBox.x, 5);

            // draw player canon
            ctx.translate(player.hitBox.x / 2, player.hitBox.y / 2);
            ctx.rotate(player.facingAngle);
            ctx.fillStyle = '#000000';
            ctx.fillRect(-5, -5, 20, 10);

            ctx.restore();
        }
    }

    public renderCircle(position: Vector, radius: number, color: string) {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not found');

        ctx.save();
        this.adjustToCamera(ctx);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();
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
