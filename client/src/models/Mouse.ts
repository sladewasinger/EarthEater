import { Camera } from "../Camera";
import { Renderer } from "../Renderer";
import { Vector } from "../Vector";
import { GameState } from "./GameState";


export class Mouse {
    position: Vector = new Vector(0, 0);
    left: boolean = false;
    right: boolean = false;
    middle: boolean = false;

    constructor(public canvas: HTMLCanvasElement) {
        canvas.addEventListener("mousemove", (e) => {
            // get true mouse position on canvas
            let rect = canvas.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;

            this.position.x = x;
            this.position.y = y;
        });

        canvas.addEventListener("mousedown", (e) => {
            if (e.button === 0) {
                this.left = true;
            }
            if (e.button === 1) {
                this.middle = true;
            }
            if (e.button === 2) {
                this.right = true;
            }
        });

        canvas.addEventListener("mouseup", (e) => {
            if (e.button === 0) {
                this.left = false;
            }
            if (e.button === 1) {
                this.middle = false;
            }
            if (e.button === 2) {
                this.right = false;
            }
        });
    }
}
