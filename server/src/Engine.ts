import express from "express";
import { createServer, Server } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import * as path from "path";
import cors from "cors";

export class Player {
    id: string;
    name: string;
    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }
}

export class Lobby {
    id: string;
    players: Player[];
    owner: Player;

    constructor(id: string) {
        this.id = id;
        this.players = [];
    }
}

export class Engine {
    app: express.Application;
    server: Server;
    io: SocketIOServer;
    players: Player[] = [];
    lobbies: Lobby[] = [];
    lobbyIdCounter: number = 0;

    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.io = new SocketIOServer(this.server, {
            cors: {
                origin: [
                    "http://localhost:5173",
                    "https://sladewasinger.github.io/EarthEater"
                ],
                methods: ["GET", "POST"],
            },
        });
        this.configure();
        this.bindEvents();

        const port = process.env.PORT || 3000;
        this.server.listen(port, () => {
            console.log(`Server started on port ${port}`);
        });
    }

    private configure(): void {
        // Configure express middleware, routes, etc.
        this.app.get('/', (req, res) => {
            res.send('Welcome to the server. There is nothing to see here.')
        })
    }

    private bindEvents(): void {
        this.io.on("connection", (socket: Socket) => {
            console.log("New client connected");
            const player = new Player(socket.id, "Player");
            this.players.push(player);

            // Handle socket events here
            socket.on("event", (data: any) => {
                console.log("Received data:", data);
                // Broadcast the data to all clients
                this.io.emit("event", data);
            });

            socket.on("disconnect", () => {
                console.log("Client disconnected");
                this.players = this.players.filter((player) => player.id !== socket.id);
                this.lobbies.forEach((lobby) => {
                    lobby.players = lobby.players.filter((player) => player.id !== socket.id);
                });
            });

            socket.on("createLobby", (data: any, callback) => {
                const player = this.players.find((player) => player.id === socket.id);
                const lobby = new Lobby((this.lobbyIdCounter++).toString());
                lobby.players.push(player);
                lobby.owner = player;
                this.lobbies.push(lobby);
                callback(lobby);
            });
        });
    }
}

