import { Vector } from "./Vector";


export class Explosion {
    public elapsedTime: number = 0;
    public isExploded: boolean = false;

    public constructor(public position: Vector, public radius: number, public durationMs: number, public damage: number) {
    }

    get timeLeftMs() {
        return this.durationMs - this.elapsedTime;
    }

    update(dt: number) {
        this.isExploded = true;
        this.elapsedTime += dt;
    }
}
