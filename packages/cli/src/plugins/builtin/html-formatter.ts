/**
 * HTML Formatter Plugin
 * Built-in formatter for HTML output
 */

import type { FormatterPlugin, FormatterOptions, PluginContext } from '../types.js';

/**
 * Default HTML template
 */
const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <style>
    :root {
      --bg: #ffffff;
      --text: #1a1a2e;
      --heading: #16213e;
      --link: #0f3460;
      --code-bg: #f4f4f4;
      --border: #e0e0e0;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1a1a2e;
        --text: #e0e0e0;
        --heading: #f1f1f1;
        --link: #82c4ff;
        --code-bg: #16213e;
        --border: #333;
      }
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
      background: var(--bg);
      color: var(--text);
    }
    h1, h2, h3, h4, h5, h6 {
      color: var(--heading);
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    h1 { font-size: 2.5rem; border-bottom: 2px solid var(--border); padding-bottom: 0.5rem; }
    h2 { font-size: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.3rem; }
    h3 { font-size: 1.5rem; }
    a { color: var(--link); text-decoration: none; }
    a:hover { text-decoration: underline; }
    code {
      background: var(--code-bg);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: 'SF Mono', Consolas, monospace;
      font-size: 0.9em;
    }
    pre {
      background: var(--code-bg);
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
    }
    pre code { background: none; padding: 0; }
    blockquote {
      border-left: 4px solid var(--link);
      margin: 1rem 0;
      padding: 0.5rem 1rem;
      background: var(--code-bg);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 0.75rem;
      text-align: left;
    }
    th { background: var(--code-bg); }
    ul, ol { padding-left: 1.5rem; }
    li { margin: 0.5rem 0; }
    hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }
    .toc { background: var(--code-bg); padding: 1rem; border-radius: 8px; margin-bottom: 2rem; }
    .toc ul { list-style: none; padding-left: 1rem; }
    .toc li { margin: 0.3rem 0; }
    .meta { color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
    {{styles}}
  </style>
</head>
<body>
  {{content}}
</body>
</html>`;

/**
 * Simple Markdown to HTML converter
 */
function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Escape HTML
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (fenced)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // Horizontal rules
  html = html.replace(/^[-*_]{3,}$/gm, '<hr>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

  // Tables
  html = html.replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)+)/g, (_match, header, rows) => {
    const headerCells = header.split('|').map((cell: string) => cell.trim()).filter(Boolean);
    const headerHtml = headerCells.map((cell: string) => `<th>${cell}</th>`).join('');
    const rowsHtml = rows.trim().split('\n').map((row: string) => {
      const cells = row.split('|').map((cell: string) => cell.trim()).filter(Boolean);
      return `<tr>${cells.map((cell: string) => `<td>${cell}</td>`).join('')}</tr>`;
    }).join('\n');
    return `<table>\n<thead><tr>${headerHtml}</tr></thead>\n<tbody>${rowsHtml}</tbody>\n</table>`;
  });

  // Unordered lists
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.+<\/li>\n?)+/g, '<ul>$&</ul>\n');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Paragraphs
  html = html.split('\n\n').map(para => {
    if (para.trim() && !para.match(/^<(h[1-6]|ul|ol|li|pre|blockquote|table|hr)/)) {
      return `<p>${para.trim()}</p>`;
    }
    return para;
  }).join('\n\n');

  return html;
}

/**
 * HTML formatter plugin
 */
export const htmlFormatter: FormatterPlugin = {
  meta: {
    id: 'intent-html-formatter',
    name: 'HTML Formatter',
    description: 'Format output as styled HTML document',
    version: '1.0.0',
    author: { name: 'Intent Solutions' },
    type: 'formatter',
    tags: ['html', 'format', 'builtin'],
    config: {
      type: 'object',
      properties: {
        includeStyles: {
          type: 'boolean',
          description: 'Include built-in CSS styles',
          default: true,
        },
        darkMode: {
          type: 'boolean',
          description: 'Force dark mode',
          default: false,
        },
        customTemplate: {
          type: 'string',
          description: 'Custom HTML template',
        },
      },
    },
  },

  async init(_context: PluginContext): Promise<void> {
    // No initialization needed
  },

  async format(content: string, options?: FormatterOptions): Promise<string> {
    // Convert markdown to HTML
    const htmlContent = markdownToHtml(content);

    // Use template
    let result = DEFAULT_TEMPLATE
      .replace('{{title}}', options?.title || 'Document')
      .replace('{{styles}}', options?.styles || '')
      .replace('{{content}}', htmlContent);

    return result;
  },

  getExtension(): string {
    return 'html';
  },

  getMimeType(): string {
    return 'text/html';
  },
};

export default htmlFormatter;
