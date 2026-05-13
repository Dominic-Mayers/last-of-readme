# Last of README

[![npm version](https://img.shields.io/npm/v/@dominic.mayers/last-of-readme)](https://www.npmjs.com/package/@dominic.mayers/last-of-readme) <!-- DOC-LINK-START --><a href="https://dominic-mayers.github.io/last-of-readme/readme-resolver.html?mode=last&pkg=%40dominic.mayers%2Flast-of-readme&contract=until-successor-of&repositoryApiUrl=https%3A%2F%2Fapi.github.com%2Frepos%2FDominic-Mayers%2Flast-of-readme&repositoryBrowserUrl=https%3A%2F%2Fgithub.com%2FDominic-Mayers%2Flast-of-readme&v=0.1.69&urlPath="><img alt="README until-successor-of 0.1.69" src="https://img.shields.io/badge/README-until--successor--of%200.1.69-blue?logo=github"></a><!-- DOC-LINK-END -->

Last of Readme helps package maintainers publish README links that continue to resolve correctly across package versions and documentation updates.

Instead of linking directly to a mutable README location, Last of Readme maintains resolver links backed by Git tags and explicit documentation contracts.

> [!NOTE]
> For detailed installation behavior, runtime orchestration, architectural layering, resolver semantics, and design rationale, see [`ARCHITECTURE.md`](ARCHITECTURE.md).
>
> `ARCHITECTURE.md` is also currently used as a structured architectural context for AI-assisted code analysis and development.

## Documentation contracts

Last of Readme manages README resolver links through documentation contracts.

A contract determines how the resolver selects documentation associated with a package version.

Last of Readme currently supports three contracts:

* `until-successor-of`
* `last-of`
* `correction-of`

### `until-successor-of`

The resolver first looks for a `last-of` tag associated with the package version.

If none exists, it looks for a `successor-of` tag.

If none exists and the package version belongs to a single containing branch, the resolver uses the HEAD of that branch.

If several containing branches exist, the resolver presents options.

### `last-of`

The resolver looks for a `last-of` tag associated with the package version.

If none exists and the package version belongs to a single containing branch, the resolver may use the HEAD of that branch while indicating that no `last-of` tag is present.

If several containing branches exist, the resolver presents options.

### `correction-of`

The resolver first looks for a `correction-of` tag associated with the package version.

If none exists, the resolver uses the package version itself.

## Choosing a contract

The contracts correspond to different ways documentation may evolve after a package version is published.

* `until-successor-of` supports documentation that evolves through successor versions and branch continuation.

* `last-of` supports workflows where a later commit is explicitly designated as the final documentation state associated with a package version.

* `correction-of` supports workflows where documentation associated with a package version may later receive explicit corrections while remaining attached to that version.

These contracts determine how README links evolve as newer versions and documentation corrections are published.

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
npx last-of-readme contract until-successor-of
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
last-of-readme contract <until-successor-of|last-of|correction-of>
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

See [ARCHITECTURE](ARCHITECTURE.md) for the detailed orchestration and layering model.
