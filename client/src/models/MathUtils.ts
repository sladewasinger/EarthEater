
export class MathUtils {
    static snapToNearestAngle(angle: number, subAngle: number) {
        return Math.round(angle / subAngle) * subAngle;
    }

    static random(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }
}
