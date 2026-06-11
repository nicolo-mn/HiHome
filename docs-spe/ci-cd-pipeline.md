---
layout: default
title: CI/CD
nav_order: 7
---

# CI/CD Pipeline

The project uses *GitHub Actions* to implement the CI/CD pipeline.

## Pull Request Workflows
Since GitHub Flow is used, code is merged into the main branch through Pull Requests. To adequately test Pull Requests, we implemented a workflow that performs several operations:
- Builds both the MEVN application and the Go service (in both ARM and AMD architectures).
- Checks if proper formatting is applied to the code.
- Executes a security audit through pnpm, to check for vulnerabilities that may have arisen after the installation on pnpm packages.
- Runs the whole test suite to ensure the code behaves as intended.

Moreover, we added a success job to this workflow which always runs unless jobs were cancelled, that depends on all the previous ones. This allows us to check this job to understand if the PR can be merged in the main branch.

Since the project uses squash-merge, we also checked the Pull Request title to conform the conventional commits format. This was implemented in a separate workflow, since it is the only one that needs to be run when the Pull Request is edited (i.e. when its metadata is changed, for example its title or description changes). If we merged all the jobs in a single workflow, tests and build would be triggered on PR change, which would have been useless work. This check was implemented because if the PR title is not specified it defaults to a sentence-case version of the branch name; then, if someone forgets to change it before enabling automerge with squash, a commit with a message that doesn't respect conventional commits would end up in the main branch.

## Release Workflow
When a new commit is merged into the main branch, another workflow is triggered, which executes the following operations:
- Executes the tests (producing coverage reports)
- Uploads the coverage reports to Codecov.io
- Tags the commit following the semantic version guidelines (if there are new features or fixes)
- Build the containers and publishes them to Docker Packages, tagging them with both `latest` and the appropriate version number if a new release was published

To handle coverage reports we chose to use Codecov.io as, through flags, it easily handled our project structure which involved different services in different programming languages. To handle semantic versioning, we used Semantic Release. We added Semantic Release only when the project was in a testable version, since the first version released when it's added to the repository is `1.0.0`. We considered starting with `0.0.1`, but this is [not allowed](https://semantic-release.gitbook.io/semantic-release/support/faq#can-i-set-the-initial-release-version-of-my-package-to-0.0.1) by the automation tool. Following the [recommendation of the `semantic-release` developers](https://github.com/semantic-release/semantic-release/issues/1507) and [this other blog post they cited](https://blog.greenkeeper.io/introduction-to-semver-d272990c44f2) we chose to stick to the default usage of the automation tool, starting with `1.0.0` to support early adopters. Since the main goal is to communicate with early testers of the application the breaking and non-breaking changes we make to the project to ease their usage, we chose to add `semantic-release` only when the project was in a testable state.

Since there are some operations in common between the workflows targeting the main branch and the Pull Requests, to avoid code duplications we factored out a `build` job, which builds the docker containers and an action to set up the environment for test execution. The environment setup was put in an action as it needed to be included by other jobs, while the `build` job represented a standalone job included by the aforementioned workflows.

## GitHub Pages
As this report is published on GitHub Pages, another workflow targeting the documentation folder in the main branch was included.

## Renovate
To handle dependencies updates, we used Renovate bot. We set it up to update dependencies at night when no one was working. Since we required branches to be up-to-date before merging into the `main`, Renovate is instructed to rebase pull requests that are out of date before merging. Renovate was also setup to adhere to the Conventional Commits format that we decided to adopt.

## Branch Protection Rules
We chose to enforce certain behavior through branch protection rules for the `main` branch, in particular:
- Require a Pull Request before merging (since we used GitHub Flow)
- Require signed commits
- Require status checks to pass before merging (all PRs, both automated by Renovate and made by users need to pass the `success` job in the Pull Request workflow, as well as the PR title validation)
