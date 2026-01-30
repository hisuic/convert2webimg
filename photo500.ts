import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import sharp from "sharp";

type Options = {
  inputDir: string;
  outputDir: string;
  width: number;
  quality: number;
  force: boolean;
  dryRun: boolean;
};

const DEFAULTS: Options = {
  inputDir: ".",
  outputDir: "output",
  width: 500,
  quality: 75,
  force: false,
  dryRun: false,
};

function parseArgs(argv: string[]): Options {
  const opts: Options = { ...DEFAULTS };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--in") {
      opts.inputDir = argv[i + 1] ?? opts.inputDir;
      i += 1;
    } else if (arg === "--out") {
      opts.outputDir = argv[i + 1] ?? opts.outputDir;
      i += 1;
    } else if (arg === "--width") {
      const raw = argv[i + 1];
      const parsed = raw ? Number(raw) : NaN;
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`Invalid --width value: ${raw}`);
      }
      opts.width = parsed;
      i += 1;
    } else if (arg === "--quality") {
      const raw = argv[i + 1];
      const parsed = raw ? Number(raw) : NaN;
      if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) {
        throw new Error(`Invalid --quality value: ${raw}`);
      }
      opts.quality = parsed;
      i += 1;
    } else if (arg === "--force") {
      opts.force = true;
    } else if (arg === "--dry-run") {
      opts.dryRun = true;
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return opts;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const inputDir = path.resolve(process.cwd(), opts.inputDir);
  const outputDir = path.resolve(process.cwd(), opts.outputDir);

  await fs.mkdir(outputDir, { recursive: true });

  const extensions = ["jpg", "jpeg", "png", "tif", "tiff", "webp"];
  const pattern = `**/*.{${extensions.join(",")}}`;

  const ignore: string[] = ["**/node_modules/**"];
  const relOut = path.relative(inputDir, outputDir);
  if (relOut && !relOut.startsWith("..") && !path.isAbsolute(relOut)) {
    ignore.push(`${relOut}/**`);
  }

  const files = await fg(pattern, {
    cwd: inputDir,
    absolute: true,
    onlyFiles: true,
    caseSensitiveMatch: false,
    ignore,
  });

  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const baseName = path.parse(file).name;
    const outputFile = path.join(outputDir, `${baseName}.webp`);

    try {
      if (!opts.force) {
        try {
          await fs.access(outputFile);
          console.log(`SKIP ${file} (exists)`);
          skipped += 1;
          continue;
        } catch {
          // output does not exist
        }
      }

      if (opts.dryRun) {
        console.log(`OK ${file} -> ${outputFile}`);
        converted += 1;
        continue;
      }

      const pipeline = sharp(file, { failOnError: false }).resize({
        width: opts.width,
        withoutEnlargement: true,
      });

      await pipeline.webp({ quality: opts.quality }).toFile(outputFile);
      console.log(`OK ${file} -> ${outputFile}`);
      converted += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`FAIL ${file} ${message}`);
      failed += 1;
    }
  }

  console.log(
    `converted=${converted} skipped=${skipped} failed=${failed} outDir=${outputDir}`
  );
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exitCode = 1;
});
