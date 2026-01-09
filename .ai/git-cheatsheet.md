# Git Workflow Cheatsheet

Quick reference for daily Git operations with feature branches.

## Quick Start

```bash
# Start new feature
git checkout develop && git pull && git checkout -b feature/your-feature

# Save work
git add . && git commit -m "feat: your changes"

# Push to remote
git push -u origin feature/your-feature

# Update from develop
git checkout develop && git pull && git checkout - && git merge develop

# Create PR
gh pr create --base develop
```

## Branch Naming Examples

### Features

```bash
feature/user-authentication
feature/dark-mode-toggle
feature/flashcard-review-system
feature/export-to-pdf
feature/spaced-repetition-algorithm
feature/user-profile-page
feature/password-reset-flow
feature/oauth-integration
```

### Bug Fixes

```bash
fix/login-validation-error
fix/memory-leak-component
fix/navigation-menu-overflow
fix/form-submit-timing
fix/api-error-handling
fix/responsive-layout-mobile
```

### Tests

```bash
test/vitest-setup
test/unit-button-component
test/e2e-user-flow
test/integration-api-endpoints
test/accessibility-wcag
test/performance-lighthouse
```

### Refactoring

```bash
refactor/api-service-layer
refactor/component-structure
refactor/auth-logic
refactor/state-management
refactor/database-queries
```

### Documentation

```bash
docs/api-documentation
docs/testing-guide
docs/setup-instructions
docs/architecture-decisions
```

### Chores

```bash
chore/update-dependencies
chore/configure-ci-pipeline
chore/setup-prettier
chore/add-git-hooks
```

## Common Commands

### Starting Work

| Task                       | Command                                                    |
| -------------------------- | ---------------------------------------------------------- |
| Create feature branch      | `git checkout -b feature/name`                             |
| From develop               | `git checkout develop && git pull && git checkout -b ...`  |
| List all branches          | `git branch -a`                                            |
| Switch branches            | `git checkout branch-name`                                 |
| Create and switch          | `git switch -c feature/name`                               |

### Making Changes

| Task                       | Command                                                    |
| -------------------------- | ---------------------------------------------------------- |
| Check status               | `git status`                                               |
| See changes                | `git diff`                                                 |
| See staged changes         | `git diff --staged`                                        |
| Stage all changes          | `git add .`                                                |
| Stage specific file        | `git add path/to/file.ts`                                  |
| Unstage file               | `git restore --staged file.ts`                             |
| Discard changes            | `git restore file.ts`                                      |

### Committing

| Task                       | Command                                                    |
| -------------------------- | ---------------------------------------------------------- |
| Commit                     | `git commit -m "feat: description"`                        |
| Commit all tracked         | `git commit -am "fix: description"`                        |
| Amend last commit          | `git commit --amend`                                       |
| Amend without edit         | `git commit --amend --no-edit`                             |

### Pushing

| Task                       | Command                                                    |
| -------------------------- | ---------------------------------------------------------- |
| Push first time            | `git push -u origin feature/name`                          |
| Push                       | `git push`                                                 |
| Force push (careful!)      | `git push --force-with-lease`                              |

### Syncing with Develop

| Task                       | Command                                                    |
| -------------------------- | ---------------------------------------------------------- |
| Update develop             | `git checkout develop && git pull`                         |
| Merge develop into feature | `git merge develop`                                        |
| Rebase on develop          | `git rebase develop`                                       |
| Continue after conflict    | `git merge --continue` or `git rebase --continue`          |
| Abort merge/rebase         | `git merge --abort` or `git rebase --abort`                |

### Stashing

| Task                       | Command                                                    |
| -------------------------- | ---------------------------------------------------------- |
| Save work temporarily      | `git stash`                                                |
| Save with message          | `git stash save "WIP: feature description"`                |
| List stashes               | `git stash list`                                           |
| Apply latest stash         | `git stash pop`                                            |
| Apply specific stash       | `git stash apply stash@{0}`                                |
| Clear all stashes          | `git stash clear`                                          |

### Viewing History

| Task                       | Command                                                    |
| -------------------------- | ---------------------------------------------------------- |
| View commits               | `git log`                                                  |
| View compact log           | `git log --oneline`                                        |
| View graph                 | `git log --graph --oneline --all`                          |
| View last commit           | `git log -1`                                               |
| View file history          | `git log --follow file.ts`                                 |

### Cleaning Up

| Task                       | Command                                                    |
| -------------------------- | ---------------------------------------------------------- |
| Delete local branch        | `git branch -d feature/name`                               |
| Force delete               | `git branch -D feature/name`                               |
| Delete remote branch       | `git push origin --delete feature/name`                    |
| Prune deleted remotes      | `git fetch --prune`                                        |
| List merged branches       | `git branch --merged`                                      |

### Pull Requests (with gh CLI)

| Task                       | Command                                                    |
| -------------------------- | ---------------------------------------------------------- |
| Create PR to develop       | `gh pr create --base develop`                              |
| Create with title/body     | `gh pr create --base develop --title "..." --body "..."`   |
| List PRs                   | `gh pr list`                                               |
| View PR                    | `gh pr view`                                               |
| Checkout PR locally        | `gh pr checkout 123`                                       |
| Merge PR                   | `gh pr merge 123`                                          |
| Close PR                   | `gh pr close 123`                                          |

## Commit Message Templates

### Features

```bash
git commit -m "feat: add user authentication system"
git commit -m "feat(api): implement JWT token refresh endpoint"
git commit -m "feat(ui): add dark mode toggle to settings"
```

### Bug Fixes

```bash
git commit -m "fix: resolve navigation menu overlap on mobile"
git commit -m "fix(forms): correct email validation regex"
git commit -m "fix(api): handle timeout errors gracefully"
```

### Tests

```bash
git commit -m "test: add unit tests for Button component"
git commit -m "test(e2e): add accessibility tests for homepage"
git commit -m "test: increase coverage for auth service"
```

### Refactoring

```bash
git commit -m "refactor: simplify authentication logic"
git commit -m "refactor(api): extract service layer from components"
git commit -m "refactor: remove deprecated utility functions"
```

### Documentation

```bash
git commit -m "docs: update testing guide with E2E examples"
git commit -m "docs(api): add JSDoc comments to service functions"
git commit -m "docs: fix typos in README"
```

### Chores

```bash
git commit -m "chore: update dependencies to latest versions"
git commit -m "chore(config): add coverage thresholds to vitest"
git commit -m "chore: configure pre-commit hooks"
```

## Typical Daily Workflow

```bash
# Morning: Start your day
git checkout develop
git pull origin develop

# Create feature branch for your work
git checkout -b feature/user-dashboard

# Work on your feature
# ... make changes to files ...

# Check what you changed
git status
git diff

# Stage and commit
git add .
git commit -m "feat: add user dashboard with statistics"

# Push to remote (first time)
git push -u origin feature/user-dashboard

# Continue working and committing throughout the day
git add .
git commit -m "feat: add chart visualization to dashboard"
git push

# Before lunch: Update with latest develop
git checkout develop
git pull origin develop
git checkout feature/user-dashboard
git merge develop
# Resolve conflicts if any
git push

# End of day: Create PR if feature is complete
npm test              # Run tests
npm run lint          # Check linting
npm run build         # Verify build

gh pr create --base develop --title "feat: add user dashboard with statistics"

# After PR is approved and merged
git checkout develop
git pull origin develop
git branch -d feature/user-dashboard
```

## Merge Conflict Resolution

```bash
# During merge, conflicts occur
git merge develop
# Auto-merging src/components/Button.tsx
# CONFLICT (content): Merge conflict in src/components/Button.tsx

# 1. Check which files have conflicts
git status

# 2. Open conflicted file
# Look for conflict markers:
<<<<<<< HEAD
Your current code
=======
Incoming code from develop
>>>>>>> develop

# 3. Edit file to resolve conflict (remove markers, keep desired code)

# 4. Mark as resolved
git add src/components/Button.tsx

# 5. Complete the merge
git commit -m "merge: resolve conflicts with develop"

# 6. Push
git push
```

## Emergency Procedures

### Undo Last Commit (Not Pushed)

```bash
# Keep changes, undo commit
git reset --soft HEAD^

# Discard changes, undo commit
git reset --hard HEAD^
```

### Undo Last Commit (Already Pushed)

```bash
# Create new commit that reverses the changes
git revert HEAD
git push
```

### Abandon All Local Changes

```bash
# Discard all uncommitted changes
git restore .

# Or
git reset --hard HEAD
```

### Start Over from Develop

```bash
# Hard reset your feature branch to develop
git fetch origin
git reset --hard origin/develop
```

## Pro Tips

1. **Commit often**: Small, focused commits are easier to review and revert
2. **Pull before push**: Always pull latest changes before pushing
3. **Test before PR**: Run tests and linting before creating PR
4. **Descriptive messages**: Write commit messages that explain WHY, not just WHAT
5. **Branch hygiene**: Delete branches after merging to keep repository clean
6. **Use stash**: Don't commit half-done work; use `git stash` instead
7. **Review diff**: Always review your changes with `git diff` before committing
8. **Keep branches short-lived**: Merge within 1-3 days to avoid conflicts

## Git Aliases (Optional)

Add to `~/.gitconfig`:

```ini
[alias]
    co = checkout
    br = branch
    ci = commit
    st = status
    last = log -1 HEAD
    unstage = reset HEAD --
    visual = log --oneline --graph --all --decorate
    undo = reset --soft HEAD^
```

Usage:

```bash
git co develop           # Instead of: git checkout develop
git st                   # Instead of: git status
git visual               # Pretty log graph
```
