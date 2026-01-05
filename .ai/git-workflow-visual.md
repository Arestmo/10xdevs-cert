# Git Workflow Visualization

Visual guide to understand the Feature Branch Workflow used in this project.

## Branch Structure

```
┌─────────────────────────────────────────────────────────────┐
│                         master                              │
│                    (Production Branch)                      │
└─────────────────────────────────────────────────────────────┘
                ▲                           ▲
                │                           │
                │ PR (release)              │ PR (hotfix)
                │                           │
┌───────────────┴───────────────────────────┴─────────────────┐
│                        develop                              │
│                  (Integration Branch)                       │
└─────────────────────────────────────────────────────────────┘
      ▲         ▲         ▲         ▲         ▲
      │         │         │         │         │
      │ PR      │ PR      │ PR      │ PR      │ PR
      │         │         │         │         │
┌─────┴─┐ ┌─────┴─┐ ┌─────┴─┐ ┌─────┴─┐ ┌─────┴─┐
│feature│ │ fix/  │ │ test/ │ │refact │ │ docs/ │
│  /    │ │       │ │       │ │ or/   │ │       │
│       │ │       │ │       │ │       │ │       │
└───────┘ └───────┘ └───────┘ └───────┘ └───────┘
```

## Feature Branch Lifecycle

```
Day 1: Create Feature Branch
═══════════════════════════════════════════════════════════════

develop: ─●─────────────────────────────────────────────────►
          │
          └──● feature/dark-mode
             │
             └─●─● Commits
                 │
                 └─● Push to remote


Day 2: Continue Development
═══════════════════════════════════════════════════════════════

develop: ─●─────────●──────────────────────────────────────►
          │         │
          │         └──────┐ Merge develop
          │                │ into feature
          └──●──●──●───────●─● feature/dark-mode
                           │
                           └─● Push


Day 3: Complete Feature & Create PR
═══════════════════════════════════════════════════════════════

develop: ─●─────────●──────────────●───────────────────────►
          │         │              ▲
          │         │              │ PR merged
          │         │              │
          └──●──●──●───────●───────● feature/dark-mode
                           │         (deleted after merge)
                           └─● Final commits & tests
```

## Full Workflow Example

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Create Branch                                       │
└─────────────────────────────────────────────────────────────┘

$ git checkout develop
$ git pull origin develop
$ git checkout -b feature/user-dashboard

develop:  ●─────────────────────────────────────────────────►
          │
          └─● feature/user-dashboard


┌─────────────────────────────────────────────────────────────┐
│ Step 2: Work & Commit                                       │
└─────────────────────────────────────────────────────────────┘

$ git add .
$ git commit -m "feat: add dashboard layout"
$ git commit -m "feat: add statistics widgets"
$ git push -u origin feature/user-dashboard

develop:  ●─────────────────────────────────────────────────►
          │
          └─●─────●─────● feature/user-dashboard
            │     │     │
            │     │     └─ feat: add statistics widgets
            │     └─ feat: add dashboard layout
            └─ Initial commit


┌─────────────────────────────────────────────────────────────┐
│ Step 3: Update from Develop                                 │
└─────────────────────────────────────────────────────────────┘

# Someone else merged to develop
develop:  ●─────────────●───────────────────────────────────►
          │             │ (new changes)
          │             │
          └─●─────●─────┤
                        │
                        ● feature/user-dashboard

$ git checkout develop
$ git pull origin develop
$ git checkout feature/user-dashboard
$ git merge develop

develop:  ●─────────────●───────────────────────────────────►
          │             │
          │             └────────┐
          │                      ▼
          └─●─────●──────────────●─● feature/user-dashboard
                                 │ (merge commit)
                                 └─ Continue work


┌─────────────────────────────────────────────────────────────┐
│ Step 4: Create Pull Request                                 │
└─────────────────────────────────────────────────────────────┘

$ npm test              # ✅ All tests pass
$ npm run lint          # ✅ No lint errors
$ npm run build         # ✅ Build successful
$ gh pr create --base develop

develop:  ●─────────────●───────────────────────────────────►
          │             │
          │             └────────┐
          │                      ▼
          └─●─────●──────────────●─●─● feature/user-dashboard
                                     │
                                     PR #42 created ───┐
                                                       │
                                     GitHub Review ◄───┘


┌─────────────────────────────────────────────────────────────┐
│ Step 5: PR Merged & Cleanup                                 │
└─────────────────────────────────────────────────────────────┘

# PR approved and merged
develop:  ●─────────────●───────────────●───────────────────►
          │             │               ▲
          │             └────────┐      │ Merged!
          │                      ▼      │
          └─●─────●──────────────●─●────┘

                                     feature/user-dashboard
                                     (deleted)

$ git checkout develop
$ git pull origin develop
$ git branch -d feature/user-dashboard
```

## Multiple Features Working in Parallel

```
develop:  ●─────────────────────────────────────────────────►
          │
          ├─●─●─●───────────● feature/dark-mode
          │               (PR created)
          │
          ├─●─●─●─●─────────● feature/export-pdf
          │               (in progress)
          │
          ├─●─●───────────● fix/navigation-bug
          │             (PR merged)
          │
          └─●─●─●─●─●───────● test/e2e-setup
                          (in progress)
```

## Merge Conflict Resolution

```
┌─────────────────────────────────────────────────────────────┐
│ Scenario: Both you and teammate edited same file            │
└─────────────────────────────────────────────────────────────┘

develop:  ●─────A───────B───────────────────────────────────►
          │     │       │
          │     │       └─ Teammate merged changes
          │     │
          │     └─ Your branch started here
          │
          └─●───C───D─── feature/your-feature
                │   │
                │   └─ Your latest changes
                └─ Your earlier changes


When you merge develop:
$ git merge develop

          ⚠️  CONFLICT in src/components/Button.tsx

File looks like:
┌─────────────────────────────────────────────────┐
│ <<<<<<< HEAD (your changes)                     │
│ export const Button = () => {                   │
│   return <button className="primary">Click</>;  │
│ }                                               │
│ =======                                         │
│ export const Button = () => {                   │
│   return <button className="secondary">Click</>│
│ }                                               │
│ >>>>>>> develop (incoming changes)              │
└─────────────────────────────────────────────────┘

Resolution:
1. Edit file, remove markers, keep desired code
2. git add src/components/Button.tsx
3. git commit -m "merge: resolve conflicts with develop"
4. git push


Result:
develop:  ●─────A───────B───────────────────────────────────►
          │     │       │
          │     │       └─────────┐
          │     │                 ▼
          └─●───C───D─────────────M─── feature/your-feature
                                  │
                                  └─ Merge commit (resolved)
```

## Hotfix Workflow (Emergency Fixes)

```
┌─────────────────────────────────────────────────────────────┐
│ Critical bug found in production!                           │
└─────────────────────────────────────────────────────────────┘

master:   ●────────────────────●────────────────────────────►
          │                    ▲
          │                    │ Merge hotfix
          │                    │
          └──●─────●───────────● hotfix/security-patch
             │     │             (fix applied, tested)
             │     └─ fix: patch security vulnerability
             └─ Initial hotfix commit

After merge:
master:   ●────────────────────●───────────────────────────►
          │                    │
          │                    └──┐ Also merge back to develop
          │                       ▼
develop:  ●───●───●───────────────●───────────────────────►
                                  (hotfix merged back)
```

## Branch Status Indicators

```
● = Commit
─ = Timeline
► = Active development continues
▲ = Pull Request / Merge up
▼ = Branch / Merge down
├ = Branch point
└ = Branch endpoint
┌─┐ = Text box / Section
```

## Typical Team Workflow

```
Monday Morning:
═══════════════════════════════════════════════════════════════

develop:  ●─────────────────────────────────────────────────►
          │
          ├─● Alice: feature/user-profile
          │
          ├─● Bob: feature/api-integration
          │
          └─● Charlie: fix/login-error


Tuesday Afternoon:
═══════════════════════════════════════════════════════════════

develop:  ●──────────●──────────────────────────────────────►
          │          ▲
          │          │ Alice's PR merged!
          │          │
          ├─●────●───┘ feature/user-profile (deleted)
          │
          ├─●────●────●── Bob: feature/api-integration
          │
          └─●────●── Charlie: fix/login-error


Wednesday Evening:
═══════════════════════════════════════════════════════════════

develop:  ●──────────●────●─────●───────────────────────────►
          │          │    ▲     ▲
          │          │    │     │ Both PRs merged!
          │          │    │     │
          ├─●────●───┘    │     │
          │               │     │
          ├─●────●────●───┘     │
          │                     │
          └─●────●──────────────┘


Thursday: New Features Start
═══════════════════════════════════════════════════════════════

develop:  ●──────────●────●─────●───────────────────────────►
                                │
                                ├─● David: feature/dark-mode
                                │
                                ├─● Eve: test/e2e-coverage
                                │
                                └─● Frank: refactor/api-layer
```

## Decision Tree: When to Create a Branch

```
                    Start New Work
                         │
                         ▼
            ┌─────────────────────────┐
            │ What type of work?      │
            └─────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   New Feature      Bug Fix         Documentation
        │                │                │
        ▼                ▼                ▼
   feature/*         fix/*            docs/*


                    More Specific
                         │
        ┌────────────────┼────────────────┬─────────────┐
        │                │                │             │
        ▼                ▼                ▼             ▼
    Testing         Refactoring       Hotfix        Chore
        │                │                │             │
        ▼                ▼                ▼             ▼
    test/*          refactor/*      hotfix/*       chore/*
```

## Summary: The Golden Rules

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Always branch from develop                               │
│    $ git checkout develop && git pull && git checkout -b    │
│                                                             │
│ 2. Use descriptive branch names                             │
│    ✅ feature/user-dashboard                                 │
│    ❌ stuff                                                  │
│                                                             │
│ 3. Commit often with good messages                          │
│    ✅ git commit -m "feat: add dashboard layout"             │
│    ❌ git commit -m "changes"                                │
│                                                             │
│ 4. Keep your branch updated                                 │
│    $ git merge develop  (daily)                             │
│                                                             │
│ 5. Create PR when ready                                     │
│    $ gh pr create --base develop                            │
│                                                             │
│ 6. Clean up after merge                                     │
│    $ git branch -d feature/name                             │
└─────────────────────────────────────────────────────────────┘
```
