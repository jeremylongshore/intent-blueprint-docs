// Portions adapted from gstack (https://github.com/garrytan/gstack)
// Original: MIT License, Copyright (c) Garry Tan
//
// Copyright 2024 Intent Solutions
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @file gen-skill-docs.ts
 * @description Template build system: reads `.md.tmpl` files from `commands/`,
 * resolves `{{PLACEHOLDER}}` tokens from shared blocks, and writes generated
 * `.md` files. Supports `--dry-run` for CI freshness validation.
 *
 * Usage:
 *   npx tsx scripts/gen-skill-docs.ts [--dry-run] [--verbose]
 *
 * Placeholder resolution order:
 *   1. `commands/shared/{lowercase}.md`
 *   2. `review/{lowercase}.md`
 *   3. Built-in resolvers (e.g. {{BASE_BRANCH_DETECT}})
 *
 * The `{{DATE}}` placeholder is intentionally skipped — it is resolved at
 * doc-generation time, not at template build time.
 *
 * Exit codes:
 *   0  All files processed successfully (or all fresh in --dry-run)
 *   1  One or more files are stale (--dry-run only) or an error occurred
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Module-level constants
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Project root is one level above the scripts directory. */
const PROJECT_ROOT = path.resolve(__dirname, '..');

/** Directory that contains `.md.tmpl` source files. */
const COMMANDS_DIR = path.join(PROJECT_ROOT, 'commands');

/** Directory that contains shared block `.md` files. */
const SHARED_DIR = path.join(COMMANDS_DIR, 'shared');

/** Fallback directory for shared blocks not found under commands/shared/. */
const REVIEW_DIR = path.join(PROJECT_ROOT, 'review');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Result of processing a single template file. */
interface ProcessResult {
  /** Absolute path of the source `.md.tmpl` file. */
  templatePath: string;
  /** Absolute path of the output `.md` file. */
  outputPath: string;
  /** Relative path used for log messages. */
  displayPath: string;
  /** Number of unique placeholder tokens resolved. */
  placeholdersResolved: number;
  /** Placeholder tokens that could not be resolved. */
  unresolved: string[];
  /** Whether the output file was stale (only meaningful in --dry-run). */
  stale?: boolean;
  /** Any error that occurred during processing. */
  error?: Error;
}

/** CLI arguments parsed from process.argv. */
interface CliArgs {
  dryRun: boolean;
  verbose: boolean;
  help: boolean;
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

/**
 * Parse `process.argv` into a typed argument object.
 *
 * @param argv - Raw argument vector (pass `process.argv`).
 * @returns Parsed CLI arguments.
 */
function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { dryRun: false, verbose: false, help: false };
  for (const arg of argv.slice(2)) {
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--verbose') args.verbose = true;
    else if (arg === '--help' || arg === '-h') args.help = true;
  }
  return args;
}

function printUsage(): void {
  console.log(`
gen-skill-docs — Template build system for intent-blueprint-docs

Usage:
  npx tsx scripts/gen-skill-docs.ts [--dry-run] [--verbose]

Flags:
  --dry-run   Compare generated content to existing .md files; exit 1 if any
              file is stale. Does not write to disk. Useful for CI checks.
  --verbose   Print details for each placeholder as it is resolved.
  --help      Show this message.

Templates:
  Source:  commands/**/*.md.tmpl
  Output:  commands/**/*.md   (same path, .tmpl extension stripped)

Placeholder resolution order ({{DATE}} is always skipped):
  1. commands/shared/{placeholder-lowercase}.md
  2. review/{placeholder-lowercase}.md
  3. Built-in resolvers (e.g. {{BASE_BRANCH_DETECT}})

Regenerate after editing any .tmpl or shared block:
  npx tsx scripts/gen-skill-docs.ts
`);
}

// ---------------------------------------------------------------------------
// File system helpers
// ---------------------------------------------------------------------------

/**
 * Recursively collect all files under `dir` whose names match `predicate`.
 *
 * @param dir - Directory to walk.
 * @param predicate - Return true to include a filename.
 * @returns Absolute paths of matched files.
 */
function walkDir(dir: string, predicate: (name: string) => boolean): string[] {
  if (!fs.existsSync(dir)) return [];

  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, predicate));
    } else if (entry.isFile() && predicate(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Attempt to read a file, returning `null` if it does not exist.
 *
 * @param filePath - Absolute path to the file.
 * @returns File contents as a UTF-8 string, or null.
 */
function tryReadFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Built-in placeholder resolvers
// ---------------------------------------------------------------------------

/**
 * Inline content for `{{BASE_BRANCH_DETECT}}`.
 *
 * Provides a portable shell snippet that detects the PR base branch or falls
 * back to the repository default branch. Suitable for embedding in slash
 * command docs where CI and local environments must both work.
 */
const BASE_BRANCH_DETECT_CONTENT = [
  '### Base Branch Detection',
  '',
  'Use the following sequence to determine the correct base branch for diffs and',
  'comparisons. It works in both CI (GitHub Actions) and local environments:',
  '',
  '```bash',
  '# 1. Prefer the PR base branch if available (GitHub Actions)',
  'BASE_BRANCH="${GITHUB_BASE_REF:-}"',
  '',
  '# 2. Fall back to the remote HEAD (default branch)',
  'if [ -z "$BASE_BRANCH" ]; then',
  '  BASE_BRANCH="$(git remote show origin 2>/dev/null \\',
  "    | awk '/HEAD branch/ {print $NF}')",
  'fi',
  '',
  '# 3. Final fallback: common default branch names',
  'if [ -z "$BASE_BRANCH" ]; then',
  '  for candidate in main master develop trunk; do',
  '    if git show-ref --verify --quiet "refs/remotes/origin/$candidate"; then',
  '      BASE_BRANCH="$candidate"',
  '      break',
  '    fi',
  '  done',
  'fi',
  '',
  'echo "Base branch: $BASE_BRANCH"',
  '```',
  '',
].join('\n');

/**
 * Registry of built-in placeholder resolvers.
 *
 * Keys are the placeholder token name (uppercased, without braces).
 * Values are functions returning the replacement string, or plain strings.
 */
const BUILTIN_RESOLVERS: Readonly<Record<string, () => string>> = {
  BASE_BRANCH_DETECT: () => BASE_BRANCH_DETECT_CONTENT,
};

// ---------------------------------------------------------------------------
// Placeholder resolution
// ---------------------------------------------------------------------------

/** Regex matching `{{PLACEHOLDER}}` tokens. Captures the token name. */
const PLACEHOLDER_RE = /\{\{([A-Z0-9_]+)\}\}/g;

/**
 * Tokens that must never be resolved by this build system. They are handled
 * at doc-generation time (e.g. `{{DATE}}` is replaced with today's date).
 */
const SKIP_TOKENS = new Set<string>(['DATE']);

/**
 * Attempt to resolve a single placeholder token to its replacement content.
 *
 * Resolution order:
 *   1. Skip list (returns the original `{{TOKEN}}` unchanged).
 *   2. `commands/shared/{token-lowercase}.md`
 *   3. `review/{token-lowercase}.md`
 *   4. Built-in resolver registry.
 *
 * @param token - Placeholder token name (without braces), already uppercased.
 * @param verbose - Print resolution trace to stdout.
 * @returns `{ content, source }` on success, or `null` if unresolvable.
 */
function resolveToken(
  token: string,
  verbose: boolean,
): { content: string; source: string } | null {
  if (SKIP_TOKENS.has(token)) {
    return null; // Caller keeps the original token intact.
  }

  const lower = token.toLowerCase();
  // Also try hyphenated variant: TEMPLATE_LIST → template-list
  const hyphenated = lower.replace(/_/g, '-');

  // 1. commands/shared/{lower}.md (try underscore then hyphen)
  for (const variant of [lower, hyphenated]) {
    const sharedPath = path.join(SHARED_DIR, `${variant}.md`);
    const sharedContent = tryReadFile(sharedPath);
    if (sharedContent !== null) {
      if (verbose) {
        console.log(`    resolved {{${token}}} from commands/shared/${variant}.md`);
      }
      return { content: sharedContent, source: `commands/shared/${variant}.md` };
    }
  }

  // 2. review/{lower}.md (try underscore then hyphen)
  for (const variant of [lower, hyphenated]) {
    const reviewPath = path.join(REVIEW_DIR, `${variant}.md`);
    const reviewContent = tryReadFile(reviewPath);
    if (reviewContent !== null) {
      if (verbose) {
        console.log(`    resolved {{${token}}} from review/${variant}.md`);
      }
      return { content: reviewContent, source: `review/${variant}.md` };
    }
  }

  // 3. Built-in resolver
  const builtin = BUILTIN_RESOLVERS[token];
  if (builtin !== undefined) {
    if (verbose) {
      console.log(`    resolved {{${token}}} from built-in resolver`);
    }
    return { content: builtin(), source: 'built-in' };
  }

  return null;
}

/**
 * Resolve all `{{PLACEHOLDER}}` tokens in `source` (except those in
 * `SKIP_TOKENS`).
 *
 * @param source - Raw template content.
 * @param verbose - Forward to `resolveToken` for trace logging.
 * @returns Resolved content, count of unique resolved tokens, and list of
 *   unresolvable tokens.
 */
function resolveTemplate(
  source: string,
  verbose: boolean,
): { resolved: string; count: number; unresolved: string[] } {
  const resolvedTokens = new Set<string>();
  const unresolvedTokens = new Set<string>();

  // Collect all tokens first so we can report unresolved ones up front.
  const allTokens = new Set<string>();
  let m: RegExpExecArray | null;
  const scanRe = new RegExp(PLACEHOLDER_RE.source, 'g');
  while ((m = scanRe.exec(source)) !== null) {
    const token = m[1];
    if (!SKIP_TOKENS.has(token)) {
      allTokens.add(token);
    }
  }

  // Replace each occurrence.
  const resolved = source.replace(
    new RegExp(PLACEHOLDER_RE.source, 'g'),
    (match: string, token: string) => {
      if (SKIP_TOKENS.has(token)) {
        return match; // Preserve as-is.
      }

      const result = resolveToken(token, verbose);
      if (result !== null) {
        resolvedTokens.add(token);
        return result.content;
      }

      unresolvedTokens.add(token);
      return match; // Leave unresolved token in place.
    },
  );

  return {
    resolved,
    count: resolvedTokens.size,
    unresolved: [...unresolvedTokens],
  };
}

// ---------------------------------------------------------------------------
// Per-file processing
// ---------------------------------------------------------------------------

/**
 * Process a single `.md.tmpl` file: resolve placeholders, then either write
 * the output or (in dry-run mode) compare it to the existing file.
 *
 * @param templatePath - Absolute path to the `.md.tmpl` file.
 * @param dryRun - When true, compare instead of write.
 * @param verbose - Enable verbose placeholder trace logging.
 * @returns A `ProcessResult` describing the outcome.
 */
function processTemplate(
  templatePath: string,
  dryRun: boolean,
  verbose: boolean,
): ProcessResult {
  // Derive the output path by stripping the `.tmpl` extension.
  const outputPath = templatePath.replace(/\.tmpl$/, '');
  const displayPath = path.relative(PROJECT_ROOT, outputPath);

  const result: ProcessResult = {
    templatePath,
    outputPath,
    displayPath,
    placeholdersResolved: 0,
    unresolved: [],
  };

  let source: string;
  try {
    source = fs.readFileSync(templatePath, 'utf8');
  } catch (err) {
    result.error = err instanceof Error ? err : new Error(String(err));
    return result;
  }

  const { resolved, count, unresolved } = resolveTemplate(source, verbose);
  result.placeholdersResolved = count;
  result.unresolved = unresolved;

  if (unresolved.length > 0) {
    result.error = new Error(`Unresolved placeholders: ${unresolved.join(', ')}`);
    return result;
  }

  if (dryRun) {
    const existing = tryReadFile(outputPath);
    result.stale = existing !== resolved;
  } else {
    try {
      fs.writeFileSync(outputPath, resolved, 'utf8');
    } catch (err) {
      result.error = err instanceof Error ? err : new Error(String(err));
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------

/**
 * Emit a single-line status log for a processed file.
 *
 * Normal mode:
 *   `✓ commands/review-docs.md (3 placeholders resolved)`
 *   `✗ commands/review-docs.md (unresolved: FOO, BAR)`
 *
 * Dry-run mode:
 *   `✓ commands/review-docs.md (fresh)`
 *   `✗ commands/review-docs.md (stale — regenerate with: npx tsx scripts/gen-skill-docs.ts)`
 *
 * @param result - The result object from `processTemplate`.
 * @param dryRun - Controls which message format is used.
 */
function logResult(result: ProcessResult, dryRun: boolean): void {
  const { displayPath, placeholdersResolved, unresolved, stale, error } = result;

  if (error) {
    console.error(`✗ ${displayPath} (error: ${error.message})`);
    return;
  }

  if (dryRun) {
    if (stale) {
      console.error(
        `✗ ${displayPath} (stale — regenerate with: npx tsx scripts/gen-skill-docs.ts)`,
      );
    } else {
      console.log(`✓ ${displayPath} (fresh)`);
    }
    return;
  }

  const unresolvedSuffix =
    unresolved.length > 0 ? `, unresolved: ${unresolved.join(', ')}` : '';

  const pluralised =
    placeholdersResolved === 1 ? '1 placeholder resolved' : `${placeholdersResolved} placeholders resolved`;

  console.log(`✓ ${displayPath} (${pluralised}${unresolvedSuffix})`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Main entry point.
 *
 * @returns Exit code: 0 on success, 1 on stale files (dry-run) or errors.
 */
function main(): number {
  const args = parseArgs(process.argv);

  if (args.help) {
    printUsage();
    return 0;
  }

  // Discover all .md.tmpl files under commands/.
  const templatePaths = walkDir(COMMANDS_DIR, (name) => name.endsWith('.md.tmpl'));

  if (templatePaths.length === 0) {
    console.log('No *.md.tmpl files found under commands/ — nothing to do.');
    return 0;
  }

  if (args.dryRun) {
    console.log(`Dry-run: checking ${templatePaths.length} template(s) for freshness...\n`);
  } else {
    console.log(`Processing ${templatePaths.length} template(s)...\n`);
  }

  let exitCode = 0;

  for (const templatePath of templatePaths.sort()) {
    const result = processTemplate(templatePath, args.dryRun, args.verbose);
    logResult(result, args.dryRun);

    if (result.error || (args.dryRun && result.stale === true)) {
      exitCode = 1;
    }
  }

  if (!args.dryRun) {
    console.log('\nDone.');
  }

  return exitCode;
}

process.exit(main());
