
export class EngineState {
    fireDelay: number = 1000;
    fireDebounce: boolean = false;
    myPlayerId: string | undefined;
    maxMissileTimeMs: number = 5000;
    maxCanonVelocity: number = 1000;
    minCanonVelocity: number = 50;
    debug: boolean = false;
}
