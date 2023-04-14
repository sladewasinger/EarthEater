import { Vector } from "../Vector";
import { GameState } from "./GameState";

export class Player {
    x: number = 0;
    y: number = 0;
    facingAngle: number = 0;
    moveDebounce: boolean = false;

    move(gameState: GameState) {
        if (this.moveDebounce) {
            return;
        }

        let vector = new Vector(0, 0);

        if (gameState.inputs["w"]) {
            vector.y -= 1;
        }
        if (gameState.inputs["s"]) {
            vector.y += 1;
        }
        if (gameState.inputs["a"]) {
            vector.x -= 1;
        }
        if (gameState.inputs["d"]) {
            vector.x += 1;
        }

        if (vector.x !== 0 || vector.y !== 0) {
            vector = Vector.normalize(vector);
            this.facingAngle = Math.atan2(vector.y, vector.x);
        }

        if (gameState.inputs[" "]) {
            this.moveDebounce = true;
            let nextPos = new Vector(
                Math.round(Math.cos(this.facingAngle)),
                Math.round(Math.sin(this.facingAngle))
            );
            nextPos = Vector.add(new Vector(this.x, this.y), nextPos);
            if (gameState.grid[nextPos.y][nextPos.x].type === "air") {
                this.x = nextPos.x;
                this.y = nextPos.y;
            }
        }
    }
}
