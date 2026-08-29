#!/usr/bin/env node
/**
 * Intent Blueprint CLI
 * Generate enterprise documentation from the command line
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import {
  listTemplates,
  generateAllDocuments,
  writeDocuments,
  getTemplatesForScope,
  type TemplateContext,
  SCOPES,
  AUDIENCES,
} from './core/index.js';

const program = new Command();

program
  .name('blueprint')
  .description('Intent Blueprint - Enterprise AI Documentation Generator')
  .version('2.9.0');

// Init command
program
  .command('init')
  .description('Initialize Intent Blueprint in your project')
  .action(async () => {
    console.log(chalk.blue('\n🚀 Intent Blueprint - Project Initialization\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        validate: (input: string) => input.length > 0 || 'Project name is required',
      },
      {
        type: 'input',
        name: 'projectDescription',
        message: 'Brief project description:',
        validate: (input: string) => input.length > 0 || 'Description is required',
      },
      {
        type: 'list',
        name: 'scope',
        message: 'Documentation scope:',
        choices: [
          { name: 'MVP (4 essential docs)', value: 'mvp' },
          { name: 'Standard (12 core docs)', value: 'standard' },
          { name: 'Comprehensive (22 docs)', value: 'comprehensive' },
        ],
        default: 'standard',
      },
      {
        type: 'list',
        name: 'audience',
        message: 'Target audience:',
        choices: [
          { name: 'Startup (lean, fast)', value: 'startup' },
          { name: 'Business (balanced)', value: 'business' },
          { name: 'Enterprise (thorough)', value: 'enterprise' },
        ],
        default: 'business',
      },
    ]);

    const spinner = ora('Generating documentation...').start();

    try {
      const context: TemplateContext = {
        projectName: answers.projectName,
        projectDescription: answers.projectDescription,
        scope: answers.scope,
        audience: answers.audience,
      };

      const docs = generateAllDocuments(context);
      const outputDir = `./docs/${answers.projectName.toLowerCase().replace(/\s+/g, '-')}`;
      const files = writeDocuments(docs, outputDir);

      spinner.succeed(chalk.green(`Generated ${docs.length} documents!`));
      console.log(chalk.dim(`\nOutput: ${outputDir}`));
      console.log(chalk.dim(`Files: ${files.length}`));
    } catch (error) {
      spinner.fail(chalk.red('Failed to generate documentation'));
      console.error(error);
      process.exit(1);
    }
  });

// Generate command
program
  .command('generate')
  .description('Generate documentation with options')
  .option('-n, --name <name>', 'Project name')
  .option('-d, --description <desc>', 'Project description')
  .option('-s, --scope <scope>', 'Scope: mvp, standard, comprehensive', 'standard')
  .option('-a, --audience <audience>', 'Audience: startup, business, enterprise', 'business')
  .option('-o, --output <dir>', 'Output directory')
  .action(async (options) => {
    let projectName = options.name;
    let projectDescription = options.description;

    if (!projectName || !projectDescription) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'Project name:',
          when: !projectName,
          validate: (input: string) => input.length > 0 || 'Required',
        },
        {
          type: 'input',
          name: 'projectDescription',
          message: 'Project description:',
          when: !projectDescription,
          validate: (input: string) => input.length > 0 || 'Required',
        },
      ]);
      projectName = projectName || answers.projectName;
      projectDescription = projectDescription || answers.projectDescription;
    }

    const spinner = ora('Generating documentation...').start();

    try {
      const context: TemplateContext = {
        projectName,
        projectDescription,
        scope: options.scope as 'mvp' | 'standard' | 'comprehensive',
        audience: options.audience as 'startup' | 'business' | 'enterprise',
      };

      const docs = generateAllDocuments(context);
      const outputDir = options.output || `./docs/${projectName.toLowerCase().replace(/\s+/g, '-')}`;
      const files = writeDocuments(docs, outputDir);

      spinner.succeed(chalk.green(`Generated ${docs.length} documents!`));
      console.log(chalk.dim(`\nOutput: ${outputDir}`));
    } catch (error) {
      spinner.fail(chalk.red('Generation failed'));
      console.error(error);
      process.exit(1);
    }
  });

// Interview command - Adaptive AI-guided interview
program
  .command('interview')
  .description('Adaptive AI-guided documentation interview with smart detection')
  .option('-q, --quick', 'Quick mode - just name and description')
  .action(async (options) => {
    console.log(chalk.blue('\n🎤 Intent Blueprint - Adaptive Interview\n'));
    console.log(chalk.dim('Answer questions to generate tailored documentation.'));
    console.log(chalk.dim('Questions adapt based on your answers.\n'));

    const { InterviewEngine } = await import('./interview/index.js');
    const engine = new InterviewEngine();

    if (options.quick) {
      // Quick mode - just essentials
      const basicAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: chalk.cyan('Project name:'),
          validate: (input: string) => input.length > 0 || 'Required',
        },
        {
          type: 'editor',
          name: 'projectDescription',
          message: chalk.cyan('Describe your project (opens editor):'),
        },
      ]);

      engine.setAnswers(basicAnswers);
    } else {
      // Full adaptive interview
      const groups = engine.getQuestionGroups();

      for (const group of groups) {
        if (!group.isActive || group.questions.length === 0) continue;

        console.log(chalk.yellow(`\n━━━ ${group.name} ━━━`));
        console.log(chalk.dim(group.description + '\n'));

        for (const question of group.questions) {
          // Skip if already answered or condition not met
          const state = engine.getState();
          if (state.answers[question.id] !== undefined) continue;

          const promptConfig: Record<string, unknown> = {
            name: 'answer',
            message: chalk.cyan(question.text),
          };

          if (question.hint) {
            promptConfig.message += chalk.dim(` (${question.hint})`);
          }

          switch (question.type) {
            case 'text':
              promptConfig.type = 'input';
              if (question.default) promptConfig.default = question.default;
              break;
            case 'editor':
              promptConfig.type = 'editor';
              break;
            case 'select':
              promptConfig.type = 'list';
              promptConfig.choices = question.options || [];
              break;
            case 'multiselect':
              promptConfig.type = 'checkbox';
              promptConfig.choices = question.options || [];
              break;
            case 'confirm':
              promptConfig.type = 'confirm';
              promptConfig.default = question.default ?? false;
              break;
            case 'number':
              promptConfig.type = 'number';
              if (question.default) promptConfig.default = question.default;
              break;
          }

          try {
            const { answer } = await inquirer.prompt([promptConfig]);
            engine.answer(question.id, answer);
          } catch {
            // User cancelled
            break;
          }
        }
      }
    }

    // Complete interview and show results
    const result = engine.complete();

    console.log(chalk.green('\n✅ Interview complete!\n'));

    // Show detected context
    console.log(chalk.yellow('━━━ Analysis ━━━'));
    console.log(`  Project Type: ${chalk.cyan(result.detected.projectType)}`);
    console.log(`  Complexity: ${chalk.cyan(result.detected.complexity)}`);
    console.log(`  Suggested Scope: ${chalk.cyan(result.detected.suggestedScope)}`);
    console.log(`  Confidence: ${chalk.cyan(result.detected.confidence + '%')}`);

    if (result.detected.detectedTechnologies.length > 0) {
      console.log(`  Technologies: ${chalk.cyan(result.detected.detectedTechnologies.join(', '))}`);
    }

    // Show gap analysis
    if (result.gaps.missingRecommended.length > 0) {
      console.log(chalk.yellow('\n━━━ Recommendations ━━━'));
      for (const missing of result.gaps.missingRecommended) {
        console.log(`  ${chalk.dim('•')} Consider adding: ${missing}`);
      }
    }

    if (result.gaps.suggestions.length > 0) {
      for (const suggestion of result.gaps.suggestions) {
        console.log(`  ${chalk.dim('•')} ${suggestion}`);
      }
    }

    // Confirm generation
    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: '\nGenerate documentation now?',
        default: true,
      },
    ]);

    if (proceed) {
      const spinner = ora('Generating documentation...').start();

      try {
        const context = engine.toTemplateContext();
        const docs = generateAllDocuments(context);
        const outputDir = `./docs/${context.projectName.toLowerCase().replace(/\s+/g, '-')}`;
        const files = writeDocuments(docs, outputDir);

        spinner.succeed(chalk.green(`Generated ${docs.length} documents!`));
        console.log(chalk.dim(`\nOutput: ${outputDir}`));
        console.log(chalk.dim(`Files: ${files.length}`));

        // Show what was generated
        console.log(chalk.yellow('\n━━━ Documents Generated ━━━'));
        for (const doc of docs) {
          console.log(`  ${chalk.dim('•')} ${doc.name} (${doc.category})`);
        }
      } catch (error) {
        spinner.fail(chalk.red('Generation failed'));
        console.error(error);
        process.exit(1);
      }
    }
  });

// List command
program
  .command('list')
  .description('List available templates')
  .option('-s, --scope <scope>', 'Filter by scope: mvp, standard, comprehensive')
  .action((options) => {
    console.log(chalk.blue('\n📚 Available Templates\n'));

    const templates = options.scope ? getTemplatesForScope(options.scope) : listTemplates();

    const grouped = templates.reduce((acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    }, {} as Record<string, typeof templates>);

    for (const [category, temps] of Object.entries(grouped)) {
      console.log(chalk.yellow(`\n${category}`));
      for (const t of temps) {
        console.log(`  ${chalk.cyan(t.id.padEnd(25))} ${t.name}`);
      }
    }

    console.log(chalk.dim(`\nTotal: ${templates.length} templates`));
  });

// Export command - GitHub, Linear, Jira, and Notion integration
program
  .command('export <target>')
  .description('Export to GitHub, Linear, Jira, or Notion')
  .option('-p, --project <name>', 'Project name')
  .option('-d, --docs <dir>', 'Generated docs directory')
  .option('-t, --token <token>', 'API token (or use GITHUB_TOKEN / LINEAR_API_KEY / JIRA_API_TOKEN / NOTION_API_KEY env)')
  .option('-o, --owner <owner>', 'Repository owner (GitHub)')
  .option('-r, --repo <repo>', 'Repository name (GitHub)')
  .option('--team <id>', 'Linear team ID')
  .option('--base-url <url>', 'Jira instance URL (e.g., https://your-domain.atlassian.net)')
  .option('--email <email>', 'Jira user email')
  .option('--project-key <key>', 'Jira project key')
  .option('--page-id <id>', 'Notion parent page ID')
  .option('--database-id <id>', 'Notion database ID')
  .option('--dry-run', 'Preview what would be exported without making changes')
  .option('--no-issues', 'Skip creating issues')
  .option('--no-milestones', 'Skip creating milestones/cycles/sprints')
  .option('--no-labels', 'Skip creating labels/components')
  .option('--no-pr-templates', 'Skip creating PR templates (GitHub only)')
  .option('--create-project', 'Create a new project in Linear')
  .option('--create-epic', 'Create an Epic in Jira')
  .option('--create-versions', 'Create versions/releases in Jira')
  .option('--create-database', 'Create a Notion database for documents')
  .action(async (target, options) => {
    if (target !== 'github' && target !== 'linear' && target !== 'jira' && target !== 'notion') {
      console.log(chalk.yellow(`\n⚠️  Export to ${target} not supported.\n`));
      console.log(chalk.dim('Currently supported: github, linear, jira, notion'));
      return;
    }

    // Handle Linear export
    if (target === 'linear') {
      await handleLinearExport(options);
      return;
    }

    // Handle Jira export
    if (target === 'jira') {
      await handleJiraExport(options);
      return;
    }

    // Handle Notion export
    if (target === 'notion') {
      await handleNotionExport(options);
      return;
    }

    console.log(chalk.blue('\n🚀 Intent Blueprint - GitHub Export\n'));

    const { GitHubExporter } = await import('./integrations/github/index.js');

    // Get GitHub config
    const token = options.token || process.env.GITHUB_TOKEN;
    if (!token) {
      console.log(chalk.red('Error: GitHub token required'));
      console.log(chalk.dim('Use --token or set GITHUB_TOKEN environment variable'));
      process.exit(1);
    }

    let owner = options.owner;
    let repo = options.repo;

    // Try to detect from git remote if not specified
    if (!owner || !repo) {
      try {
        const { execSync } = await import('child_process');
        const remote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
        const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
        if (match) {
          owner = owner || match[1];
          repo = repo || match[2];
        }
      } catch {
        // Ignore
      }
    }

    if (!owner || !repo) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'owner',
          message: 'Repository owner:',
          when: !owner,
          validate: (input: string) => input.length > 0 || 'Required',
        },
        {
          type: 'input',
          name: 'repo',
          message: 'Repository name:',
          when: !repo,
          validate: (input: string) => input.length > 0 || 'Required',
        },
      ]);
      owner = owner || answers.owner;
      repo = repo || answers.repo;
    }

    // Read generated docs
    const docsDir = options.docs || './docs';
    const { readdirSync, readFileSync, existsSync } = await import('fs');
    const { join } = await import('path');

    if (!existsSync(docsDir)) {
      console.log(chalk.red(`Error: Docs directory not found: ${docsDir}`));
      console.log(chalk.dim('Generate docs first with: blueprint generate'));
      process.exit(1);
    }

    // Find project folder
    const projects = readdirSync(docsDir).filter((f) => {
      const path = join(docsDir, f);
      return existsSync(path) && readdirSync(path).some((f) => f.endsWith('.md'));
    });

    if (projects.length === 0) {
      console.log(chalk.red('Error: No documentation projects found'));
      process.exit(1);
    }

    let projectDir = projects[0];
    if (projects.length > 1 && !options.project) {
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'project',
          message: 'Select project:',
          choices: projects,
        },
      ]);
      projectDir = answer.project;
    } else if (options.project) {
      projectDir = options.project;
    }

    const projectPath = join(docsDir, projectDir);
    const files = readdirSync(projectPath).filter((f) => f.endsWith('.md'));

    const documents = files.map((f) => ({
      name: f.replace('.md', '').replace(/-/g, ' '),
      filename: f,
      content: readFileSync(join(projectPath, f), 'utf-8'),
      category: 'Generated',
    }));

    console.log(`Found ${documents.length} documents in ${projectDir}\n`);

    const exporter = new GitHubExporter(
      { token, owner, repo },
      {
        createIssues: options.issues !== false,
        createMilestones: options.milestones !== false,
        createLabels: options.labels !== false,
        createPRTemplates: options.prTemplates !== false,
        dryRun: options.dryRun,
      }
    );

    if (options.dryRun) {
      console.log(chalk.yellow('Dry run - showing what would be created:\n'));
      const preview = await exporter.preview(documents, {
        projectName: projectDir,
        projectDescription: '',
        scope: 'standard',
        audience: 'business',
      });

      console.log(chalk.cyan('Labels:'), preview.labels.length);
      console.log(chalk.cyan('Tasks:'), preview.tasks.length);
      console.log(chalk.cyan('Milestones:'), preview.phases.length);
      console.log(chalk.cyan('PR Templates:'), preview.prTemplates.join(', '));
      return;
    }

    const spinner = ora('Exporting to GitHub...').start();

    try {
      const result = await exporter.export(documents, {
        projectName: projectDir,
        projectDescription: '',
        scope: 'standard',
        audience: 'business',
      });

      if (result.success) {
        spinner.succeed(chalk.green('Export complete!'));
        console.log(`\n  Labels created: ${result.created.labels}`);
        console.log(`  Issues created: ${result.created.issues}`);
        console.log(`  Milestones created: ${result.created.milestones}`);
        console.log(`  PR templates created: ${result.created.prTemplates}`);

        if (result.urls.length > 0) {
          console.log(chalk.cyan('\nCreated issues:'));
          for (const url of result.urls.slice(0, 5)) {
            console.log(`  ${url}`);
          }
          if (result.urls.length > 5) {
            console.log(chalk.dim(`  ... and ${result.urls.length - 5} more`));
          }
        }
      } else {
        spinner.fail(chalk.red('Export failed'));
        for (const error of result.errors) {
          console.log(chalk.red(`  ${error}`));
        }
      }
    } catch (error) {
      spinner.fail(chalk.red('Export failed'));
      console.error(error);
      process.exit(1);
    }
  });

// GitHub Action command
program
  .command('github-action')
  .description('Generate GitHub Action workflow for doc automation')
  .option('-p, --project <name>', 'Project name', 'My Project')
  .option('-s, --scope <scope>', 'Documentation scope', 'standard')
  .option('-o, --output <dir>', 'Output directory', '.github/workflows')
  .action(async (options) => {
    console.log(chalk.blue('\n📋 Generating GitHub Action workflow...\n'));

    const { generateAllActions } = await import('./integrations/github/index.js');
    const { mkdirSync, writeFileSync, existsSync } = await import('fs');
    const { join } = await import('path');

    const actions = generateAllActions({
      projectName: options.project,
      scope: options.scope,
      audience: 'business',
      onPush: true,
      createIssues: true,
    });

    if (!existsSync(options.output)) {
      mkdirSync(options.output, { recursive: true });
    }

    for (const [filename, content] of Object.entries(actions)) {
      const path = join(options.output, filename);
      writeFileSync(path, content);
      console.log(chalk.green(`Created: ${path}`));
    }

    console.log(chalk.dim('\nCommit these files to enable automated documentation.'));
  });

// Sync command (placeholder)
program
  .command('sync')
  .description('Bi-directional sync with project management tools')
  .action(() => {
    console.log(chalk.yellow('\n⚠️  Sync feature coming soon!\n'));
  });

// Enterprise: API Server command
program
  .command('serve')
  .description('Start the Blueprint REST API server')
  .option('-p, --port <port>', 'Port to listen on', '3456')
  .option('-h, --host <host>', 'Host to bind to', 'localhost')
  .option('-k, --api-key <key>', 'API key for authentication')
  .option('--no-cors', 'Disable CORS')
  .option('-t, --templates <dir>', 'Custom templates directory')
  .action(async (options) => {
    console.log(chalk.blue('\n🚀 Intent Blueprint - API Server\n'));

    const { ApiServer } = await import('./enterprise/api/index.js');
    const { TemplateLoader } = await import('./enterprise/templates/index.js');

    const server = new ApiServer({
      port: parseInt(options.port),
      host: options.host,
      apiKey: options.apiKey,
      cors: options.cors !== false,
      logging: true,
    });

    // Load custom templates if specified
    if (options.templates) {
      const { existsSync } = await import('fs');
      if (existsSync(options.templates)) {
        const loader = new TemplateLoader(options.templates);
        try {
          const templates = loader.loadDirectory(options.templates);
          server.loadTemplates(templates);
          console.log(chalk.dim(`Loaded ${templates.length} custom templates\n`));
        } catch (error) {
          console.log(chalk.yellow(`Warning: Failed to load templates from ${options.templates}`));
        }
      }
    }

    try {
      await server.start();
      console.log(chalk.dim('Press Ctrl+C to stop\n'));

      // Handle shutdown
      process.on('SIGINT', async () => {
        console.log(chalk.dim('\nShutting down...'));
        await server.stop();
        process.exit(0);
      });
    } catch (error) {
      console.log(chalk.red('Failed to start server'));
      console.error(error);
      process.exit(1);
    }
  });

// Enterprise: Template management
program
  .command('template <action>')
  .description('Manage custom templates (list, create, validate, export)')
  .option('-i, --id <id>', 'Template ID')
  .option('-n, --name <name>', 'Template name')
  .option('-f, --file <path>', 'Template file path')
  .option('-o, --output <path>', 'Output file path')
  .action(async (action, options) => {
    const { TemplateLoader, TemplateEngine } = await import('./enterprise/templates/index.js');
    const loader = new TemplateLoader();

    switch (action) {
      case 'list': {
        console.log(chalk.blue('\n📋 Custom Templates\n'));
        const { existsSync, readdirSync } = await import('fs');
        const templatesDir = './templates';

        if (!existsSync(templatesDir)) {
          console.log(chalk.dim('No custom templates directory found.'));
          console.log(chalk.dim('Create templates in ./templates/ directory.'));
          return;
        }

        try {
          const templates = loader.loadDirectory(templatesDir);
          if (templates.length === 0) {
            console.log(chalk.dim('No templates found.'));
            return;
          }

          for (const t of templates) {
            console.log(`  ${chalk.cyan(t.meta.id.padEnd(25))} ${t.meta.name}`);
            console.log(chalk.dim(`    ${t.meta.description}`));
          }
          console.log(chalk.dim(`\nTotal: ${templates.length} templates`));
        } catch (error) {
          console.log(chalk.red('Failed to load templates'));
          console.error(error);
        }
        break;
      }

      case 'create': {
        console.log(chalk.blue('\n✨ Create Custom Template\n'));
        const id = options.id || 'custom-template';
        const name = options.name || 'Custom Template';
        const template = TemplateLoader.createBlankTemplate(id, name);
        const yaml = TemplateLoader.toYaml(template);

        if (options.output) {
          const { writeFileSync, mkdirSync, existsSync } = await import('fs');
          const { dirname } = await import('path');
          const dir = dirname(options.output);
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
          writeFileSync(options.output, yaml);
          console.log(chalk.green(`Created: ${options.output}`));
        } else {
          console.log(yaml);
        }
        break;
      }

      case 'validate': {
        console.log(chalk.blue('\n✅ Validate Template\n'));
        if (!options.file) {
          console.log(chalk.red('Error: --file required'));
          return;
        }

        try {
          const template = loader.loadFile(options.file);
          console.log(chalk.green('Template is valid!'));
          console.log(`  ID: ${template.meta.id}`);
          console.log(`  Name: ${template.meta.name}`);
          console.log(`  Variables: ${template.variables.length}`);
          console.log(`  Sections: ${template.sections.length}`);
        } catch (error) {
          console.log(chalk.red('Template validation failed:'));
          console.error(error);
        }
        break;
      }

      case 'export': {
        console.log(chalk.blue('\n📤 Export Template to YAML\n'));
        if (!options.file && !options.id) {
          console.log(chalk.red('Error: --file or --id required'));
          return;
        }

        try {
          const template = options.file
            ? loader.loadFile(options.file)
            : TemplateLoader.createBlankTemplate(options.id, options.name || options.id);

          const yaml = TemplateLoader.toYaml(template);

          if (options.output) {
            const { writeFileSync } = await import('fs');
            writeFileSync(options.output, yaml);
            console.log(chalk.green(`Exported to: ${options.output}`));
          } else {
            console.log(yaml);
          }
        } catch (error) {
          console.log(chalk.red('Export failed:'));
          console.error(error);
        }
        break;
      }

      default:
        console.log(chalk.yellow(`Unknown action: ${action}`));
        console.log(chalk.dim('Available actions: list, create, validate, export'));
    }
  });

// Enterprise: Team management
program
  .command('team <action>')
  .description('Manage team configuration (init, members, libraries)')
  .option('-i, --id <id>', 'Team or member ID')
  .option('-n, --name <name>', 'Name')
  .option('-e, --email <email>', 'Email')
  .option('-r, --role <role>', 'Role: owner, admin, member, viewer')
  .action(async (action, options) => {
    const { TeamConfigManager } = await import('./enterprise/team/index.js');
    const manager = new TeamConfigManager();

    switch (action) {
      case 'init': {
        console.log(chalk.blue('\n🏢 Initialize Team Configuration\n'));

        const id = options.id || 'my-team';
        const name = options.name || 'My Team';

        const config = manager.init(id, name);
        console.log(chalk.green('Team configuration created!'));
        console.log(`  ID: ${config.id}`);
        console.log(`  Name: ${config.name}`);
        console.log(`  Config: ${manager.getConfigPath()}`);
        break;
      }

      case 'info': {
        console.log(chalk.blue('\n🏢 Team Information\n'));

        const config = manager.get();
        if (!config) {
          console.log(chalk.dim('No team configuration found.'));
          console.log(chalk.dim('Run: blueprint team init'));
          return;
        }

        console.log(`  ID: ${config.id}`);
        console.log(`  Name: ${config.name}`);
        console.log(`  Members: ${config.members?.length || 0}`);
        console.log(`  Libraries: ${config.libraries?.length || 0}`);
        console.log(`  Audit: ${config.audit?.enabled ? 'enabled' : 'disabled'}`);
        break;
      }

      case 'add-member': {
        console.log(chalk.blue('\n👤 Add Team Member\n'));

        if (!options.id || !options.name) {
          console.log(chalk.red('Error: --id and --name required'));
          return;
        }

        try {
          manager.addMember({
            id: options.id,
            name: options.name,
            email: options.email,
            role: options.role || 'member',
          });
          console.log(chalk.green(`Added member: ${options.name}`));
        } catch (error) {
          console.log(chalk.red('Failed to add member:'));
          console.error(error);
        }
        break;
      }

      case 'remove-member': {
        console.log(chalk.blue('\n👤 Remove Team Member\n'));

        if (!options.id) {
          console.log(chalk.red('Error: --id required'));
          return;
        }

        const removed = manager.removeMember(options.id);
        if (removed) {
          console.log(chalk.green(`Removed member: ${options.id}`));
        } else {
          console.log(chalk.yellow(`Member not found: ${options.id}`));
        }
        break;
      }

      case 'list-members': {
        console.log(chalk.blue('\n👥 Team Members\n'));

        const members = manager.listMembers();
        if (members.length === 0) {
          console.log(chalk.dim('No team members.'));
          return;
        }

        for (const m of members) {
          console.log(`  ${chalk.cyan(m.id.padEnd(20))} ${m.name} (${m.role})`);
          if (m.email) console.log(chalk.dim(`    ${m.email}`));
        }
        break;
      }

      case 'audit': {
        console.log(chalk.blue('\n📊 Audit Log\n'));

        const { AuditTrail } = await import('./enterprise/team/index.js');
        const config = manager.get();

        const audit = config
          ? AuditTrail.fromTeamConfig(config)
          : new AuditTrail();

        const stats = audit.getStats();
        console.log(`  Total generations: ${stats.totalGenerations}`);
        console.log(`  Successful: ${stats.successfulGenerations}`);
        console.log(`  Failed: ${stats.failedGenerations}`);
        console.log(`  Avg duration: ${Math.round(stats.averageDuration)}ms`);

        if (stats.recentActivity.length > 0) {
          console.log(chalk.yellow('\nRecent activity:'));
          for (const entry of stats.recentActivity.slice(0, 5)) {
            console.log(`  ${chalk.dim(entry.timestamp)} ${entry.action} ${entry.template}`);
          }
        }
        break;
      }

      default:
        console.log(chalk.yellow(`Unknown action: ${action}`));
        console.log(chalk.dim('Available actions: init, info, add-member, remove-member, list-members, audit'));
    }
  });

// Enterprise: Model configuration
program
  .command('model <action>')
  .description('Configure AI models (list, use, test)')
  .option('-p, --provider <provider>', 'Provider: claude, openai, gemini, ollama')
  .option('-m, --model <model>', 'Model ID or alias')
  .option('-k, --key <key>', 'API key')
  .option('--prompt <prompt>', 'Test prompt')
  .action(async (action, options) => {
    const { ModelRegistry } = await import('./enterprise/models/index.js');

    switch (action) {
      case 'list': {
        console.log(chalk.blue('\n🤖 Available Models\n'));

        const registry = new ModelRegistry();
        const providers = registry.listProviders();

        for (const p of providers) {
          const status = p.configured ? chalk.green('✓') : chalk.red('✗');
          console.log(`  ${status} ${chalk.cyan(p.name.padEnd(10))} ${p.configured ? 'configured' : 'not configured'}`);
        }

        console.log(chalk.dim('\nSet API keys via environment variables:'));
        console.log(chalk.dim('  ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY'));
        break;
      }

      case 'test': {
        console.log(chalk.blue('\n🧪 Test Model\n'));

        const provider = options.provider || 'claude';
        const prompt = options.prompt || 'Say hello in one sentence.';

        const registry = new ModelRegistry();
        const providerInstance = registry.getProvider(provider);

        if (!providerInstance) {
          console.log(chalk.red(`Unknown provider: ${provider}`));
          return;
        }

        if (!providerInstance.isConfigured()) {
          console.log(chalk.red(`Provider ${provider} is not configured.`));
          console.log(chalk.dim('Set the appropriate API key environment variable.'));
          return;
        }

        const spinner = ora(`Testing ${provider}...`).start();

        try {
          const response = await registry.complete(
            {
              messages: [{ role: 'user', content: prompt }],
              maxTokens: 100,
            },
            provider
          );

          spinner.succeed(chalk.green('Model responded!'));
          console.log(`\n${chalk.cyan('Response:')} ${response.content}`);

          if (response.usage) {
            console.log(chalk.dim(`\nTokens: ${response.usage.promptTokens} in, ${response.usage.completionTokens} out`));
          }
        } catch (error) {
          spinner.fail(chalk.red('Test failed'));
          console.error(error);
        }
        break;
      }

      case 'info': {
        console.log(chalk.blue('\n📋 Model Information\n'));

        const modelId = options.model || 'claude';

        const registry = new ModelRegistry();
        const { provider, model } = registry.resolveAlias(modelId);

        console.log(`  Alias: ${modelId}`);
        console.log(`  Provider: ${provider}`);
        console.log(`  Model: ${model}`);

        const info = await registry.getModelInfo(model);
        if (info) {
          if (info.contextWindow) console.log(`  Context: ${info.contextWindow.toLocaleString()} tokens`);
          if (info.maxOutput) console.log(`  Max output: ${info.maxOutput.toLocaleString()} tokens`);
          if (info.capabilities) console.log(`  Capabilities: ${info.capabilities.join(', ')}`);
          if (info.pricing) {
            console.log(`  Pricing: $${info.pricing.input}/M in, $${info.pricing.output}/M out`);
          }
        }
        break;
      }

      default:
        console.log(chalk.yellow(`Unknown action: ${action}`));
        console.log(chalk.dim('Available actions: list, test, info'));
    }
  });

/**
 * Handle Linear export
 */
async function handleLinearExport(options: Record<string, unknown>) {
  console.log(chalk.blue('\n📋 Intent Blueprint - Linear Export\n'));

  const { LinearExporter } = await import('./integrations/linear/index.js');

  // Get Linear API key
  const apiKey = (options.token as string) || process.env.LINEAR_API_KEY;
  if (!apiKey) {
    console.log(chalk.red('Error: Linear API key required'));
    console.log(chalk.dim('Use --token or set LINEAR_API_KEY environment variable'));
    console.log(chalk.dim('Get your API key from: https://linear.app/settings/api'));
    process.exit(1);
  }

  // Get team ID
  let teamId = options.team as string;
  if (!teamId) {
    // Try to list teams and let user select
    console.log(chalk.dim('No team specified. Fetching available teams...\n'));

    const { LinearClient } = await import('./integrations/linear/index.js');
    const tempClient = new LinearClient({ apiKey, teamId: '' });

    try {
      const teams = await tempClient.listTeams();

      if (teams.length === 0) {
        console.log(chalk.red('Error: No teams found in your Linear workspace'));
        process.exit(1);
      }

      if (teams.length === 1) {
        teamId = teams[0].id;
        console.log(chalk.dim(`Using team: ${teams[0].name} (${teams[0].key})\n`));
      } else {
        const answer = await inquirer.prompt([
          {
            type: 'list',
            name: 'team',
            message: 'Select team:',
            choices: teams.map((t) => ({ name: `${t.name} (${t.key})`, value: t.id })),
          },
        ]);
        teamId = answer.team;
      }
    } catch (error) {
      console.log(chalk.red('Error: Could not fetch teams. Check your API key.'));
      console.error(error);
      process.exit(1);
    }
  }

  // Read generated docs
  const docsDir = (options.docs as string) || './docs';
  const { readdirSync, readFileSync, existsSync } = await import('fs');
  const { join } = await import('path');

  if (!existsSync(docsDir)) {
    console.log(chalk.red(`Error: Docs directory not found: ${docsDir}`));
    console.log(chalk.dim('Generate docs first with: blueprint generate'));
    process.exit(1);
  }

  // Find project folder
  const projects = readdirSync(docsDir).filter((f) => {
    const path = join(docsDir, f);
    return existsSync(path) && readdirSync(path).some((file) => file.endsWith('.md'));
  });

  if (projects.length === 0) {
    console.log(chalk.red('Error: No documentation projects found'));
    process.exit(1);
  }

  let projectDir = projects[0];
  if (projects.length > 1 && !options.project) {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'project',
        message: 'Select project:',
        choices: projects,
      },
    ]);
    projectDir = answer.project;
  } else if (options.project) {
    projectDir = options.project as string;
  }

  const projectPath = join(docsDir, projectDir);
  const files = readdirSync(projectPath).filter((f) => f.endsWith('.md'));

  const documents = files.map((f) => ({
    name: f.replace('.md', '').replace(/-/g, ' '),
    content: readFileSync(join(projectPath, f), 'utf-8'),
  }));

  console.log(`Found ${documents.length} documents in ${projectDir}\n`);

  const exporter = new LinearExporter({ apiKey, teamId });

  if (options.dryRun) {
    console.log(chalk.yellow('Dry run - showing what would be created:\n'));
    const preview = await exporter.preview(documents, {
      createProject: options.createProject as boolean,
      projectName: projectDir,
      createCycles: options.milestones !== false,
      syncLabels: options.labels !== false,
      dryRun: true,
    });

    console.log(chalk.cyan('Labels:'), preview.labels.length);
    if (preview.project) {
      console.log(chalk.cyan('Project:'), preview.project.name);
    }
    console.log(chalk.cyan('Cycles:'), preview.cycles.length);
    console.log(chalk.cyan('Issues:'), preview.issues.length);

    if (preview.issues.length > 0) {
      console.log(chalk.dim('\nSample issues:'));
      for (const issue of preview.issues.slice(0, 5)) {
        console.log(`  ${chalk.dim('•')} ${issue.title}`);
      }
      if (preview.issues.length > 5) {
        console.log(chalk.dim(`  ... and ${preview.issues.length - 5} more`));
      }
    }
    return;
  }

  const spinner = ora('Exporting to Linear...').start();

  try {
    const result = await exporter.export(documents, {
      createProject: options.createProject as boolean,
      projectName: projectDir,
      createCycles: options.milestones !== false,
      syncLabels: options.labels !== false,
      dryRun: false,
    });

    if (result.errors.length === 0) {
      spinner.succeed(chalk.green('Export complete!'));
      console.log(`\n  Labels synced: ${result.labels.length}`);
      if (result.project) {
        console.log(`  Project created: ${result.project.name}`);
      }
      console.log(`  Cycles created: ${result.cycles.length}`);
      console.log(`  Issues created: ${result.issues.length}`);

      if (result.issues.length > 0) {
        console.log(chalk.cyan('\nCreated issues:'));
        for (const issue of result.issues.slice(0, 5)) {
          console.log(`  ${issue.identifier}: ${issue.title}`);
          if (issue.url !== '#') {
            console.log(chalk.dim(`    ${issue.url}`));
          }
        }
        if (result.issues.length > 5) {
          console.log(chalk.dim(`  ... and ${result.issues.length - 5} more`));
        }
      }
    } else {
      spinner.fail(chalk.red('Export completed with errors'));
      console.log(`\n  Issues created: ${result.issues.length}`);
      console.log(chalk.red('\nErrors:'));
      for (const error of result.errors) {
        console.log(chalk.red(`  ${error}`));
      }
    }
  } catch (error) {
    spinner.fail(chalk.red('Export failed'));
    console.error(error);
    process.exit(1);
  }
}

/**
 * Handle Jira export
 */
async function handleJiraExport(options: Record<string, unknown>) {
  console.log(chalk.blue('\n🎫 Intent Blueprint - Jira Export\n'));

  const { JiraExporter, JiraClient } = await import('./integrations/jira/index.js');

  // Get Jira config
  const apiToken = (options.token as string) || process.env.JIRA_API_TOKEN;
  let baseUrl = options.baseUrl as string;
  let email = options.email as string;
  let projectKey = options.projectKey as string;

  if (!apiToken) {
    console.log(chalk.red('Error: Jira API token required'));
    console.log(chalk.dim('Use --token or set JIRA_API_TOKEN environment variable'));
    console.log(chalk.dim('Get your API token from: https://id.atlassian.com/manage-profile/security/api-tokens'));
    process.exit(1);
  }

  // Prompt for missing Jira config
  if (!baseUrl || !email || !projectKey) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'baseUrl',
        message: 'Jira instance URL (e.g., https://your-domain.atlassian.net):',
        when: !baseUrl,
        validate: (input: string) => input.startsWith('http') || 'Must be a valid URL',
      },
      {
        type: 'input',
        name: 'email',
        message: 'Your Jira email:',
        when: !email,
        validate: (input: string) => input.includes('@') || 'Must be a valid email',
      },
      {
        type: 'input',
        name: 'projectKey',
        message: 'Jira project key (e.g., PROJ):',
        when: !projectKey,
        validate: (input: string) => input.length > 0 || 'Required',
      },
    ]);
    baseUrl = baseUrl || answers.baseUrl;
    email = email || answers.email;
    projectKey = projectKey || answers.projectKey;
  }

  // Verify connection
  try {
    const tempClient = new JiraClient({ baseUrl, email, apiToken, projectKey });
    const user = await tempClient.verify();
    console.log(chalk.dim(`Connected as: ${user.displayName}\n`));
  } catch (error) {
    console.log(chalk.red('Error: Could not connect to Jira. Check your credentials.'));
    console.error(error);
    process.exit(1);
  }

  // Read generated docs
  const docsDir = (options.docs as string) || './docs';
  const { readdirSync, readFileSync, existsSync } = await import('fs');
  const { join } = await import('path');

  if (!existsSync(docsDir)) {
    console.log(chalk.red(`Error: Docs directory not found: ${docsDir}`));
    console.log(chalk.dim('Generate docs first with: blueprint generate'));
    process.exit(1);
  }

  // Find project folder
  const projects = readdirSync(docsDir).filter((f) => {
    const path = join(docsDir, f);
    return existsSync(path) && readdirSync(path).some((file) => file.endsWith('.md'));
  });

  if (projects.length === 0) {
    console.log(chalk.red('Error: No documentation projects found'));
    process.exit(1);
  }

  let projectDir = projects[0];
  if (projects.length > 1 && !options.project) {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'project',
        message: 'Select project:',
        choices: projects,
      },
    ]);
    projectDir = answer.project;
  } else if (options.project) {
    projectDir = options.project as string;
  }

  const projectPath = join(docsDir, projectDir);
  const files = readdirSync(projectPath).filter((f) => f.endsWith('.md'));

  const documents = files.map((f) => ({
    name: f.replace('.md', '').replace(/-/g, ' '),
    content: readFileSync(join(projectPath, f), 'utf-8'),
  }));

  console.log(`Found ${documents.length} documents in ${projectDir}\n`);

  const exporter = new JiraExporter({ baseUrl, email, apiToken, projectKey });

  if (options.dryRun) {
    console.log(chalk.yellow('Dry run - showing what would be created:\n'));
    const preview = await exporter.preview(documents, {
      createEpic: options.createEpic as boolean,
      epicName: projectDir,
      createSprints: options.milestones !== false,
      createVersions: options.createVersions as boolean,
      syncComponents: options.labels !== false,
      addLabels: options.labels !== false,
      dryRun: true,
    });

    console.log(chalk.cyan('Components:'), preview.components.length);
    if (preview.epics.length > 0) {
      console.log(chalk.cyan('Epic:'), preview.epics[0].fields.summary);
    }
    if (preview.versions.length > 0) {
      console.log(chalk.cyan('Versions:'), preview.versions.map(v => v.name).join(', '));
    }
    console.log(chalk.cyan('Sprints:'), preview.sprints.length);
    console.log(chalk.cyan('Stories:'), preview.stories.length);
    console.log(chalk.cyan('Sub-tasks:'), preview.tasks.length);

    if (preview.stories.length > 0) {
      console.log(chalk.dim('\nSample stories:'));
      for (const story of preview.stories.slice(0, 5)) {
        console.log(`  ${chalk.dim('•')} ${story.fields.summary}`);
      }
      if (preview.stories.length > 5) {
        console.log(chalk.dim(`  ... and ${preview.stories.length - 5} more`));
      }
    }
    return;
  }

  const spinner = ora('Exporting to Jira...').start();

  try {
    const result = await exporter.export(documents, {
      createEpic: options.createEpic as boolean,
      epicName: projectDir,
      createSprints: options.milestones !== false,
      createVersions: options.createVersions as boolean,
      syncComponents: options.labels !== false,
      addLabels: options.labels !== false,
      dryRun: false,
    });

    if (result.errors.length === 0) {
      spinner.succeed(chalk.green('Export complete!'));
      console.log(`\n  Components synced: ${result.components.length}`);
      if (result.epics.length > 0) {
        console.log(`  Epic created: ${result.epics[0].key}`);
      }
      console.log(`  Versions created: ${result.versions.length}`);
      console.log(`  Sprints created: ${result.sprints.length}`);
      console.log(`  Stories created: ${result.stories.length}`);
      console.log(`  Sub-tasks created: ${result.tasks.length}`);

      if (result.stories.length > 0) {
        console.log(chalk.cyan('\nCreated stories:'));
        for (const story of result.stories.slice(0, 5)) {
          console.log(`  ${story.key}: ${story.fields.summary}`);
          console.log(chalk.dim(`    ${baseUrl}/browse/${story.key}`));
        }
        if (result.stories.length > 5) {
          console.log(chalk.dim(`  ... and ${result.stories.length - 5} more`));
        }
      }
    } else {
      spinner.fail(chalk.red('Export completed with errors'));
      console.log(`\n  Stories created: ${result.stories.length}`);
      console.log(chalk.red('\nErrors:'));
      for (const error of result.errors) {
        console.log(chalk.red(`  ${error}`));
      }
    }
  } catch (error) {
    spinner.fail(chalk.red('Export failed'));
    console.error(error);
    process.exit(1);
  }
}

/**
 * Handle Notion export
 */
async function handleNotionExport(options: Record<string, unknown>) {
  console.log(chalk.blue('\n📝 Intent Blueprint - Notion Export\n'));

  const { NotionExporter, NotionClient } = await import('./integrations/notion/index.js');

  // Get Notion API key
  const apiKey = (options.token as string) || process.env.NOTION_API_KEY;
  if (!apiKey) {
    console.log(chalk.red('Error: Notion API key required'));
    console.log(chalk.dim('Use --token or set NOTION_API_KEY environment variable'));
    console.log(chalk.dim('Get your integration token from: https://www.notion.so/my-integrations'));
    process.exit(1);
  }

  let parentPageId = options.pageId as string;
  let databaseId = options.databaseId as string;

  // Verify connection
  try {
    const tempClient = new NotionClient({ apiKey });
    await tempClient.verify();
    console.log(chalk.dim('Connected to Notion\n'));
  } catch (error) {
    console.log(chalk.red('Error: Could not connect to Notion. Check your API key.'));
    console.error(error);
    process.exit(1);
  }

  // If no parent page or database specified, try to list available pages
  if (!parentPageId && !databaseId) {
    console.log(chalk.dim('No parent page or database specified. Searching for accessible pages...\n'));

    const tempClient = new NotionClient({ apiKey });

    try {
      const pages = await tempClient.listPages();
      const databases = await tempClient.listDatabases();

      if (pages.length === 0 && databases.length === 0) {
        console.log(chalk.red('Error: No pages or databases accessible to this integration.'));
        console.log(chalk.dim('Make sure you\'ve shared a page with your integration in Notion.'));
        process.exit(1);
      }

      // Let user choose
      const choices: Array<{ name: string; value: { type: string; id: string } }> = [];

      for (const page of pages.slice(0, 10)) {
        const title = (page.properties.title as { title?: Array<{ plain_text?: string }> })?.title?.[0]?.plain_text || 'Untitled';
        choices.push({ name: `📄 ${title} (page)`, value: { type: 'page', id: page.id } });
      }

      for (const db of databases.slice(0, 10)) {
        const title = db.title?.[0]?.plain_text || 'Untitled';
        choices.push({ name: `🗃️ ${title} (database)`, value: { type: 'database', id: db.id } });
      }

      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'target',
          message: 'Select where to export documents:',
          choices,
        },
      ]);

      if (answer.target.type === 'page') {
        parentPageId = answer.target.id;
      } else {
        databaseId = answer.target.id;
      }
    } catch (error) {
      console.log(chalk.red('Error: Could not list pages/databases.'));
      console.error(error);
      process.exit(1);
    }
  }

  // Read generated docs
  const docsDir = (options.docs as string) || './docs';
  const { readdirSync, readFileSync, existsSync } = await import('fs');
  const { join } = await import('path');

  if (!existsSync(docsDir)) {
    console.log(chalk.red(`Error: Docs directory not found: ${docsDir}`));
    console.log(chalk.dim('Generate docs first with: blueprint generate'));
    process.exit(1);
  }

  // Find project folder
  const projects = readdirSync(docsDir).filter((f) => {
    const path = join(docsDir, f);
    return existsSync(path) && readdirSync(path).some((file) => file.endsWith('.md'));
  });

  if (projects.length === 0) {
    console.log(chalk.red('Error: No documentation projects found'));
    process.exit(1);
  }

  let projectDir = projects[0];
  if (projects.length > 1 && !options.project) {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'project',
        message: 'Select project:',
        choices: projects,
      },
    ]);
    projectDir = answer.project;
  } else if (options.project) {
    projectDir = options.project as string;
  }

  const projectPath = join(docsDir, projectDir);
  const files = readdirSync(projectPath).filter((f) => f.endsWith('.md'));

  const documents = files.map((f) => ({
    name: f.replace('.md', '').replace(/-/g, ' '),
    content: readFileSync(join(projectPath, f), 'utf-8'),
  }));

  console.log(`Found ${documents.length} documents in ${projectDir}\n`);

  const exporter = new NotionExporter({
    apiKey,
    parentPageId,
    databaseId,
  });

  if (options.dryRun) {
    console.log(chalk.yellow('Dry run - showing what would be created:\n'));
    const preview = await exporter.preview(documents, {
      createDatabase: options.createDatabase as boolean,
      databaseTitle: projectDir,
      parentPageId,
      addCategory: true,
      addStatus: true,
      convertContent: true,
      dryRun: true,
    });

    if (preview.database) {
      console.log(chalk.cyan('Database:'), preview.database.title[0]?.text?.content || 'Blueprint Documents');
    }
    console.log(chalk.cyan('Pages:'), preview.pages.length);

    if (preview.pages.length > 0) {
      console.log(chalk.dim('\nSample pages:'));
      for (const page of preview.pages.slice(0, 5)) {
        const title = (page.properties.Name as { title?: Array<{ text?: { content?: string } }> })?.title?.[0]?.text?.content || 'Untitled';
        console.log(`  ${chalk.dim('•')} ${title}`);
      }
      if (preview.pages.length > 5) {
        console.log(chalk.dim(`  ... and ${preview.pages.length - 5} more`));
      }
    }
    return;
  }

  const spinner = ora('Exporting to Notion...').start();

  try {
    const result = await exporter.export(documents, {
      createDatabase: options.createDatabase as boolean,
      databaseTitle: projectDir,
      parentPageId,
      addCategory: true,
      addStatus: true,
      convertContent: true,
      dryRun: false,
    });

    if (result.errors.length === 0) {
      spinner.succeed(chalk.green('Export complete!'));
      if (result.database) {
        console.log(`\n  Database created: ${result.database.title[0]?.text?.content || 'Blueprint Documents'}`);
        console.log(chalk.dim(`    ${result.database.url}`));
      }
      console.log(`  Pages created: ${result.pages.length}`);

      if (result.pages.length > 0) {
        console.log(chalk.cyan('\nCreated pages:'));
        for (const page of result.pages.slice(0, 5)) {
          const title = (page.properties.Name as { title?: Array<{ text?: { content?: string } }> })?.title?.[0]?.text?.content ||
                       (page.properties.title as { title?: Array<{ text?: { content?: string } }> })?.title?.[0]?.text?.content ||
                       'Untitled';
          console.log(`  ${title}`);
          console.log(chalk.dim(`    ${page.url}`));
        }
        if (result.pages.length > 5) {
          console.log(chalk.dim(`  ... and ${result.pages.length - 5} more`));
        }
      }
    } else {
      spinner.fail(chalk.red('Export completed with errors'));
      console.log(`\n  Pages created: ${result.pages.length}`);
      console.log(chalk.red('\nErrors:'));
      for (const error of result.errors) {
        console.log(chalk.red(`  ${error}`));
      }
    }
  } catch (error) {
    spinner.fail(chalk.red('Export failed'));
    console.error(error);
    process.exit(1);
  }
}

program.parse();
