declare module "perlin-noise" {
    export class SimplexNoise {
        constructor(seed?: number);
        noise2D(x: number, y: number): number;
    }
}