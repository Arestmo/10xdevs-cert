# Git Workflow Guide

Comprehensive guide for Git workflow in this project using Feature Branch strategy.

## Overview

This project follows a **Feature Branch Workflow** with `develop` as the main integration branch and `master` as the production branch.

## Branch Structure

```
master (production)
  ↑
  └── develop (default branch)
        ├── feature/user-authentication
        ├── feature/dark-mode
        ├── fix/navigation-bug
        ├── test/e2e-setup
        └── refactor/api-layer
```

### Branch Types

| Prefix      | Purpose                          | Base Branch | Merge To  | Example                       |
| ----------- | -------------------------------- | ----------- | --------- | ----------------------------- |
| `feature/`  | New features                     | `develop`   | `develop` | `feature/user-authentication` |
| `fix/`      | Bug fixes                        | `develop`   | `develop` | `fix/login-validation`        |
| `test/`     | Testing infrastructure           | `develop`   | `develop` | `test/vitest-setup`           |
| `refactor/` | Code refactoring                 | `develop`   | `develop` | `refactor/api-services`       |
| `docs/`     | Documentation                    | `develop`   | `develop` | `docs/testing-guide`          |
| `hotfix/`   | Critical production fixes        | `master`    | `master`  | `hotfix/security-patch`       |
| `release/`  | Release preparation              | `develop`   | `master`  | `release/v1.0.0`              |
| `chore/`    | Maintenance tasks (deps, config) | `develop`   | `develop` | `chore/update-dependencies`   |

## Complete Workflow

### 1. Starting New Work

#### Check Current Status

```bash
# See your current branch and status
git status

# List all branches
git branch -a

# See what's changed
git log --oneline --graph --all --decorate -10
```

#### Create Feature Branch

```bash
# 1. Make sure you're on develop
git checkout develop

# 2. Get latest changes
git pull origin develop

# 3. Create and switch to your feature branch
git checkout -b feature/your-feature-name

# Alternative: do all in one command
git checkout develop && git pull origin develop && git checkout -b feature/your-feature-name
```

### 2. Working on Your Feature

#### Making Changes

```bash
# 1. Make your code changes
# ... edit files ...

# 2. Check what changed
git status
git diff

# 3. Stage your changes
git add .
# or stage specific files
git add src/components/Button.tsx

# 4. Commit with conventional commit message
git commit -m "feat: add dark mode toggle to settings"

# 5. Push to remote (first time)
git push -u origin feature/your-feature-name

# Subsequent pushes
git push
```

#### Commit Message Examples

```bash
# Features
git commit -m "feat: add user authentication system"
git commit -m "feat(api): implement JWT token refresh"

# Bug Fixes
git commit -m "fix: resolve navigation menu overlap on mobile"
git commit -m "fix(forms): correct email validation regex"

# Tests
git commit -m "test: add unit tests for Button component"
git commit -m "test(e2e): add accessibility tests for homepage"

# Refactoring
git commit -m "refactor: simplify authentication logic"
git commit -m "refactor(api): extract service layer from components"

# Documentation
git commit -m "docs: update testing guide with examples"
git commit -m "docs(api): add JSDoc comments to service functions"

# Chores
git commit -m "chore: update dependencies to latest versions"
git commit -m "chore(config): add coverage thresholds to vitest"
```

### 3. Keeping Your Branch Updated

#### Strategy 1: Merge (Preserves History)

```bash
# Get latest develop changes
git checkout develop
git pull origin develop

# Return to your feature branch
git checkout feature/your-feature-name

# Merge develop into your branch
git merge develop

# Resolve conflicts if any
# ... edit conflicted files ...
git add .
git commit -m "merge: resolve conflicts with develop"

# Push updated branch
git push
```

#### Strategy 2: Rebase (Cleaner History)

```bash
# Get latest develop changes
git checkout develop
git pull origin develop

# Return to your feature branch
git checkout feature/your-feature-name

# Rebase on top of develop
git rebase develop

# Resolve conflicts if any (for each commit)
# ... edit conflicted files ...
git add .
git rebase --continue

# Push with force (rewrites history)
git push --force-with-lease
```

**When to use which:**

- **Merge**: Safer, preserves exact history, better for collaborative branches
- **Rebase**: Cleaner history, better for solo feature branches that haven't been reviewed yet

### 4. Creating a Pull Request

#### Before Creating PR

```bash
# 1. Make sure branch is up to date
git pull origin develop

# 2. Run tests
npm test
npm run test:e2e

# 3. Run linting
npm run lint

# 4. Check build
npm run build

# 5. Push final changes
git push
```

#### Create PR via GitHub CLI

```bash
# Create PR to develop
gh pr create --base develop --title "feat: add dark mode toggle" --body "
## Summary
- Implemented dark mode toggle in settings
- Added theme context provider
- Updated all components to support dark mode

## Test Plan
- [x] Manual testing of theme switching
- [x] Unit tests for theme context
- [x] Accessibility tests pass

## Screenshots
[Add screenshots if applicable]
"

# Or use interactive mode
gh pr create --base develop
```

#### Create PR via Web Interface

1. Go to GitHub repository
2. Click "Pull Requests" → "New Pull Request"
3. Set base: `develop` ← compare: `feature/your-feature-name`
4. Fill in title and description
5. Add reviewers if needed
6. Create Pull Request

### 5. After PR is Merged

```bash
# 1. Switch to develop
git checkout develop

# 2. Pull latest changes (includes your merged feature)
git pull origin develop

# 3. Delete local feature branch
git branch -d feature/your-feature-name

# 4. (Optional) Delete remote feature branch
git push origin --delete feature/your-feature-name

# Or delete via GitHub CLI
gh pr close <PR_NUMBER> --delete-branch
```

## Common Scenarios

### Scenario 1: Need to Switch Features Mid-Work

```bash
# Save current work without committing
git stash save "WIP: dark mode toggle"

# Switch to develop and create new branch
git checkout develop
git pull origin develop
git checkout -b feature/urgent-fix

# ... work on urgent fix ...

# Return to original feature
git checkout feature/dark-mode

# Restore saved work
git stash pop
```

### Scenario 2: Made Commits on Wrong Branch

```bash
# If you committed on develop instead of feature branch

# 1. Create feature branch (doesn't switch)
git branch feature/your-feature-name

# 2. Reset develop to match origin
git reset --hard origin/develop

# 3. Switch to feature branch (your commits are there)
git checkout feature/your-feature-name
```

### Scenario 3: Fixing Mistakes in Last Commit

```bash
# Fix commit message
git commit --amend -m "feat: corrected commit message"

# Add forgotten files to last commit
git add forgotten-file.ts
git commit --amend --no-edit

# Push amended commit (if already pushed)
git push --force-with-lease
```

### Scenario 4: Need to Combine Multiple Commits

```bash
# Interactive rebase to squash last 3 commits
git rebase -i HEAD~3

# In editor, change 'pick' to 'squash' for commits to combine
# Save and close editor
# Edit combined commit message
# Save and close

# Push squashed commits
git push --force-with-lease
```

### Scenario 5: Resolve Merge Conflicts

```bash
# During merge or rebase, if conflicts occur:

# 1. See which files have conflicts
git status

# 2. Open conflicted files and resolve conflicts
# Look for markers: <<<<<<<, =======, >>>>>>>
# Edit files to keep desired changes

# 3. Mark as resolved
git add resolved-file.ts

# 4. Continue merge or rebase
git merge --continue
# or
git rebase --continue

# If you want to abort
git merge --abort
# or
git rebase --abort
```

## Branch Naming Best Practices

### Good Branch Names ✅

```bash
feature/user-authentication
feature/dark-mode-toggle
feature/flashcard-export-pdf
fix/navigation-menu-overlap
fix/memory-leak-flashcard-component
test/unit-tests-button-component
test/e2e-user-registration-flow
refactor/extract-api-service-layer
refactor/simplify-auth-logic
docs/update-testing-guide
chore/update-dependencies
```

### Bad Branch Names ❌

```bash
stuff                          # Too vague
fix-bug                        # Which bug?
johns-branch                   # Not descriptive
feature-123                    # No context
dark_mode_toggle              # Use kebab-case, not snake_case
Feature/DarkMode              # Don't capitalize
new-feature-for-users-to-export-their-flashcards-to-pdf  # Too long
```

### Naming Rules

1. **Use kebab-case**: `feature/dark-mode-toggle` ✅ not `feature/darkModeToggle` ❌
2. **Be descriptive but concise**: Aim for 2-4 words after the prefix
3. **Use prefixes**: Always start with `feature/`, `fix/`, `test/`, etc.
4. **No special characters**: Stick to lowercase letters, numbers, hyphens, and forward slash
5. **Avoid ticket numbers alone**: `feature/123` ❌ → `feature/dark-mode-toggle` ✅

## Protected Branches

### Master Branch

- **Purpose**: Production-ready code
- **Protection**: Cannot push directly
- **Updates**: Only via PR from `develop` or `hotfix/*`
- **Testing**: All tests must pass, build must succeed

### Develop Branch

- **Purpose**: Integration branch for ongoing development
- **Protection**: Cannot push directly (recommended)
- **Updates**: Via PR from feature branches
- **Testing**: Tests should pass before merging

## Quick Reference

### Daily Workflow Cheatsheet

```bash
# Start your day
git checkout develop && git pull origin develop

# Create feature branch
git checkout -b feature/your-feature

# Work and commit
git add . && git commit -m "feat: your changes"

# Push to remote
git push -u origin feature/your-feature

# Update with latest develop
git checkout develop && git pull && git checkout - && git merge develop

# Create PR when done
gh pr create --base develop

# After merge, cleanup
git checkout develop && git pull && git branch -d feature/your-feature
```

### Useful Git Aliases

Add to `~/.gitconfig`:

```bash
[alias]
    co = checkout
    br = branch
    ci = commit
    st = status
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = log --oneline --graph --all --decorate
    undo = reset --soft HEAD^
    amend = commit --amend --no-edit
```

## Troubleshooting

### "Your branch is behind 'origin/develop'"

```bash
git pull origin develop
```

### "Your branch has diverged from 'origin/develop'"

```bash
# Option 1: Merge (safer)
git pull origin develop

# Option 2: Rebase (cleaner)
git pull --rebase origin develop
```

### "Cannot push to protected branch"

You're trying to push to `master` or `develop` directly. Create a PR instead.

### "Merge conflicts"

See "Scenario 5: Resolve Merge Conflicts" above.

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Git Branch Naming](https://deepsource.io/blog/git-branch-naming-conventions/)
- [Effective Git](https://www.effectivegit.com/)
