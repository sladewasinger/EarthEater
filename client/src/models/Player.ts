import { Camera } from "../Camera";
import { Renderer } from "../Renderer";
import { Vector } from "../Vector";
import { GameState } from "./GameState";
import { MathUtils } from "./MathUtils";
import { Mouse } from "./Mouse";

export class Player {
    position: Vector = new Vector(0, 0);
    facingAngle: number = 0;
    moveDebounce: boolean = false;
    moveFrameDelay: number = 10;
    lastMoveFrame: number = 0;

    move(gameState: GameState, mouse: Mouse, renderer: Renderer) {
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

        const playerCenter = new Vector(
            this.position.x + 0.5,
            this.position.y + 0.5
        );
        const mouseWorldPosition = mouse.getWorldPosition(renderer);
        const rawAngle = Vector.angleBetween(playerCenter, mouseWorldPosition);
        this.facingAngle = MathUtils.snapToNearestAngle(
            rawAngle,
            Math.PI / 4
        );

        // Print debug informationw
        console.log('Player position:', this.position);
        console.log('Player center:', playerCenter);
        console.log('Mouse position:', mouseWorldPosition);
        console.log('Raw angle:', rawAngle);
        console.log('Facing angle:', this.facingAngle);

        if (vector.x !== 0 || vector.y !== 0 && !this.moveDebounce) {
            let nextPos = Vector.add(new Vector(this.position.x, this.position.y), vector);

            vector = Vector.normalize(vector);

            if (gameState.frame - this.lastMoveFrame > this.moveFrameDelay && gameState.grid[nextPos.y][nextPos.x].type === "air") {
                this.lastMoveFrame = gameState.frame;
                this.position.x = nextPos.x;
                this.position.y = nextPos.y;
            }
        }
    }
}
