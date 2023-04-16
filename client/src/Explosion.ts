import { Vector } from "./Vector";


export class Explosion {
    public elapsedTime: number = 0;
    public constructor(public position: Vector, public radius: number, public durationMs: number) {
    }

    get timeLeftMs() {
        return this.durationMs - this.elapsedTime;
    }

    update(dt: number) {
        this.elapsedTime += dt;
    }
}
