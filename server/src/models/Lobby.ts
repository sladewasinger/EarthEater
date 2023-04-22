import { Player } from "./Player";


export class Lobby {
    id: string;
    players: Player[];
    owner: Player;

    constructor(id: string) {
        this.id = id;
        this.players = [];
    }
}
