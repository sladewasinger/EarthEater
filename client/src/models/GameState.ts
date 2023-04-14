import { GridTile } from "./GridTile";
import { Player } from "./Player";

export class GameState {
    grid: GridTile[][] = [];
    player: Player = new Player();
    inputs: { [key: string]: boolean } = {};
}
