export class Vector {
    constructor(public x: number, public y: number) { }

    clone() {
        return new Vector(this.x, this.y);
    }

    static add(a: Vector, b: Vector) {
        return new Vector(a.x + b.x, a.y + b.y);
    }

    static subtract(a: Vector, b: Vector) {
        return new Vector(a.x - b.x, a.y - b.y);
    }

    static multiply(a: Vector, b: Vector) {
        return new Vector(a.x * b.x, a.y * b.y);
    }

    static divide(a: Vector, b: Vector) {
        return new Vector(a.x / b.x, a.y / b.y);
    }

    static divideN(a: Vector, n: number) {
        return new Vector(a.x / n, a.y / n);
    }

    static distance(a: Vector, b: Vector) {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }

    static scale(a: Vector, b: number) {
        return new Vector(a.x * b, a.y * b);
    }

    static normalize(a: Vector) {
        let length = Math.sqrt(a.x * a.x + a.y * a.y);
        return new Vector(a.x / length, a.y / length);
    }

    static fromAngle(facingAngle: number, length: number = 1): Vector {
        return new Vector(Math.cos(facingAngle) * length, Math.sin(facingAngle) * length);
    }

    static angleBetween(v1: Vector, v2: Vector): number {
        return Math.atan2(v2.y - v1.y, v2.x - v1.x);
    }

    static snapToNearestAngle(v: Vector, subAngle: number): Vector {
        let angle = Vector.angleBetween(new Vector(0, 0), v);
        let snappedAngle = Math.round(angle / subAngle) * subAngle;
        return Vector.fromAngle(snappedAngle, Vector.distance(new Vector(0, 0), v));
    }

    static round(pos: Vector): Vector {
        return new Vector(Math.round(pos.x), Math.round(pos.y));
    }

    static lerp(v1: Vector, v2: Vector, amount: number) {
        return new Vector(v1.x + (v2.x - v1.x) * amount, v1.y + (v2.y - v1.y) * amount);
    }
}
