import { Dynamite } from "./Dynamite";
import { GridTile } from "./GridTile";
import { Player } from "./Player";

export class GameState {
    frame: number = 0;
    grid: GridTile[][] = [];
    player: Player = new Player();
    inputs: { [key: string]: boolean } = {};
    dynamites: Dynamite[] = [];
    lastUpdate: number = 0;
}
