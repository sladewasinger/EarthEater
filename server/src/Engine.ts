import express from "express";
import { createServer, Server } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import * as path from "path";
import cors from "cors";

export class Engine {
    app: express.Application;
    server: Server;
    io: SocketIOServer;

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
        //this.app.use(cors({ origin: 'http://localhost:3010', methods: ['GET', 'POST'] }));
        this.app.get('/', (req, res) => {
            res.send('Welcome to the server. There is nothing to see here.')
        })
    }

    private bindEvents(): void {
        this.io.on("connection", (socket: Socket) => {
            console.log("New client connected");

            // Handle socket events here
            socket.on("event", (data: any) => {
                console.log("Received data:", data);
                // Broadcast the data to all clients
                this.io.emit("event", data);
            });

            socket.on("disconnect", () => {
                console.log("Client disconnected");
            });
        });
    }
}

// setup socket io server

