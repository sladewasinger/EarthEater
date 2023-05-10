import { Engine } from "../Engine";
import { ServerPlayer } from "./ServerPlayer";


export class Lobby {
    id: string;
    players: ServerPlayer[];
    owner: ServerPlayer;
    engine: Engine;

    constructor(id: string) {
        this.id = id;
        this.players = [];
    }
}
