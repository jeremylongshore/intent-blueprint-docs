# 004 - MCP Server Integration

## Purpose

The Blueprint MCP server is a thin, model-neutral stdio adapter over `@intentsolutions/blueprint`. It lists catalog entries, gathers intake, previews deterministic workbooks, and writes files only when the caller explicitly requests a write.

The MCP binary and core library are shipped in the same npm package. There is no separate `@intentsolutions/blueprint-mcp` package.

## Configuration

```json
{
  "mcpServers": {
    "blueprint-docs": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "--package", "@intentsolutions/blueprint@2.9.0", "blueprint-mcp"]
    }
  }
}
```

Client-specific placement and trust prompts vary, but the server contract does not depend on a particular model provider.

## Tools

### `blueprint_generate`

Renders the document set for `mvp`, `standard`, or `comprehensive` scope. Required fields are `projectName` and `projectDescription`; optional context includes audience, project type, and technology constraints. It returns previews by default. Set `writeFiles: true` to write to `outputDir`.

### `blueprint_interview`

Accepts `answers` and an action of `start`, `answer`, `complete`, or `analyze`. It returns the next question or an analysis that can be passed to generation.

### `blueprint_list_templates`

Lists the exact catalog and can filter by scope or category. Returned template IDs, rather than filesystem paths, are the customization boundary.

### `blueprint_customize`

Previews one catalog-bound workbook using `templateId`, `projectName`, `projectDescription`, and `customFields`. Unknown IDs and traversal strings fail with a structured MCP tool error.

## Side effects and errors

Only `blueprint_generate` with `writeFiles: true` writes to the filesystem. Listing, interviewing, customization, and generation previews are read-only. Export to GitHub, Linear, Jira, or Notion is not an MCP tool in this release.

Validation and runtime failures return `isError: true` with a human-readable message. The server never interprets a caller-supplied template ID as a path.

## Verification

Release gates must build the package, run core tests, smoke-test MCP initialization and `tools/list`, confirm the four declared tool schemas match their handlers, verify that traversal is rejected, and smoke-install the packed npm artifact before publication.
