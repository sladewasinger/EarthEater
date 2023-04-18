import { Vector } from "./models/Vector";


export class Camera {
    x: number = 0;
    y: number = 0;
    zoom: number = 1;
    panning: boolean = false;
    panStart: Vector = new Vector(0, 0);
    panSpeed: number = 1;

    constructor() {
        window.addEventListener('wheel', (e) => {
            const previousZoom = this.zoom;
            if (e.deltaY < 0) {
                this.zoom *= 1.1;
                this.zoom = Math.min(this.zoom, 4);
            } else {
                this.zoom /= 1.1;
                this.zoom = Math.max(this.zoom, 0.5);
            }

            // Calculate the mouse position based on previous zoom
            const mouseXWorld = e.clientX / previousZoom;
            const mouseYWorld = e.clientY / previousZoom;

            // Calculate the mouse position based on current zoom
            const mouseXWorldNew = e.clientX / this.zoom;
            const mouseYWorldNew = e.clientY / this.zoom;

            // Update the camera position based on the new zoom level and mouse position
            this.x += (mouseXWorld - mouseXWorldNew);
            this.y += (mouseYWorld - mouseYWorldNew);
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === 2) {
                this.panning = true;
                this.panStart.x = e.clientX;
                this.panStart.y = e.clientY;
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 2) {
                this.panning = false;
            }
        });

        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (this.panning) {
                let dx = e.clientX - this.panStart.x;
                let dy = e.clientY - this.panStart.y;
                this.panStart.x = e.clientX;
                this.panStart.y = e.clientY;
                this.x -= dx * this.panSpeed;
                this.y -= dy * this.panSpeed;
            }
        });
    }
}
