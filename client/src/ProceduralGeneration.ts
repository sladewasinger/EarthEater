import { GridTile } from "./models/GridTile";


export class ProceduralGeneration {
    static generateCave(width: number, height: number, fillRatio: number, smoothness: number) {
        let grid: boolean[][] = [];

        // Initialize the grid with random tiles
        for (let i = 0; i < height; i++) {
            grid[i] = [];

            for (let j = 0; j < width; j++) {
                grid[i][j] = Math.random() < fillRatio;
            }
        }

        // Apply several rounds of smoothing
        for (let i = 0; i < smoothness; i++) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    let neighbors = ProceduralGeneration.countNeighbors(grid, x, y);
                    if (neighbors > 4) {
                        grid[y][x] = true;
                    } else if (neighbors < 4) {
                        grid[y][x] = false;
                    }
                }
            }
        }

        // Convert the boolean grid to a GridTile[][] grid
        let tiles: GridTile[][] = [];
        for (let y = 0; y < height; y++) {
            tiles[y] = [];
            for (let x = 0; x < width; x++) {
                let tile = new GridTile();
                tile.type = grid[y][x] ? "air" : "stone";
                tiles[y][x] = tile;
            }
        }

        return tiles;
    }

    static countNeighbors(grid: boolean[][], x: number, y: number) {
        let count = 0;
        for (let j = y - 1; j <= y + 1; j++) {
            for (let i = x - 1; i <= x + 1; i++) {
                if (i >= 0 && j >= 0 && i < grid[0].length && j < grid.length && !(i === x && j === y)) {
                    count += grid[j][i] ? 1 : 0;
                }
            }
        }
        return count;
    }
}
