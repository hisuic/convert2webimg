# Photo WebP Converter (photo500)

Terminal-only tool to convert images into WebP files resized to a target width (default 500px) while preserving aspect ratio and stripping metadata. Intended for incremental runs so you can drop new photos in and re-run without reprocessing existing outputs.

## Install

```bash
npm install
```

## Usage

Run with defaults (input: current directory, output: ./output):

```bash
npm run photo500
```

Pass options through npm with `--`:

```bash
npm run photo500 -- --in ./photos --out ./output --width 500 --quality 75
```

Dry run (no files written):

```bash
npm run photo500 -- --dry-run
```

Re-generate all outputs even if they exist:

```bash
npm run photo500 -- --force
```

## Options

- `--in <dir>` input directory (default `.`)
- `--out <dir>` output directory (default `output`)
- `--width <number>` resize width (default `500`)
- `--quality <number>` WebP quality 1-100 (default `75`)
- `--force` re-generate outputs even if present
- `--dry-run` print planned operations only

## Behavior

- Finds images recursively under the input directory.
- Ignores `node_modules/**` and the output directory (if it is inside the input).
- Supported extensions: jpg, jpeg, png, tif, tiff, webp.
- Does not enlarge small images (`width < target`).
- Strips metadata (EXIF/GPS) by default.
- Incremental by default: if an output file exists, conversion is skipped unless `--force` is set.

## Filename collisions

Outputs are written to `output/<same-base-name>.webp` without preserving subdirectories. If two input files share the same base name, they will collide and overwrite each other. If that matters for your use case, consider running separate batches or adjusting the script to keep relative paths.
