import { Vector } from "./Vector";

export class Player {
    id: string;
    position: Vector = new Vector(0, 0);
    hitBox: Vector = new Vector(25, 15);
    health: number = 100;
    color: string = '#00ff00';
    facingAngle: number = 0;
    moveDebounce: boolean = false;
    moveFrameDelay: number = 10;
    lastMoveFrame: number = 0;

    constructor(id: string) {
        this.id = id;
    }
}
