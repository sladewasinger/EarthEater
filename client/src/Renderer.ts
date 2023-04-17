import { Camera } from "./Camera";
import { Explosion } from "./Explosion";
import { Vector } from "./Vector";
import { GameState } from "./models/GameState";

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
        let worldPos = Vector.add(pos, new Vector(this.camera.x, this.camera.y));
        worldPos = Vector.divideN(worldPos, this.camera.zoom);
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
        this.renderTerrainMesh(ctx, gameState.terrainMesh);
        this.renderPLayers(ctx, gameState);
    }

    private adjustToCamera(ctx: CanvasRenderingContext2D) {
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.camera.x, -this.camera.y);
    }

    private renderTerrainMesh(ctx: CanvasRenderingContext2D, terrainMesh: Vector[]) {
        ctx.save();
        this.adjustToCamera(ctx);

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(terrainMesh[0].x, terrainMesh[0].y);
        for (let i = 1; i < terrainMesh.length; i++) {
            ctx.lineTo(terrainMesh[i].x, terrainMesh[i].y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    private renderPLayers(ctx: CanvasRenderingContext2D, gameState: GameState) {
        for (let player of gameState.players) {
            // draw tank as square
            ctx.save();
            this.adjustToCamera(ctx);

            ctx.translate(player.position.x, player.position.y);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(0, 0, player.hitBox.x, player.hitBox.y);

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
        ctx.translate(-this.camera.x, -this.camera.y);
        ctx.scale(this.camera.zoom, this.camera.zoom);

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
