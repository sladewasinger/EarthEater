import { GameState } from "./GameState";
import { Vector } from "./Vector";


export class Missile {
    public elapsedTime: number = 0;
    public isExploded: boolean = false;
    public initialPosition: Vector;
    public initialVelocity: Vector;

    public constructor(public position: Vector, public velocity: Vector, public radius: number) {
        this.initialPosition = position.clone();
        this.initialVelocity = velocity.clone();
    }

    update(dt: number, gameState: GameState) {
        this.elapsedTime += dt;
        if (!this.isExploded) {
            // apply gravity
            this.velocity = Vector.add(this.velocity, Vector.multiply(gameState.gravity, dt / 1000));

            // update position
            this.position = Vector.add(this.position, Vector.multiply(this.velocity, dt / 1000));

            // check for collision with terrain
            for (let i = 0; i < gameState.terrainMesh.length - 2; i++) {
                let point = gameState.terrainMesh[i];
                let nextPoint = gameState.terrainMesh[i + 1];
                if (this.isCircleOnOrBelowLineSegment(this.position, this.radius, point, nextPoint)) {
                    this.isExploded = true;
                    break;
                }
            }
        }
    }

    private isCircleOnOrBelowLineSegment(center: Vector, radius: number, start: Vector, end: Vector): boolean {
        // Helper function to find the y-coordinate of a point on the line segment at a given x
        function getYOnLineSegment(x: number, start: Vector, end: Vector): number {
            if (start.x === end.x) {
                // Vertical line segment
                return Math.min(start.y, end.y);
            }

            const slope = (end.y - start.y) / (end.x - start.x);
            const y = slope * (x - start.x) + start.y;
            return y;
        }

        // Check if circle's center lies within the extended line segment's horizontal range
        const minX = Math.min(start.x, end.x) - radius;
        const maxX = Math.max(start.x, end.x) + radius;

        if (center.x < minX || center.x > maxX) {
            // Circle's center is outside the extended line segment's horizontal range
            return false;
        }

        const yOnLineSegment = getYOnLineSegment(center.x, start, end);

        // Check if the circle is on or below the line segment considering positive y downwards
        return (center.y + radius) >= yOnLineSegment;
    }
}
