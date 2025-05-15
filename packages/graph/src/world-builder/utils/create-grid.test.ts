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

test("Grid updateDirection method updates both cells", (t) => {
  const gridInstance = new Grid(3, 3);

  gridInstance.updateDirection("B2", "east", {
    blocked: true,
    description: "Wall",
  });

  const cellB2 = gridInstance.getCell(1, 1);
  const cellB3 = gridInstance.getCell(2, 1);

  t.true(cellB2?.directions.east.blocked);
  t.is(cellB2?.directions.east.description, "Wall");

  t.true(cellB3?.directions.west.blocked);
  t.is(cellB3?.directions.west.description, "Wall");
});

test("Grid findPath method finds simple path", (t) => {
  const gridInstance = new Grid(3, 3);

  // Test simple path
  t.deepEqual(gridInstance.findPath("A1", "C3"), [
    "A1",
    "B1",
    "C1",
    "C2",
    "C3",
  ]);
});

test("Grid findPath method finds blocked path", (t) => {
  const gridInstance = new Grid(3, 3);

  gridInstance.updateDirection("B2", "east", {
    blocked: true,
    description: "Wall",
  });
  gridInstance.updateDirection("A1", "south", {
    blocked: true,
    description: "Wall",
  });
  t.deepEqual(gridInstance.findPath("A1", "C3"), [
    "A1",
    "A2",
    "B2",
    "C2",
    "C3",
  ]);
});

test("Grid can find no path", (t) => {
  const gridInstance = new Grid(3, 3);
  gridInstance.updateDirection("B1", "south", {
    blocked: true,
    description: "Wall",
  });
  gridInstance.updateDirection("B2", "west", {
    blocked: true,
    description: "Wall",
  });
  gridInstance.updateDirection("B2", "north", {
    blocked: true,
    description: "Wall",
  });
  gridInstance.updateDirection("B3", "north", {
    blocked: true,
    description: "Wall",
  });
  t.is(gridInstance.canTravel("A1", "C3"), false);
  t.is(gridInstance.findPath("A1", "C3"), null);
});

test("print grid method returns a string", (t) => {
  const gridInstance = new Grid(3, 3);
  gridInstance.updateDirection("B1", "south", {
    blocked: true,
    description: "Wall",
  });
  gridInstance.updateDirection("B2", "west", {
    blocked: true,
    description: "Wall",
  });
  gridInstance.updateDirection("B2", "north", {
    blocked: true,
    description: "Wall",
  });
  gridInstance.updateDirection("B3", "north", {
    blocked: true,
    description: "Wall",
  });
  const gridString = gridInstance.printGrid();
  t.log(gridString);
  t.is(
    gridInstance.printGrid(),
    `A1 A2 A3
   x  x  
B1xB2 B3
x        
C1 C2 C3`
  );
});
