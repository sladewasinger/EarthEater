import { GameState } from "./GameState";
import { Vector } from "./Vector";

export class Missile {
    public elapsedTime: number = 0;
    public isExploded: boolean = false;
    public initialPosition: Vector;
    public initialVelocity: Vector;

    public constructor(public position: Vector, public velocity: Vector, public radius: number, public explosionRadius: number, public damage: number) {
        this.initialPosition = position.clone();
        this.initialVelocity = velocity.clone();
    }

    update(dt: number, gameState: GameState) {
        this.elapsedTime += dt;
        if (!this.isExploded) {
            // apply gravity
            this.velocity = Vector.add(this.velocity, Vector.multiply(gameState.gravity, dt / 1000));

            // apply wind
            this.velocity = Vector.add(this.velocity, Vector.multiply(gameState.wind, dt / 1000));

            // update position
            this.position = Vector.add(this.position, Vector.multiply(this.velocity, dt / 1000));

            // check for collision with terrain
            if (this.isInsideOrBelowTerrain(this.position, gameState.terrainMesh)) {
                this.isExploded = true;
                return;
            }

            for (let i = 0; i < gameState.terrainMesh.length - 2; i++) {
                let point = gameState.terrainMesh[i];
                let nextPoint = gameState.terrainMesh[i + 1];
                if (this.isCircleOnOrBelowLineSegment(this.position, this.radius, point, nextPoint)) {
                    this.isExploded = true;
                    break;
                }
            }

            // check for collision with players
            for (let i = 0; i < gameState.players.length; i++) {
                let player = gameState.players[i];
                if (i == gameState.currentPlayerIndex || player.isDead) {
                    // don't collide with self
                    continue;
                }

                // check if circle overlaps square
                if (this.isCircleOnOrBelowLineSegment(this.position, this.radius, player.position, new Vector(player.position.x + player.hitBox.x, player.position.y))) {
                    this.isExploded = true;
                    break;
                }
            }
        }
    }

    private isInsideOrBelowTerrain(position: Vector, terrainMesh: Vector[]): boolean {
        for (let i = 0; i < terrainMesh.length - 1; i++) {
            const start = terrainMesh[i];
            const end = terrainMesh[i + 1];
            if (position.x >= start.x && position.x <= end.x && position.y >= start.y) {
                return true;
            }
        }
        return false;
    }

    private isCircleOnOrBelowLineSegment(center: Vector, radius: number, start: Vector, end: Vector): boolean {
        const lineVector = Vector.subtract(end, start);
        const pointVector = Vector.subtract(center, start);
        const lineLengthSquared = lineVector.magnitudeSquared();
        const dotProduct = Vector.dot(pointVector, lineVector);
        const t = Math.max(0, Math.min(1, dotProduct / lineLengthSquared));

        const closestPointOnLine = Vector.add(start, Vector.multiply(lineVector, t));
        const distanceSquared = Vector.distanceSquared(center, closestPointOnLine);

        return distanceSquared <= radius ** 2;
    }
}
