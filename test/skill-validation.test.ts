/**
 * Validates that all skill files are well-formed:
 * - Valid YAML frontmatter
 * - Required fields present (name, description)
 * - No stale generated files (if using template build system)
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SKILLS_DIRS = [
  path.join(PROJECT_ROOT, 'skills'),
  path.join(PROJECT_ROOT, '.claude', 'skills'),
];
const COMMANDS_DIR = path.join(PROJECT_ROOT, 'commands');

function getSkillDirs(): Array<{ name: string; root: string }> {
  return SKILLS_DIRS.flatMap(root => !fs.existsSync(root) ? [] :
    fs.readdirSync(root, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => ({ name: d.name, root })));
}

function getTemplateFiles(): string[] {
  if (!fs.existsSync(COMMANDS_DIR)) return [];
  const results: string[] = [];
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.md.tmpl')) results.push(full);
    }
  }
  walk(COMMANDS_DIR);
  return results;
}

describe('Skill validation', () => {
  const skillDirs = getSkillDirs();

  it('has at least one skill', () => {
    expect(skillDirs.length).toBeGreaterThan(0);
  });

  for (const skill of skillDirs) {
    describe(`skill: ${skill.name}`, () => {
      const skillPath = path.join(skill.root, skill.name, 'SKILL.md');

      it('has SKILL.md', () => {
        expect(fs.existsSync(skillPath)).toBe(true);
      });

      it('has valid YAML frontmatter', () => {
        const content = fs.readFileSync(skillPath, 'utf8');
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        expect(frontmatterMatch).not.toBeNull();
      });

      it('has required name field', () => {
        const content = fs.readFileSync(skillPath, 'utf8');
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        expect(frontmatterMatch![1]).toMatch(/^name:\s+\S/m);
      });

      it('has required description field', () => {
        const content = fs.readFileSync(skillPath, 'utf8');
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        expect(frontmatterMatch![1]).toMatch(/^description:/m);
      });

      it('name matches directory name', () => {
        const content = fs.readFileSync(skillPath, 'utf8');
        const nameMatch = content.match(/^name:\s+(.+)$/m);
        expect(nameMatch).not.toBeNull();
        expect(nameMatch![1].trim()).toBe(skill.name);
      });

      it('is under 500 lines', () => {
        const content = fs.readFileSync(skillPath, 'utf8');
        const lineCount = content.split('\n').length;
        expect(lineCount).toBeLessThanOrEqual(500);
      });

      it('has no absolute paths (uses ${CLAUDE_SKILL_DIR}/ instead)', () => {
        const content = fs.readFileSync(skillPath, 'utf8');
        // Skip the attribution comment lines
        const body = content.replace(/^<!--.*-->$/gm, '');
        expect(body).not.toMatch(/\/home\/|\/Users\/|C:\\/);
      });
    });
  }
});

describe('Template freshness', () => {
  const templates = getTemplateFiles();

  it('discovers at least one template file', () => {
    expect(templates.length).toBeGreaterThan(0);
  });

  for (const tmplPath of templates) {
    const outputPath = tmplPath.replace(/\.tmpl$/, '');
    const displayPath = path.relative(PROJECT_ROOT, outputPath);

    it(`${displayPath} exists (generated from .tmpl)`, () => {
      expect(fs.existsSync(outputPath)).toBe(true);
    });
  }
});
