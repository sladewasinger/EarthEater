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

    static multiply(a: Vector, n: number) {
        return new Vector(a.x * n, a.y * n);
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

    static distanceToLineSegment(v: Vector, p1: Vector, p2: Vector) {
        let l2 = Vector.distance(p1, p2);
        if (l2 == 0) return Vector.distance(v, p1);
        let t = ((v.x - p1.x) * (p2.x - p1.x) + (v.y - p1.y) * (p2.y - p1.y)) / l2;
        if (t < 0) return Vector.distance(v, p1);
        if (t > 1) return Vector.distance(v, p2);
        return Vector.distance(v, new Vector(p1.x + t * (p2.x - p1.x), p1.y + t * (p2.y - p1.y)));
    }

    magnitudeSquared() {
        return this.x ** 2 + this.y ** 2;
    }

    static distanceSquared(a: Vector, b: Vector): number {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return dx ** 2 + dy ** 2;
    }

    static dot(a: Vector, b: Vector) {
        return a.x * b.x + a.y * b.y;
    }
}
