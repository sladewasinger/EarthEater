import { Vector } from "./Vector";

export class Player {
    id: string;
    name: string;
    position: Vector = new Vector(0, 0);
    hitBox: Vector = new Vector(25, 15);
    health: number = 100;
    color: string = '#00ff00';
    facingAngle: number = 3 * Math.PI / 2;
    canonLength: number = 20;
    power: number = 500;
    exploded: boolean = false;

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }

    public getCanonTipPosition() {
        // let pos = Vector.add(this.myPlayer.position.clone(), new Vector(this.myPlayer.hitBox.x / 2, this.myPlayer.hitBox.y / 2));
        //     pos = Vector.add(pos, Vector.fromAngle(this.myPlayer.facingAngle, 10));
        return new Vector(
            this.position.x + this.hitBox.x / 2 + this.canonLength * 0.1 * Math.cos(this.facingAngle),
            this.position.y + this.hitBox.y / 2 + this.canonLength * 0.1 * Math.sin(this.facingAngle)
        )
    }

    public getCanonTipVelocity() {
        return Vector.fromAngle(this.facingAngle, this.power);
    }

    get isDead() {
        return this.health <= 0;
    }
}
