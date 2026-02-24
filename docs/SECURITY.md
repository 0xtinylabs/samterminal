# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

Only the latest version of SamTerminal receives security updates. We recommend always running the most recent release.

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please use [GitHub Security Advisories](https://github.com/0xtinylabs/samterminal/security/advisories/new) to privately report the vulnerability.

### What to Include

- A description of the vulnerability
- Steps to reproduce the issue
- The potential impact
- Any suggested fixes (optional)

### What to Expect

| Timeframe      | Action                                             |
| -------------- | -------------------------------------------------- |
| 24 hours       | Acknowledgment of your report                      |
| 72 hours       | Initial assessment and severity classification     |
| 7 days         | Detailed response with remediation plan             |
| 30 days        | Fix deployed (for critical/high severity issues)   |

We will keep you informed throughout the process and credit you in the advisory (unless you prefer to remain anonymous).

## Scope

The following are in scope for security reports:

- **API services** - All NestJS and Go microservices
- **Database security** - SQL injection, unauthorized access
- **Authentication and authorization** - Token handling, access control
- **Infrastructure** - Docker configuration, network exposure
- **Dependencies** - Vulnerabilities in third-party packages

### Out of Scope

- Denial of service attacks against development/staging environments
- Social engineering attacks
- Issues in third-party services we integrate with (report those to the respective maintainers)

## Security Best Practices

When contributing to SamTerminal, please follow these practices:

- Never commit secrets, API keys, or private keys
- Use environment variables for all sensitive configuration
- Validate and sanitize all user inputs
- Use parameterized queries (Prisma handles this by default)
- Keep dependencies up to date
- Follow the principle of least privilege for database and service access

## Disclosure Policy

We follow a coordinated disclosure process:

1. Reporter submits vulnerability privately
2. We confirm and assess the vulnerability
3. We develop and test a fix
4. We release the fix and publish an advisory
5. Reporter is credited (if desired)

We ask that you give us reasonable time to address the issue before any public disclosure.
