import fs from "node:fs/promises";
import path from "node:path";

interface ConvertOptions {
  /**
   * An array of paths to ignore.
   */
  ignore?: string[];
  /**
   * If provided, the output will be saved to a file named `converted-dir-output.txt` in the specified directory.
   */
  outputPath?: string;
}

async function convertDirToTextFile(
  dirPath: string,
  options: ConvertOptions
): Promise<string> {
  const { ignore = [], outputPath } = options;
  let output = "";

  // Function to generate directory structure
  async function generateDirStructure(
    currentPath: string,
    prefix = ""
  ): Promise<string> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    let structure = "";

    const entryPromises = entries.map(async (entry, index) => {
      const relativePath = path.relative(
        dirPath,
        path.join(currentPath, entry.name)
      );
      if (ignore.some((ignorePath) => relativePath.startsWith(ignorePath))) {
        return "";
      }

      const isLast = index === entries.length - 1;
      const newPrefix = isLast ? `${prefix}    ` : `${prefix}│   `;
      const entryPrefix = isLast ? `${prefix}└── ` : `${prefix}├── `;

      let entryStructure = `${entryPrefix}${entry.name}\n`;

      if (entry.isDirectory()) {
        const subStructure = await generateDirStructure(
          path.join(currentPath, entry.name),
          newPrefix
        );
        entryStructure += subStructure;
      }

      return entryStructure;
    });

    const entryStructures = await Promise.all(entryPromises);
    structure += entryStructures.join("");

    return structure;
  }

  async function processDirectory(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    const processTasks = entries.map(async (entry) => {
      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(dirPath, fullPath);

      if (ignore.some((ignorePath) => relativePath.startsWith(ignorePath))) {
        return;
      }

      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else if (entry.isFile()) {
        const content = await fs.readFile(fullPath, "utf8");
        output += `-----------------------------\nFile: ${relativePath}\n-----------------------------\n\n${content}\n\n`;
      }
    });

    await Promise.all(processTasks);
  }

  // Generate directory structure
  const dirStructure = await generateDirStructure(dirPath);
  output = `${path.basename(dirPath)}/\n${dirStructure}\n${output}`;

  await processDirectory(dirPath);

  if (outputPath) {
    await fs.writeFile(`${outputPath}/converted-dir-output.txt`, output);
  }

  return output;
}

export default convertDirToTextFile;

// example usage
// convertDirToTextFile('./src/lib/utils', {outputPath: './src/lib/utils/output.txt'})
