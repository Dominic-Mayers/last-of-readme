# Last of README

[![npm version](https://img.shields.io/npm/v/@dominic.mayers/last-of-readme)](https://www.npmjs.com/package/@dominic.mayers/last-of-readme) <!-- DOC-LINK-START --><a href="https://dominic-mayers.github.io/last-of-readme/readme-resolver.html?mode=last&pkg=%40dominic.mayers%2Flast-of-readme&contract=correction-of&repositoryApiUrl=https%3A%2F%2Fapi.github.com%2Frepos%2FDominic-Mayers%2Flast-of-readme&repositoryBrowserUrl=https%3A%2F%2Fgithub.com%2FDominic-Mayers%2Flast-of-readme&v=0.1.75&urlPath="><img alt="README correction-of 0.1.75" src="https://img.shields.io/badge/README-correction--of%200.1.75-blue?logo=github"></a><!-- DOC-LINK-END -->

Last of Readme helps package maintainers publish README links that continue to resolve correctly across package versions and documentation updates.

Instead of linking directly to a mutable README location, Last of Readme maintains resolver links backed by Git tags and explicit documentation contracts.

> [!NOTE]
> For detailed installation behavior, runtime orchestration, architectural layering, resolver semantics, and design rationale, see [`ARCHITECTURE.md`](ARCHITECTURE.md).
>
> `ARCHITECTURE.md` is also currently used as a structured architectural context for AI-assisted code analysis and development.

## Interactive demo

An [interactive demo](https://dominic-mayers.github.io/last-of-readme/demo.html) lets you explore the full workflow in the browser: bumping a version, inserting a resolver link, publishing, and clicking the badge to see how the resolver selects the right README.

## Documentation contracts

Last of Readme manages README resolver links through documentation contracts.

These contracts determine how the documents presented through the README link evolve as newer versions and documentation corrections are published.

Last of Readme currently supports five contracts:

* `until-next`
* `until-next-warn`
* `until-branch`
* `until-branch-warn`
* `correction-of`

The `until-next`, `until-next-warn`, `until-branch`, and `until-branch-warn` contracts use the `successor-of` and `last-of` tags, but they interpret them differently. The `correction-of` contract uses only the `correction-of` tag.

The `last-of` and `correction-of` tags are normally added manually by maintainers. The `successor-of` tag is normally added automatically at the next version bump.

### `until-next`

Resolution order:

1. `last-of` tag
2. `successor-of` tag
3. HEAD of the single containing branch
4. options when several containing branches exist
5. package version

In this contract, either a `last-of` tag or a `successor-of` tag is sufficient to directly present documentation, even when many branch alternatives exist.

Documentation presented through a `successor-of` tag or through the HEAD of a single containing branch is presented without warning.

### `until-next-warn`

Resolution order (same as `until-next`):

1. `last-of` tag
2. `successor-of` tag
3. HEAD of the single containing branch
4. options when several containing branches exist
5. package version

In this contract, as for `until-next`, either a `last-of` tag or a `successor-of` tag is sufficient to present documentation even when many branch alternatives exist.

Documentation presented without a `last-of` tag is presented with a warning.

### `until-branch`

Resolution order:

1. `last-of` tag
2. options when several containing branches exist
3. `successor-of` tag
4. HEAD of the single containing branch
5. package version

In this contract, only a `last-of` tag is sufficient to directly present documentation when many branch alternatives exist.

Documentation presented without a `last-of` tag is presented without warning.

### `until-branch-warn`

Resolution order (same as `until-branch`):

1. `last-of` tag
2. options when several containing branches exist
3. `successor-of` tag
4. HEAD of the single containing branch
5. package version

In this contract, as in `until-branch`, only a `last-of` tag is sufficient to directly present documentation, even when many branch alternatives exist.

Documentation presented without a `last-of` tag is presented with a warning.

### `correction-of`

The resolver first looks for a `correction-of` tag associated with the package version.

If none exists, the resolver uses the package version itself.

This contract supports workflows where documentation associated with a package version may later receive explicit corrections while remaining attached to that version.

---

## Installation

Install Last of Readme in a package repository:

```bash
npm install --save-dev last-of-readme
```

Then run:

```bash
npx last-of-readme install
```

The installer configures:

* README placeholder management,
* package.json integration,
* runtime lifecycle hooks,
* remote repository configuration.

---

## Typical workflow

Choose the contract for the next version:

```bash
npx last-of-readme contract until-next
```

Then bump the version normally:

```bash
npm version patch
```

During the version lifecycle, Last of Readme:

* validates the documentation contract,
* updates the managed README resolver link,
* creates the appropriate documentation tags.

---

## Commands

```bash
last-of-readme install
last-of-readme contract <until-next|until-next-warn|until-branch|until-branch-warn|correction-of>
last-of-readme check-contract
last-of-readme tag-doc <last-of|successor-of|correction-of>
last-of-readme update-readme-link
```

---

## Repository structure

```txt
scripts/last-of-readme/
├── adapters/
├── install/
├── bin/
├── attempt-*.cjs
├── check-contract.cjs
├── tag-doc.cjs
└── update-readme-link.cjs
```

## Architecture and design

The [ARCHITECTURE](ARCHITECTURE.md) document provides a more detailed account of the project architecture and design, including:

- installation orchestration,
- runtime-management wrappers,
- adapter layering,
- resolver management,
- environment-part decomposition,
- and architectural rationale.