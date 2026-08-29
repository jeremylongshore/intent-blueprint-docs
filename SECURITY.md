# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.x     | Yes       |
| < 2.0   | No        |

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Email **security@intentsolutions.io** with:

1. Description of the vulnerability
2. Steps to reproduce
3. Affected version(s)
4. Impact assessment (if known)

We will acknowledge receipt within 48 hours and provide a timeline for a fix within 5 business days.

## Scope

The following are in scope:

- `@intentsolutions/blueprint` (CLI, core library, templates, and MCP binary)
- `@intentsolutions/blueprint-chatbots` (Slack and Discord adapters)
- Portable skill and host-adapter manifests
- Template content that could cause injection or data leakage

Out of scope:

- Third-party dependencies (report upstream)
- Social engineering
- Denial of service

## Disclosure

We follow coordinated disclosure. Once a fix is released, we will credit reporters (unless anonymity is requested) in the release notes.
