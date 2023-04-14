import { Camera } from "./Camera";
import { GameState } from "./models/GameState";

export class Renderer {
    canvas: HTMLCanvasElement;
    camera: Camera = new Camera();
    tileSize: number = 16;
    images: { [key: string]: HTMLImageElement } = {};

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
        return new Promise<void>((resolve, reject) => {
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
        this.drawTiles(gameState, ctx);
        this.drawPlayer(ctx, gameState);
    }

    private drawTiles(gameState: GameState, ctx: CanvasRenderingContext2D) {
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
                    const overlap = 1; // Overlap by 1 pixel to cover gaps
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
        const playerX = Math.round(gameState.player.x * this.tileSize);
        const playerY = Math.round(gameState.player.y * this.tileSize);
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
        ctx.lineTo(playerX + playerSize / 2 + Math.cos(gameState.player.facingAngle) * playerSize / 2, playerY + playerSize / 2 + Math.sin(gameState.player.facingAngle) * playerSize / 2);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.stroke();

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
}
