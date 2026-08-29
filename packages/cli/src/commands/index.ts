/**
 * CLI Commands
 * Export all command handlers
 */

export * from './marketplace.js';
export * from './analytics.js';

import { handleMarketplaceCommand } from './marketplace.js';
import { handleAnalyticsCommand } from './analytics.js';
import { VERSION } from '../version.js';

/**
 * Command registry
 */
export const commands = {
  pack: handleMarketplaceCommand,
  marketplace: handleMarketplaceCommand,
  analytics: handleAnalyticsCommand,
  stats: handleAnalyticsCommand,
};

/**
 * Command help text
 */
export const commandHelp = `
╭─────────────────────────────────────────────────────────────────╮
│                     INTENT BLUEPRINT CLI                        │
╰─────────────────────────────────────────────────────────────────╯

COMMANDS

  generate         Generate documentation from templates
  interview        Start AI-guided intake interview
  export           Export documents to external services

  pack             Manage template packs (marketplace)
    search         Search for template packs
    install        Install a template pack
    uninstall      Remove a template pack
    update         Update installed packs
    list           List installed packs
    featured       Show featured packs
    popular        Show popular packs
    info           Show pack details

  analytics        View usage analytics
    dashboard      Show analytics dashboard
    templates      Template usage statistics
    packs          Pack installation statistics
    errors         Error report
    activity       Activity chart
    export         Export analytics data
    cleanup        Clean up old data

  plugin           Manage plugins
    list           List installed plugins
    enable         Enable a plugin
    disable        Disable a plugin

  config           Configuration management
    init           Initialize project config
    set            Set configuration value
    get            Get configuration value

OPTIONS

  --help, -h       Show help
  --version, -v    Show version
  --quiet, -q      Suppress output
  --verbose        Verbose output
  --config=<path>  Use custom config file

EXAMPLES

  blueprint generate prd --template=fintech-prd
  blueprint pack install blueprint-soc2
  blueprint analytics --period=week
  blueprint export linear --project=my-project
`;

/**
 * Parse and route command
 */
export async function routeCommand(args: string[]): Promise<void> {
  const [command, ...rest] = args;

  // Handle help
  if (!command || command === '--help' || command === '-h') {
    console.log(commandHelp);
    return;
  }

  // Handle version
  if (command === '--version' || command === '-v') {
    console.log(`Intent Blueprint CLI v${VERSION}`);
    return;
  }

  // Route to command handler
  const handler = commands[command as keyof typeof commands];
  if (handler) {
    await handler(rest);
  } else {
    console.error(`Unknown command: ${command}`);
    console.log('\nRun `blueprint --help` for usage information.');
  }
}
