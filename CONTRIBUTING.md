# Contributing

Thank you for your interest in contributing to `regular-table`!

`regular-table` is built on open source and hosted by the Fintech Open Source
Foundation (FINOS). We invite you to participate in our community by adding and
commenting on [issues](https://github.com/finos/regular-table/issues) (e.g., bug
reports; new feature suggestions) or contributing code enhancements through a
pull request.

Note that commits and pull requests to FINOS repositories such as
`regular-table` may only be accepted from those contributors with a
[Contributor License Agreement (CLA)](https://finosfoundation.atlassian.net/wiki/spaces/FINOS/pages/75530375/Contribution+Compliance+Requirements#ContributionComplianceRequirements-ContributorLicenseAgreement)
with FINOS. This may take the form of either:

-   an active, executed Individual Contributor License Agreement (ICLA) with
    FINOS, OR
-   coverage under an existing, active Corporate Contribution License Agreement
    (CCLA) executed with FINOS (most likely by the developer's employer). Please
    note that some, though not all, CCLAs require individuals/employees to be
    explicitly named on the CCLA.

Commits from individuals not covered under an CLA can not be merged by
`regular-table`'s committers. We encourage you to check that you have a CLA in
place well in advance of making your first pull request.

Need an ICLA? Unsure if you are covered under an existing CCLA? Confused? Email
[help@finos.org](mailto:help@finos.org) and the foundation team will help get it
sorted out for you.

If you have any general questions about contributing to `regular-table`, please
feel free to open an issue on
[github](https://github.com/finos/regular-table/issues/new), or email
[help@finos.org](mailto:finos.org).

## Guidelines

When submitting PRs to `regular-table`, please respect the following general
coding guidelines:

-   Please try to keep PRs small and focused. If you find your PR touches
    multiple loosely related changes, it may be best to break up into multiple
    PRs.
-   Individual commits should preferably do One Thing (tm), and have descriptive
    commit messages. Do not make "WIP" or other mystery commit messages.
-   ... that being said, one-liners or other commits should typically be
    grouped. Please try to keep 'cleanup', 'formatting' or other non-functional
    changes to a single commit at most in your PR.
-   PRs that involve moving files around the repository tree should be organized
    in a stand-alone commit from actual code changes.
-   Please do not submit incomplete PRs or partially implemented features.
    Feature additions should be implemented completely. If your PR is a build,
    documentation, test change, or an API change that is not applicable to the
    UX, please explain this in the comments.
-   Please do not submit PRs disabled by feature or build flag - experimental
    features should be kept on a branch until they are ready to be merged.
-   Feature additions, make sure you have added complete JSDoc to any new APIs,
    as well as additions to the [Usage Guide]() if applicable.
-   All PRs should be accompanied by tests asserting their behavior in any
    packages they modify.
-   Do not commit with `--no-verify` or otherwise bypass commit hooks, and
    please respect the formatting and linting guidelines they enforce.
-   Do not `merge master` upstream changes into your PR. If your change has
    conflicts with the `master` branch, please pull master into your fork's
    master, then rebase.

## Contribution Process

Before making a contribution, please take the following steps:

1. Check whether there's already an open issue related to your proposed
   contribution. If there is, join the discussion and propose your contribution
   there.
2. If there isn't already a relevant issue, create one, describing your
   contribution and the problem you're trying to solve.
3. Respond to any questions or suggestions raised in the issue by other
   developers.
4. Fork the project repository and prepare your proposed contribution.
5. Submit a pull request.

NOTE: All contributors must have a contributor license agreement (CLA) on file
with FINOS before their pull requests will be merged. Please review the FINOS
[contribution requirements](https://community.finos.org/docs/governance/Software-Projects/contribution-compliance-requirements)
and submit (or have your employer submit) the required CLA before submitting a
pull request.

## Development install

First install `dev_dependencies`:

```bash
pnpm install
```

Build the library

```bash
pnpm run build
```

Run the test suite

```bash
pnpm run test
```

Start the example server at
[`http://localhost:8080/examples/`](http://localhost:8080/examples/)

```bash
pnpm run start
```

## How to rebuild the Typescript declarations

### Step-by-step

1. For the duration of building declarations, temporarily `export` the
   `RegularTableElement` in `src/js/index.js`:

```javascript
// TEMP: export keyword added for building declarations
export class RegularTableElement extends RegularViewEventModel {
```

2. Run typescript declarations build:

```bash
pnpm run declarations
```

This will create `declarations/index.d.ts` and other typescript

3. In `index.d.ts`, replace all lines inbetween the paste guard lines:

```javascript
  // START: declarations/index.d.ts

  ...

  // END: declarations/index.d.ts
```

with the contents of the just-built `declarations/index.d.ts`.

### Troubleshooting

If an update to index.d.ts is found to break the compilation of any downstream
projects, a likely place to check for errors are the pure jsdoc typedefs in
`src/js/index.js` below the RegularTableElement class defintion. Ensure that all
of the described types are in sync with their current javascript counterparts.
