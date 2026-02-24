# Contributing to SamTerminal

Thank you for your interest in contributing to SamTerminal! This guide will help you get started.

## Table of Contents

- [Development Setup](#development-setup)
- [Branch Naming Convention](#branch-naming-convention)
- [Commit Message Format](#commit-message-format)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm 9+
- Docker and Docker Compose
- Go 1.24+ (for Go services)

### Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/samterminal/samterminal.git
   cd samterminal
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start development databases**

   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

4. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

5. **Run database migrations**

   ```bash
   pnpm db:migrate
   ```

6. **Start services in development mode**

   ```bash
   pnpm dev
   ```

## Branch Naming Convention

Use the following prefixes for branch names:

| Prefix      | Usage                                |
| ----------- | ------------------------------------ |
| `feature/`  | New features                         |
| `fix/`      | Bug fixes                            |
| `chore/`    | Maintenance, refactoring, tooling    |
| `docs/`     | Documentation changes                |
| `test/`     | Adding or updating tests             |

Examples:

- `feature/wallet-integration`
- `fix/token-price-rounding`
- `chore/upgrade-nestjs`

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat` - A new feature
- `fix` - A bug fix
- `docs` - Documentation only changes
- `style` - Formatting, missing semicolons, etc. (no code change)
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `perf` - Performance improvement
- `test` - Adding or correcting tests
- `chore` - Changes to the build process or tooling

### Examples

```
feat(swap): add slippage tolerance configuration
fix(notification): resolve duplicate webhook deliveries
chore(deps): upgrade prisma to v6
```

## Pull Request Process

1. **Create a branch** from `main` using the naming convention above.

2. **Make your changes** in small, focused commits.

3. **Write or update tests** to cover your changes.

4. **Ensure all checks pass** before requesting review:

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   ```

5. **Open a Pull Request** with:
   - A clear title following the commit message format
   - A description of what the PR does and why
   - Links to related issues (if applicable)
   - Screenshots or recordings for UI changes

6. **Address review feedback** promptly. Push new commits rather than force-pushing.

7. **Squash and merge** is the preferred merge strategy.

### PR Checklist

- [ ] Code follows the project coding standards
- [ ] Tests are added or updated
- [ ] TypeScript compiles without errors
- [ ] Linting passes
- [ ] No `console.log` statements in production code
- [ ] Environment variables are documented if added
- [ ] Breaking changes are clearly noted

## Coding Standards

### TypeScript

- **Strict mode** is enforced (`"strict": true` in tsconfig)
- **No `any` type** - use `unknown` and narrow with type guards
- **No `as` casting** without a documented reason
- **Use `async/await`** over callbacks and raw promises
- **Validate inputs** with `zod` or `valibot`
- **Use meaningful names** for variables, functions, and files
- **Single responsibility** - each function and module should do one thing

### General

- Use ES modules with explicit file extensions in imports
- Prefer `function` keyword over arrow functions for top-level declarations
- Add explicit return type annotations on exported functions
- Keep functions small and focused
- Handle errors explicitly - avoid swallowing exceptions
- Never hardcode secrets or API keys
- Use environment variables for configuration
- Use structured logging instead of `console.log`

### File Organization

```
services/<service-name>/
  src/
    modules/       # Feature modules
    common/        # Shared utilities
    config/        # Configuration
    prisma/        # Prisma schema and migrations
```

## Testing Requirements

### What to Test

- All business logic and service methods
- API endpoints (integration tests)
- Edge cases and error scenarios
- Database queries with meaningful data

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for a specific service
pnpm --filter <service-name> test

# Run tests in watch mode
pnpm --filter <service-name> test:watch
```

### Test Guidelines

- Write descriptive test names that explain the expected behavior
- Follow the Arrange-Act-Assert pattern
- Mock external dependencies (APIs, blockchain calls)
- Do not rely on test execution order
- Clean up test data after each test

## Questions?

If you have questions about contributing, please open an issue or start a [discussion](https://github.com/samterminal/samterminal/discussions) in the repository. For setup help, see the [Setup Guide](docs/SETUP.md).
