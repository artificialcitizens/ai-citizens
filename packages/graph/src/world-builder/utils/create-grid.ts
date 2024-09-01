export type Direction = "north" | "south" | "east" | "west";

export type DirectionInfo = {
  neighborId: string | null;
  blocked: boolean;
  description: string;
};

export type Cell = {
  id: string;
  x: number;
  y: number;
  directions: Record<Direction, DirectionInfo>;
};

export class Grid {
  protected grid: Cell[][];

  constructor(public width: number, public height: number) {
    this.grid = this.createGrid();
  }

  protected getRowLetter(index: number): string {
    return String.fromCharCode(65 + index); // 65 is the ASCII code for 'A'
  }

  protected createGrid(): Cell[][] {
    const grid: Cell[][] = [];

    for (let y = 0; y < this.height; y++) {
      const row: Cell[] = [];
      const rowLetter = this.getRowLetter(y);
      for (let x = 0; x < this.width; x++) {
        const columnNumber = x + 1;
        const id = `${rowLetter}${columnNumber}`;
        row.push({
          id,
          x,
          y,
          directions: this.initializeDirections(x, y),
        });
      }
      grid.push(row);
    }

    return grid;
  }

  public getGrid(): Cell[][] {
    return this.grid;
  }

  public getCell(x: number, y: number): Cell | undefined {
    return this.grid[y]?.[x];
  }

  public updateDirection(
    cellId: string,
    direction: Direction,
    update: Partial<DirectionInfo>
  ): void {
    const cell = this.findCellById(cellId);
    if (cell) {
      cell.directions[direction] = { ...cell.directions[direction], ...update };

      // Update the neighboring cell's opposite direction
      const neighborId = cell.directions[direction].neighborId;
      if (neighborId) {
        const neighborCell = this.findCellById(neighborId);
        if (neighborCell) {
          const oppositeDirection = this.getOppositeDirection(direction);
          neighborCell.directions[oppositeDirection] = {
            ...neighborCell.directions[oppositeDirection],
            ...update,
            neighborId: cellId,
          };
        }
      }
    }
  }

  private getOppositeDirection(direction: Direction): Direction {
    switch (direction) {
      case "north":
        return "south";
      case "south":
        return "north";
      case "east":
        return "west";
      case "west":
        return "east";
    }
  }

  protected findCellById(id: string): Cell | undefined {
    for (const row of this.grid) {
      for (const cell of row) {
        if (cell.id === id) return cell;
      }
    }
    return undefined;
  }

  protected initializeDirections(
    x: number,
    y: number
  ): Record<Direction, DirectionInfo> {
    return {
      north: this.getDirectionInfo(x, y - 1),
      south: this.getDirectionInfo(x, y + 1),
      east: this.getDirectionInfo(x + 1, y),
      west: this.getDirectionInfo(x - 1, y),
    };
  }

  protected getDirectionInfo(x: number, y: number): DirectionInfo {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return {
        neighborId: null,
        blocked: true,
        description: "Edge of the grid",
      };
    }

    const neighborId = `${this.getRowLetter(y)}${x + 1}`;
    return {
      neighborId,
      blocked: false,
      description: `Path to ${neighborId}`,
    };
  }

  public findPath(startId: string, endId: string): string[] | null {
    const start = this.findCellById(startId);
    const end = this.findCellById(endId);

    if (!start || !end) {
      return null; // Invalid start or end point
    }

    const queue: [Cell, string[]][] = [[start, []]];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const [currentCell, path] = queue.shift()!;

      if (currentCell.id === endId) {
        return [...path, currentCell.id]; // Path found
      }

      if (visited.has(currentCell.id)) {
        continue; // Skip already visited cells
      }

      visited.add(currentCell.id);

      for (const [direction, info] of Object.entries(currentCell.directions)) {
        if (!info.blocked && info.neighborId && !visited.has(info.neighborId)) {
          const neighborCell = this.findCellById(info.neighborId);
          if (neighborCell) {
            queue.push([neighborCell, [...path, currentCell.id]]);
          }
        }
      }
    }

    return null; // No path found
  }
  public canTravel(startId: string, endId: string): boolean {
    return this.findPath(startId, endId) !== null;
  }

  public printGrid(): string {
    let output = "";
    for (let y = 0; y < this.height; y++) {
      let rowString = "";
      let connectionString = "";
      for (let x = 0; x < this.width; x++) {
        const cell = this.grid[y][x];
        rowString += cell.id;

        // Check east connection
        if (x < this.width - 1) {
          rowString += cell.directions.east.blocked ? "x" : " ";
        }

        // Check south connection
        if (y < this.height - 1) {
          connectionString += cell.directions.south.blocked ? "x  " : "   ";
        }
      }
      output += rowString + "\n";
      if (connectionString) {
        output += connectionString + "\n";
      }
    }
    return output.trim();
  }
}
