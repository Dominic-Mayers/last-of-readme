# Last of README

[![npm version](https://img.shields.io/npm/v/@dominic.mayers/last-of-readme)](https://www.npmjs.com/package/@dominic.mayers/last-of-readme) <!-- DOC-LINK-START --><a href="https://dominic-mayers.github.io/last-of-readme/readme-resolver.html?mode=last&pkg=%40dominic.mayers%2Flast-of-readme&contract=until-successor-of&repositoryApiUrl=https%3A%2F%2Fapi.github.com%2Frepos%2FDominic-Mayers%2Flast-of-readme&repositoryBrowserUrl=https%3A%2F%2Fgithub.com%2FDominic-Mayers%2Flast-of-readme&v=0.1.69&urlPath="><img alt="README until-successor-of 0.1.69" src="https://img.shields.io/badge/README-until--successor--of%200.1.69-blue?logo=github"></a><!-- DOC-LINK-END -->

Last of Readme is used in the context of package management. It is used to insert  a link in a file of the package that will be resolved to a commit of the package repository that documents the package. The Last of Readme updater is called at each version bump to update the link. This is done using hooks in package.json.

The Last of Readme resolver redirects the link to the adequate commit following a set of rules or contract that is chosen by the maintainer. Currently, Last of Readme offers three contracts: the `correction-of`, `last-of` and `until-successor-of` contracts.

> [!Note]
> The correctness of the content of this commit, for example, executing a `git add` operation on the GitHub readme file, is a responsibility of the user or of an extra script such as `git-add-readme.cjs`, not a direct concern of Last of Readme. Doing otherwise would be too intrusive. Users normally have their own way to update their remote.

### The different contracts

Currently, Last of Readme proposes three contracts that can be taken by users: the `correction-of` contract, the `last-of` contract and the `until-successor-of` contract. In the `correction-of` contract, the maintainer of the package says that the package version  contains normally the up-to-date documentation, but might have a corrected version that will be identified by a `correction-of` tag. That suggests a  resolution order in which the package version is always presented, except if there is a `correction-of` tag for that version. This is the contract that departs the least from the default package contract, which is that the package version is the most up-to-date version.

In the `last-of` contract, the maintainers acknowledge that the documentation of the current package version is not finalized and will be updated. This suggests a different resolution order in which the package version has low priority and, if the maintainers have not tagged the `last-of` version, then the users should be informed that the version is not up-to-date and not authoritative. Only an explicit `last-of` tag says the version is up-to-date. Moreover, as long as the maintainers have not tagged a correct version, we keep looking for a more up-to-date version. In that contract, if only a single branch contains the package version then the `successor-of` version in that branch, if it exists, is presented and, otherwise, the HEAD of that branch is presented. The successor-of tag is automatically added when a new version is created. This `successor-of` tag is then considered as an explicit mention that thereafter modifications do not apply to the previous (original) version. The version in the commit identified by the successor-of tag or HEAD is presented, but not as the up-to-date authoritative version, because only the `last-of` tag has this meaning. If there is no `last-of` tag and many branches exist, then the users are presented with options.

The resolution order in the `until-successor-of` contract is as follows:

1. `last-of` tag
2. `successor-of` tag
3.  a unique branch contains the package version -> HEAD of branch
4.  many branches contain the package version -> HEAD options
5.  no branch contains the package version -> the package version
6.  a clean not found page.

> [!Note] 
> The package.json field `last-of-readme.nextContract` sets only the contract in the next generated resolver link. The contract for each link is determined by its URL contract parameter.
