import { Explosion } from "./Explosion";
import { Missile } from "./Missile";
import { Vector } from "./Vector";
import { Player } from "./Player";

export class GameState {
    frame: number = 0;
    players: Player[] = [];
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
