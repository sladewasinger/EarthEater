import { Explosion } from "../Explosion";
import { Vector } from "../Vector";
import { GridTile } from "./GridTile";
import { Player } from "./Player";

export class GameState {
    frame: number = 0;
    grid: GridTile[][] = [];
    players: Player[] = [];
    inputs: { [key: string]: boolean } = {};
    explosions: Explosion[] = [];
    lastUpdate: number = 0;
    terrainMesh: Vector[] = [];
    isSand: boolean = false;
}
