import { Engine } from "../Engine";
import { Player } from "../../../shared/Player";


export class Lobby {
    id: string;
    players: Player[];
    owner: Player;
    engine: Engine;

    constructor(id: string) {
        this.id = id;
        this.players = [];
    }
}
