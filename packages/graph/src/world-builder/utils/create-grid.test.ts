import test from "ava";
import { Grid, Cell, Direction } from "./create-grid.js";

test("Grid class generates a 2D grid with correct dimensions, cell properties, and IDs", (t) => {
  const width = 3;
  const height = 4;
  const gridInstance = new Grid(width, height);
  const grid = gridInstance.getGrid();

  // Check grid dimensions
  t.is(grid.length, height);
  t.is(grid[0].length, width);

  // Check cell properties and IDs
  const expectedIds = [
    ["A1", "A2", "A3"],
    ["B1", "B2", "B3"],
    ["C1", "C2", "C3"],
    ["D1", "D2", "D3"],
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = grid[y][x];
      t.is(cell.id, expectedIds[y][x]);
      t.is(cell.x, x);
      t.is(cell.y, y);
      t.true("directions" in cell);
      t.true("north" in cell.directions);
      t.true("south" in cell.directions);
      t.true("east" in cell.directions);
      t.true("west" in cell.directions);
    }
  }
});

test("Grid class handles larger grids correctly", (t) => {
  const width = 26;
  const height = 10;
  const gridInstance = new Grid(width, height);
  const grid = gridInstance.getGrid();

  // Check last column of the first row
  t.is(grid[0][25].id, "A26");

  // Check first column of the last row
  t.is(grid[9][0].id, "J1");

  // Check last cell
  t.is(grid[9][25].id, "J26");
});

test("Grid class getCell method returns correct cells", (t) => {
  const gridInstance = new Grid(3, 3);

  const cell00 = gridInstance.getCell(0, 0);
  t.is(cell00?.id, "A1");
  t.is(cell00?.x, 0);
  t.is(cell00?.y, 0);

  const cell21 = gridInstance.getCell(2, 1);
  t.is(cell21?.id, "B3");
  t.is(cell21?.x, 2);
  t.is(cell21?.y, 1);

  t.is(gridInstance.getCell(3, 3), undefined);
});

test("Grid cells have correct direction information", (t) => {
  const gridInstance = new Grid(3, 3);
  const grid = gridInstance.getGrid();

  // Check center cell (B2)
  const centerCell = grid[1][1];
  t.is(centerCell.id, "B2");
  t.deepEqual(centerCell.directions.north, {
    neighborId: "A2",
    blocked: false,
    description: "Path to A2",
  });
  t.deepEqual(centerCell.directions.south, {
    neighborId: "C2",
    blocked: false,
    description: "Path to C2",
  });
  t.deepEqual(centerCell.directions.east, {
    neighborId: "B3",
    blocked: false,
    description: "Path to B3",
  });
  t.deepEqual(centerCell.directions.west, {
    neighborId: "B1",
    blocked: false,
    description: "Path to B1",
  });

  // Check top-left corner cell (A1)
  const topLeftCell = grid[0][0];
  t.is(topLeftCell.id, "A1");
  t.deepEqual(topLeftCell.directions.north, {
    neighborId: null,
    blocked: true,
    description: "Edge of the grid",
  });
  t.deepEqual(topLeftCell.directions.west, {
    neighborId: null,
    blocked: true,
    description: "Edge of the grid",
  });
});

test("Grid updateDirection method works correctly", (t) => {
  const gridInstance = new Grid(3, 3);

  gridInstance.updateDirection("B2", "north", {
    blocked: true,
    description: "Wall to the north",
  });
  const updatedCell = gridInstance.getCell(1, 1);

  t.deepEqual(updatedCell?.directions.north, {
    neighborId: "A2",
    blocked: true,
    description: "Wall to the north",
  });
});
