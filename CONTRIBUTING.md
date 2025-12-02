# Contributing to RepoDoc

First off, thank you for considering contributing to RepoDoc! It's people like you that make RepoDoc such a great tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@repodoc.dev.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Git
- GitHub account

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
```bash
git clone https://github.com/YOUR_USERNAME/repodoc.git
cd repodoc
```

3. Add upstream remote:
```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/repodoc.git
```

### Set Up Development Environment

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Set up database:
```bash
npm run db:generate
npm run db:migrate
```

4. Run development server:
```bash
npm run dev
```

## Development Process

### 1. Create a Branch

Create a branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Write clear, concise commit messages
- Follow our coding standards
- Add tests for new features
- Update documentation as needed

### 3. Keep Your Branch Updated

Regularly sync with upstream:

```bash
git fetch upstream
git rebase upstream/main
```

### 4. Test Your Changes

Before submitting:

```bash
# Run all tests
npm test

# Check types
npm run type-check

# Run linter
npm run lint

# Build the project
npm run build
```

## Pull Request Process

### Before Submitting

- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] Commit messages are clear
- [ ] Branch is up to date with main

### Submitting a Pull Request

1. Push your branch to your fork:
```bash
git push origin feature/your-feature-name
```

2. Go to GitHub and create a Pull Request

3. Fill out the PR template completely:
   - Description of changes
   - Related issue number
   - Screenshots (if UI changes)
   - Testing instructions

4. Wait for review and address feedback

### PR Review Process

1. **Automated Checks**: All CI/CD checks must pass
2. **Code Review**: At least one maintainer must approve
3. **Testing**: Changes must be tested
4. **Documentation**: Docs must be updated if needed

## Coding Standards

### TypeScript/JavaScript

```typescript
// ✅ Good
export async function fetchUser(userId: string): Promise<User> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

// ❌ Bad
export async function fetchUser(userId) {
  const user = await prisma.user.findUnique({where: {id: userId}})
  return user
}
```

### React Components

```typescript
// ✅ Good
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ 
  onClick, 
  children, 
  variant = 'primary',
  disabled = false 
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
}

// ❌ Bad
export function Button({ onClick, children, variant, disabled }) {
  return <button onClick={onClick}>{children}</button>
}
```

### Naming Conventions

- **Files**: `kebab-case.tsx`
- **Components**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

### Code Organization

```typescript
// 1. Imports
import React from 'react';
import { useState } from 'react';

// 2. Types/Interfaces
interface ComponentProps {
  // ...
}

// 3. Constants
const MAX_RETRIES = 3;

// 4. Helper functions
function helper() {
  // ...
}

// 5. Component
export function Component(props: ComponentProps) {
  // ...
}
```

## Testing Guidelines

### Unit Tests

```typescript
describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<ComponentName onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Integration Tests

```typescript
describe('API Integration', () => {
  it('fetches data successfully', async () => {
    const data = await fetchData();
    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);
  });
});
```

### Test Coverage

- Aim for >80% coverage
- Focus on critical paths
- Test edge cases
- Mock external dependencies

## Documentation

### Code Comments

```typescript
/**
 * Fetches user data from the database
 * @param userId - The unique identifier for the user
 * @returns Promise resolving to user object
 * @throws {Error} If user is not found
 */
export async function fetchUser(userId: string): Promise<User> {
  // Implementation
}
```

### README Updates

Update README.md if you:
- Add new features
- Change configuration
- Modify setup process
- Add dependencies

### API Documentation

Update API.md if you:
- Add new endpoints
- Modify request/response formats
- Change authentication
- Update rate limits

## Questions?

Feel free to ask questions:
- 📧 Email: parbhat@parbhat.dev

## Recognition

Contributors will be recognized in:
- README.md Contributors section
- Release notes
- Our website

Thank you for contributing to RepoDoc! 🎉

