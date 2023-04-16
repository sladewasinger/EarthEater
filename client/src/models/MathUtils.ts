
export class MathUtils {
    static snapToNearestAngle(angle: number, subAngle: number) {
        return Math.round(angle / subAngle) * subAngle;
    }
}
