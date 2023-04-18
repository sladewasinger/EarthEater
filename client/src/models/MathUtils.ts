import { Vector } from "./Vector";

export class MathUtils {
    static snapToNearestAngle(angle: number, subAngle: number) {
        return Math.round(angle / subAngle) * subAngle;
    }

    static random(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    static mulberry32(a: number) {
        return function () {
            var t = a += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    }

    static clamp(n: number, min: number, max: number): number {
        return Math.min(Math.max(n, min), max);
    }

    static circleCollidesWithBox(center: Vector, radius: number, boxPosition: Vector, boxSize: Vector) {
        let closestPoint = new Vector(MathUtils.clamp(center.x, boxPosition.x, boxPosition.x + boxSize.x), MathUtils.clamp(center.y, boxPosition.y, boxPosition.y + boxSize.y));
        return Vector.distance(center, closestPoint) < radius;
    }
}
