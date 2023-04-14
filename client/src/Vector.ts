export class Vector {
    constructor(public x: number, public y: number) { }

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
}
