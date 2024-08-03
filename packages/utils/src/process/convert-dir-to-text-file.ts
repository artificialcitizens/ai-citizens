import fs from "node:fs/promises";
import path from "node:path";
import { minimatch } from "minimatch";

interface ConvertOptions {
  ignore?: string[];
  fileExtensions?: string[];
  outputPath?: string;
  writeToCWD?: boolean;
}

async function convertDirToTextFile(
  dirPath: string,
  options: ConvertOptions
): Promise<string> {
  const {
    ignore = [
      "**/.git/**",
      "**/node_modules/**",
      "**/.DS_Store",
      "**/package-lock.json",
      "**/yarn.lock",
      "**/pnpm-lock.yaml",
    ],
    outputPath,
    writeToCWD = false,
  } = options;

  let output = "";

  const textExtensions = [
    ".txt",
    ".md",
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".json",
    ".yml",
    ".yaml",
    ".html",
    ".css",
    ".scss",
    ".less",
    ".vue",
    ".svelte",
    ".py",
    ".rb",
    ".java",
    ".c",
    ".cpp",
    ".h",
    ".hpp",
    ".cs",
    ".go",
    ".rs",
    ".php",
    ...(options.fileExtensions || []),
  ];

  function shouldInclude(filePath: string): boolean {
    const relativePath = path.relative(dirPath, filePath);
    return !ignore.some((pattern) =>
      minimatch(relativePath, pattern, { dot: true })
    );
  }

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

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(dirPath, fullPath);

      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else if (shouldInclude(fullPath)) {
        try {
          const content = textExtensions.includes(
            path.extname(fullPath).toLowerCase()
          )
            ? await fs.readFile(fullPath, "utf8")
            : "[Ignored file extension]";
          output += `-----------------------------\nFile: ${relativePath}\n-----------------------------\n\n${content}\n\n`;
        } catch (error) {
          output += `-----------------------------\nFile: ${relativePath}\n-----------------------------\n\n[Error reading file: ${error.message}]\n\n`;
        }
      }
    }
  }

  output += "Directory structure:\n";
  output += await generateDirStructure(dirPath);
  output += "\nFile contents:\n";

  await processDirectory(dirPath);

  if (outputPath) {
    await fs.writeFile(outputPath, output);
  } else if (writeToCWD) {
    await fs.writeFile(
      `${process.cwd()}/${dirPath.split("/").pop()}.txt`,
      output
    );
  }

  return output;
}

export { convertDirToTextFile };
