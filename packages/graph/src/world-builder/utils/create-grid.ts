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
}
