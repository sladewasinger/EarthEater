import { Vector } from "./Vector";
import { Player } from "./Player";


export class Dynamite {
    elapsedTimeMs: number = 0;
    exploded: boolean = false;

    constructor(public pos: Vector, public fuseMs: number, public owner: Player) { }

    update(dt: number) {
        this.elapsedTimeMs += dt;
        if (this.elapsedTimeMs > this.fuseMs) {
            this.exploded = true;
        }
    }
}
