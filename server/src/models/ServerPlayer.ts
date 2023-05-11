import { Player } from "../../../shared/Player";
import { Socket } from "socket.io";

export class ServerPlayer extends Player {
    socketId: string;
    socket: Socket;
    hasFired: boolean = false;

    constructor(socketId: string, name: string, socket: Socket) {
        super(socketId, name);
        this.socketId = socketId;
        this.socket = socket;
    }
}