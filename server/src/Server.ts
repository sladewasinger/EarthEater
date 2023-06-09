import express from "express";
import { createServer, Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { Lobby } from "./models/Lobby";
import { SocketResponse } from "../../shared/SocketResponse";
import { Engine } from "./Engine";
import { ServerPlayer } from "./models/ServerPlayer";

export class Server {
    app: express.Application;
    server: HttpServer;
    io: SocketIOServer;
    players: ServerPlayer[] = [];
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
            res.send('Welcome to the server. There is nothing to see here.');
        });
    }

    private bindEvents(): void {
        this.io.on("connection", (socket: Socket) => {

            console.log("New client connected");
            const player = new ServerPlayer(socket.id, "Player", socket);
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

            socket.on("leaveLobbies", () => {
                console.log("leaveLobby");
                const player = this.players.find((player) => player.id === socket.id);
                for (let i = 0; i < this.lobbies.length; i++) {
                    const lobby = this.lobbies[i];
                    if (lobby.players.find((p) => p.id === player.id)) {
                        lobby.players = lobby.players.filter((p) => p.id !== player.id);
                        if (lobby.players.length === 0) {
                            this.lobbies.splice(i, 1);
                        }
                    }
                }
            });

            socket.on("createLobby", (data: any, callback) => {
                console.log("createLobby");
                const player = this.players.find((player) => player.id === socket.id);

                if (!player) {
                    callback(SocketResponse.error("Player not found"));
                    return;
                }

                const playerInDiffLobby = this.lobbies
                    .find((lobby) => lobby.players.find((p) => p.id === player.id));
                if (playerInDiffLobby) {
                    callback(SocketResponse.error("Player already in a lobby"));
                    return;
                }

                const lobby = new Lobby((this.lobbyIdCounter++).toString());
                lobby.players.push(player);
                lobby.owner = player;
                this.lobbies.push(lobby);
                callback(SocketResponse.success(lobby.id));
            });

            socket.on('joinLobby', (data: any, callback) => {
                console.log("Received lobbyId:", data);
                const player = this.players.find((player) => player.id === socket.id);
                const lobby = this.lobbies.find((lobby) => lobby.id === data.lobbyId);

                if (!lobby) {
                    callback(SocketResponse.error("Lobby not found"));
                    return;
                }

                const playerInDiffLobby = this.lobbies
                    .filter(l => l.id !== lobby.id)
                    .find((lobby) => lobby.players.find((p) => p.id === player.id));
                if (playerInDiffLobby) {
                    callback(SocketResponse.error("Player is already in a different lobby"));
                    return;
                }

                // check if player is already in lobby
                if (lobby.players.find((p) => p.id === player.id)) {
                    callback(SocketResponse.success(lobby.id));
                    return;
                }

                console.log(`Player '${player.name}' joined lobby ${lobby.id}`);
                lobby.players.push(player);
                callback(SocketResponse.success(lobby.id));
            });

            socket.on('startGame', (data: any, callback) => {
                const player = this.players.find((player) => player.id === socket.id);
                const lobby = this.lobbies.find((lobby) => lobby.players.find((p) => p.id === player.id));
                if (!player) {
                    callback(SocketResponse.error("Player not found"));
                    return;
                }
                if (!lobby) {
                    callback(SocketResponse.error("Lobby not found"));
                    return;
                }
                if (lobby.owner.id !== player.id) {
                    callback(SocketResponse.error("Player is not the owner of the lobby"));
                    return;
                }

                if (lobby && lobby.owner.id === player.id && lobby.engine === undefined) {
                    lobby.engine = new Engine();
                    lobby.engine.start(lobby.players);
                    console.log('starting game')
                    callback(SocketResponse.success(lobby.id));
                } else {
                    callback(SocketResponse.error("Lobby not found"));
                }
            });

            socket.on('keyDown', (key: any) => {
                const player = this.players.find((player) => player.id === socket.id);
                const lobby = this.lobbies.find((lobby) => lobby.players.find((p) => p.id === player.id));
                if (lobby && player) {
                    lobby.engine?.handleKeyDown(key, player);
                }
            });

            socket.on('keyUp', (data: any) => {
                const player = this.players.find((player) => player.id === socket.id);
                const lobby = this.lobbies.find((lobby) => lobby.players.find((p) => p.id === player.id));
                if (lobby && player) {
                    lobby.engine?.handleKeyUp(data, player);
                }
            });

            socket.on('fire', (data: any) => {
                const player = this.players.find((player) => player.id === socket.id);
                const lobby = this.lobbies.find((lobby) => lobby.players.find((p) => p.id === player.id));
                if (!lobby || !player) {
                    console.log('fire: lobby or player not found');
                    return;
                }
                lobby.engine?.handleFire(player);
            });

            socket.on('getMyPlayerId', (data: any, callback) => {
                const player = this.players.find((player) => player.id === socket.id);
                if (!player) {
                    callback(SocketResponse.error("Player not found"));
                    return;
                }
                callback(SocketResponse.success(player.id));
            });
        });

        this.io.on("disconnect", () => {
        });
    }
}
