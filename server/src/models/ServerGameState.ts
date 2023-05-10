import { Explosion } from "../../../shared/Explosion";
import { Missile } from "../../../shared/Missile";
import { Vector } from "../../../shared/Vector";
import { ServerPlayer } from "./ServerPlayer";

export class ServerGameState {
    frame: number = 0;
    players: ServerPlayer[] = [];
    explosions: Explosion[] = [];
    missiles: Missile[] = [];
    lastUpdate: number = 0;
    terrainMesh: Vector[] = [];
    isSand: boolean = false;
    worldWidth: number = 1500;
    worldHeight: number = 1000;
    gravity: Vector = new Vector(0, 450);
    wind: Vector = new Vector(5, 0);
    currentPlayerIndex: number = 0;
}
