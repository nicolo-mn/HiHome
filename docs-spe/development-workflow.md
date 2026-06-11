---
layout: default
title: Development
nav_order: 6
---

# Development Workflow
## Git Workflow
A Git Workflow is a set of rules and practices that define how a development team collaborates using Git. As a Git Workflow we chose to use [*Github Flow*](https://docs.github.com/en/get-started/using-github/github-flow), a lightweight, branch-based workflow where all work is done in feature branches created from the main branch, and merged back in the main branch using Pull Requests. Contrary to the famous Git Flow, it doesn't use develop or release branches.

To merge Pull Requests into the main branch, we used squashing. This also allows to keep all commits on the main branch verified, since GitHub squashes the commits and verifies it on your behalf before merging back in the target branch. Rebasing, on the other hand, keeps the single commits in the source branch but doesn't allow signing; when rebasing, the commit-id is changed, and GitHub doesn't re-sign all commits in this case. Merging with a merge commit was also considered, but that always created a merge commit on the main branch, even when a fast-forward merge was possible.

## Tooling
The project is made of a MEVN application and an external Go service used to get weather and air quality information. Therefore, different tools were used to handle Typescript and Go codebase.

### Package Management
The package manager chosen for the MEVN application was `pnpm`. Compared to the standard `npm` package manager, it provides several benefits, mainly performance-related, as it uses a global store to cache packages and uses symlinks avoid installing the same package multiple times for different projects. Moreover, `pnpm` is known to handle monorepos better, which was our case since we have the `backend` and `frontend` folders which are workspaces inside our main repository. On the other hand, the Go `ext-api-service` used the standard Go Modules package manager to handle dependencies.

### Code Formatting
We used `Prettier` to standardize code formatting for the MEVN part, while `go-fmt` was used to format Go code.

## Conventional Commits
We chose to use Conventional Commits format for our commit messages. To enforce the standard commit structure, we chose to use `commitlint`, installed through `pnpm` alongside other dev dependencies, to validate our messages at commit time.

## Git Hooks
To automate actions in several steps of the git workflow and enforce several rules for commit compliance, we used git hooks. [`Husky`](https://typicode.github.io/husky/) was used to handle all the git hooks. We used three hooks: *pre-commit*, *commit-msg* and *pre-push*.
- *pre-commit*: the pre-commit hook is run first, before you even type in a commit message. It's used to inspect the snapshot that's about to be committed. We use this hook to format staged changes.
- *commit-msg*: used to enforce conventional commit message format through `commitlint`.
- *pre-push*: used to execute all tests before pushing. While tests passing is also enforced by the CI before a PR can be merged, adding it in a git hook as well allows us to catch issues locally before code reaches any branch in the upstream repository (although it can be bypassed by removing tests locally and keeping the change uncommitted).
