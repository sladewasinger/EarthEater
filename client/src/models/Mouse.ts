import { Vector } from "../../../shared/Vector";

export class Mouse {
    position: Vector = new Vector(0, 0);
    left: boolean = false;
    right: boolean = false;
    middle: boolean = false;

    constructor(public canvas: HTMLCanvasElement) {

        canvas.addEventListener("mousemove", this.mousemove.bind(this));

        canvas.addEventListener("mousedown", this.mousedown.bind(this));

        canvas.addEventListener("mouseup", this.mouseup.bind(this));
    }

    private mouseup(e: MouseEvent) {
        if (e.button === 0) {
            this.left = false;
        }
        if (e.button === 1) {
            this.middle = false;
        }
        if (e.button === 2) {
            this.right = false;
        }
    }

    private mousedown(e: MouseEvent) {
        if (e.button === 0) {
            this.left = true;
        }
        if (e.button === 1) {
            this.middle = true;
        }
        if (e.button === 2) {
            this.right = true;
        }
    }

    private mousemove(e: MouseEvent) {
        let rect = this.canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        this.position.x = x;
        this.position.y = y;
    }

    delete() {
        this.canvas.removeEventListener("mousemove", this.mousemove.bind(this));
        this.canvas.removeEventListener("mousedown", this.mousedown.bind(this));
        this.canvas.removeEventListener("mouseup", this.mouseup.bind(this));
    }
}
