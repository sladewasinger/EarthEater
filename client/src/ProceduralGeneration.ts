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
            grid = ProceduralGeneration.smoothGrid(grid);
        }

        // Combine small clusters into larger caves
        grid = ProceduralGeneration.combineClusters(grid);

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

    static smoothGrid(grid: boolean[][]) {
        const newGrid = JSON.parse(JSON.stringify(grid));
        const height = grid.length;
        const width = grid[0].length;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let neighbors = ProceduralGeneration.countNeighbors(grid, x, y);
                if (neighbors > 4) {
                    newGrid[y][x] = true;
                } else if (neighbors < 4) {
                    newGrid[y][x] = false;
                }
            }
        }

        return newGrid;
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

    static combineClusters(grid: boolean[][]) {
        const visited = grid.map(row => row.map(() => false));
        const height = grid.length;
        const width = grid[0].length;

        const clusters = [];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (!visited[y][x] && grid[y][x]) {
                    const cluster = <any>[];
                    ProceduralGeneration.dfs(grid, visited, x, y, cluster);
                    clusters.push(cluster);
                }
            }
        }

        const minClusterSize = 25; // Adjust this value to control the minimum cave size
        const connectedClusters = ProceduralGeneration.connectClusters(clusters, minClusterSize);

        const newGrid = grid.map(row => row.map(() => false));

        for (const cluster of connectedClusters) {
            for (const cell of cluster) {
                newGrid[cell.y][cell.x] = true;
            }
        }

        return newGrid;
    }

    static dfs(grid: boolean[][], visited: boolean[][], x: number, y: number, cluster: { x: number; y: number }[]) {
        if (x < 0 || y < 0 || x >= grid[0].length || y >= grid.length || visited[y][x] || !grid[y][x]) {
            return;
        }

        visited[y][x] = true;
        cluster.push({ x, y });

        ProceduralGeneration.dfs(grid, visited, x - 1, y, cluster);
        ProceduralGeneration.dfs(grid, visited, x + 1, y, cluster);
        ProceduralGeneration.dfs(grid, visited, x, y - 1, cluster);
        ProceduralGeneration.dfs(grid, visited, x, y + 1, cluster);
    }

    static connectClusters(clusters: { x: number; y: number }[][], minClusterSize: number) {
        const largeClusters = clusters.filter(cluster => cluster.length >= minClusterSize);
        const smallClusters = clusters.filter(cluster => cluster.length < minClusterSize);

        for (const smallCluster of smallClusters) {
            let closestClusterIndex = -1;
            let closestDistance = Infinity;

            for (let i = 0; i < largeClusters.length; i++) {
                const distance = ProceduralGeneration.clusterDistance(smallCluster, largeClusters[i]);

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestClusterIndex = i;
                }
            }

            if (closestClusterIndex >= 0) {
                largeClusters[closestClusterIndex].push(...smallCluster);
            }
        }

        return largeClusters;
    }

    static clusterDistance(cluster1: { x: number; y: number }[], cluster2: { x: number; y: number }[]) {
        let minDistance = Infinity;

        for (const cell1 of cluster1) {
            for (const cell2 of cluster2) {
                const distance = Math.sqrt(Math.pow(cell1.x - cell2.x, 2) + Math.pow(cell1.y - cell2.y, 2));
                if (distance < minDistance) {
                    minDistance = distance;
                }
            }
        }

        return minDistance;
    }
}

