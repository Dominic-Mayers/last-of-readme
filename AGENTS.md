# Last of Readme context as of May 10 2026

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

## The files of Last of Readme:

    |-- docs
    |   |-- readme-resolver.html
    |   `-- remote-repository-adapter.js
    |-- nbproject
    |   |-- private
    |   |   |-- private.properties
    |   |   `-- private.xml
    |   |-- project.properties
    |   `-- project.xml
    |-- package.json
    |-- package-lock.json
    |-- README.md
    `-- scripts
        |-- git-add-readme.cjs
        `-- last-of-readme
            |-- adapters
            |   |-- filesystem-adapter.cjs
            |   |-- git-adapter.cjs
            |   |-- npm-adapter.cjs
            |   |-- prompt-user-input.cjs
            |   `-- user-input-adapter.cjs
            |-- check-contract.cjs
            |-- install
            |   |-- apply-installation.cjs
            |   |-- basic-requirements.cjs
            |   |-- check-cwd-is-package-root.cjs
            |   |-- check-existing-installation.cjs
            |   |-- check-git-remote.cjs
            |   |-- check-installation-preconditions.cjs
            |   |-- check-link-placeholder.cjs
            |   |-- check-package-file-path.cjs
            |   |-- check-package-file-path-config.cjs
            |   |-- check-remote-name-config.cjs
            |   |-- check-remote-urls-config.cjs
            |   |-- install.cjs
            |   |-- step-logic-filesystem.cjs
            |   |-- step-logic-git.cjs
            |   |-- step-logic-npm.cjs
            |   |-- step-logic-user-input.cjs
            |   `-- utils.cjs
            |-- last-of-readme-contract.cjs
            |-- runNpmPkg.cjs
            |-- tag-doc.cjs
            `-- update-readme-link.cjs


The files are available in [Last of Readme GitHub repo](https://github.com/Dominic-Mayers/last-of-readme).

## The core of Last of Readme

The core of Last of Readme (besides its currently obsolete README.md) consists of

* `update-readme-link.cjs`: Create and insert a link to be resolved by `readme-resolver.html`.
* `tag-doc.cjs`: Create correction-of, last-of or successor-of tags, which are used by the resolver.
* `readme-resolver.html` : Resolve the link by making use of the tags or the repository structure in accordance with the contract.

## The installer of Last of Readme

The installer is an important and integral part of Last of Readme. It can be compared to a rendering pipeline in a graph viewer SPA: the rendering pipeline installs the graph, but is an integral part of the graph viewer. The installation process roughly consists of a pre-installation pipeline that collects inputs and checks requirements followed by the installation-per-se.

### The pipeline

The pipeline consists of a sequence of phases. Each phase starts with zero or more collect and prepare steps. A prepare step does not necessarily correspond to a collect step. These input and prepare steps are followed by a single check-requirements step, the most important step of the phase. The phase ends with a finalize step. For example, a phase might have 6 steps:

* Step 1 — Collect user input

* Step 2 — Prepare user input

* Step 3 — Collect environment-part 1 input

* Step 4 — Prepare environment-part 2 input

* Step 5 — Check requirements on the environment-part

* Step 6 — Finalize and write the new configuration state

Every  collect step is tied with a single part of the environment, but different steps can query different parts. The check-requirements step is also tied with a single part of the environment. Thus, for its main purpose, which is to check requirements, but not for collection of inputs, the phase is tied to that same part.

> [!Note]
> The phases are not expected to cover entirely the part of the environment to which they are tied. **It's a many-to-one relation.** They each correspond to one requirement cycle so that they can have precise names and their orchestration by `install.cjs` can present a detailed narrative of the work done in the pipeline.

### The check-requirement steps

There are two kind of check-requirements steps: the check-config-requirements steps and the check-assert-requirements steps:

* **Configuration requirements:** These are requirements that the installer can satisfy through actions, which we identify with configuration settings.

* **Assertion requirements:** These are requirements that can be asserted by the installer, but there is no action to satisfy them.

> [!Note]
> The collect of a configuration value is a check-congig-requirement step. It must not be confused with an ordinary collect-step. A value collected in a collect step is saved in `pipelineState.control` whereas a configuration value is saved in `pipelineState.config`.

> [!Note]
> The check-requirements step is the most important of the phase. It can collect information, do some resolving, whatever it needs as long as it does not cross the boundary of its part and does not do pure preparations that never abort. The collect steps are usually used to get information from other parts. Prepare steps are pure preparationd that do not throw and abort.

### The pipelineState

The pipeline state has two sub-objects: `pipelineState.control` and `pipelineState.config`. The object `pipelineState.control` contains values only needed at the time of installation. The object `pipelineState.config` contains configuration values to be persisted as part of the configuration values maintained by npm.

### Main orchestration

The main orchestrator of the pipeline and  installation-per-se is `install.cjs`. It orchestrates:

    - `basic-requirements.cjs`
    - `checkCwdIsPackageRoot`,
    - `checkInstallationPreconditions`,
    - `checkRemoteNameConfig`,
    - `checkRemoteUrlsConfig`,
    - `checkGitRemote`,
    - `checkPackageFilePathConfig`,
    - `checkPackageFilePath`,
    - `checkLinkPlaceholder`,
    - `apply-installation.cjs`

As we proceed, other phases for checking requirements might be added and wired in the orchestrator `install.cjs`. The phases are only tiny orchestrators of steps. These steps are functions exported by the  `step-logic-*.cjs` scripts. Each `step-logic-*.cjs` script corresponds to a single part of the environment.

A `step-logic-*.cjs` script cannot cross boundaries between parts. Boundaries between parts must be crossed by a phase orchestrator or the main orchestrator.


### The role of adapters

As for any other part of Last of Readme, the installer does not directly connect with the environment. All interactions pass through adapter functions. So we have

    `install.cjs` => `basic-requirements.cjs` => `*-adapter.cjs`

    `install.cjs` => `*-phase.cjs` => `step-logic-*.cjs` => `*-adapter.cjs`

    `install.cjs` => `apply-installation.cjs` => `*-adapter.cjs`


Every adapter function crosses the boundary by calling directly or indirectly a function of the environment.  An adapter function can call helper functions not exported by the adapter script. These helper functions are said to belong in the adapter-zone.

> [!Note]
> What an adapter function does is a design choice. It defines the boundary of Last of Readme. If an adapter function does many tasks, it means that these tasks are excluded from Last of Readme internal logic.

#### The `prompt-user-input.cjs` script

All prompts for interaction with the user are generated by prompt functions in the `prompt-user-input.cjs` script. These prompt functions belong in the adapter zone.


### The installation-per-se

Once the configuration values have been collected and the requirements checked in the pipeline, the installation consists in writing the configuration values, installing the adapter scripts and wiring and installing the core scripts.

**Installing the adapter scripts**

The adapter scripts must be installed in the folder scripts/last-of-readme/adapters/.

**Wiring and installing the core scripts**

The core scripts are installed in scripts/last-of-readme/  and wired in package.json.

## The adapter APIs on which Last of Readme is built

Last of Readme is built on APIs provided by `*-adapter.cjs` scripts, including  `remote-repository-adapter.cjs` in the separate `docs/` directory.

### The adapter API over the file system :

    assertCwdIsPackageRoot,
    validateExistingPackageFile,
    assertPackageFileCanBeCreated,
    packageFileExists,
    readPackageFileContent,
    writePackageFileContent,
    createPackageFileIfAbsent,

- Implemented in `filesystem-adapter.cjs`.

### The adapter API over Git :

    assertInGitRepository,
    setTagAtCurrentCommit,
    setMovableTagAtCurrentCommit,
    publishTag,
    publishMovableTag,
    getRemotesFromGit,
    assertCanDryRunPublishTag,

- Implemented in `git-adapter.cjs`.

### The adapter API over npm :

    assertPackageManifestReadableByNpm,
    npmPackageRoot,
    currentPackageVersion,
    packageName,
    configuredRemoteName,
    getCurrentConfiguredRemoteName,
    configuredNextDocumentationContract,
    getCurrentNextDocumentationContract,
    remoteConfiguration,
    getCurrentRemoteConfiguration,
    packageFilePath,
    getCurrentInstalledPackageFilePath,
    repositoryUrlPath,
    getCurrentRepositoryUrlPath,
    getCurrentFilesField,
    updatePackageJsonFields,
    getCurrentScriptsHooks,
    getExistingInstallationFingerprint

- Implemented in `npm-adapter.cjs`.


### The adapter API for user input:

  collectDocLinkPlaceholderInput,
  collectPackageFilePathInput,
  collectRemoteInput,
  collectRemoteUrlsInput,
  tryDeriveGitHubUrlsFromRemoteUrl,
  checkInstallationPreconditionsConsentInput,
  interactivelyInstallFingerprintedHook,
  interactivelyInstallConvenienceHook,

- Implemented in `user-input-adapter.cjs`.

### The adapter API over the remote repository :

    resolveTag
    branchesContaining
    browseDocumentation

- Implemented by `remote-repository-adapter.cjs`
- Used by `readme-resolver.html`
- The function `createRemoteRepositoryAPI(remote, urlPath = '')` returns the API.
- The parameters `remote` and `urlPath` are created with the help of the URL parameters `repositoryApiUrl`, `repositoryBrowserUrl` and `urlPath` in the link generated by `update-readme-link.cjs`.


## Requirements imposed on the environment

### Installation vs runtime requirements

We distinguish between two kinds of environmental requirements:

- **Installation requirements**: Conditions that must hold at installation time and are checked by the installer. These ensure that the runtime code can be installed in a suitable environment.

- **Runtime requirements**: Conditions required by adapter functions when they are executed. These may be reasserted at runtime and are not necessarily enforced during installation.

> [!Note]
> In the design of the installer, we are concerned with installation requirements only.

### Configuration versus assertion (installation) requirements

As previously mentioned, we distinguish between two kinds of installation requirements: the check-config-requirements steps and the check-assert-requirements steps.


### Regroupment of (installation) requirements per part

The installation requirements can be grouped in terms of the part of the environment to which they apply. In the design of the installer, we try to discover these requirements by analysing what  the individual adapter functions that cross the boundary toward a part of the environment requires from this part of the environment.


### Use of JSDoc tags
In the `*-adapter.cjs` scripts, we identify these requirements using specific JSDoc tags: @configRequirement and @assertRequirement.

> [!Note]
> We ony use the @configRequirement tag when the requirement can be satisfied using some configuration.  Similarly, we only use an @assertRequirement tag when the requirement can possibly be asserted. If the configuration or the assertion is already taken care of by the installer, we mention which function does it. Otherwise, the comment is a kind of TODO comment implicit in the use of these tags.

> [!Note]
> Only `git-adapter.cjs`, `npm-adapter.cjs` and `file-system-adapter.cjs` currently use these JSDoc tags. This is work in progress.



### JSDoc conventions regarding requirements for adapters

- File-level JSDoc declares environmental requirements shared by all exported functions.
- Function-level JSDoc must not repeat these requirements.
- Function-level JSDoc may introduce additional, more specific requirements when needed.
- `@assertRequirement` is used for installation requirements that can be asserted during installation.
- Runtime-only requirements are described in `@remarks`.

> [!Note]
> @assertRequirement describes requirements needed for a function to fulfill its purpose. It should generally not be used on assert* functions to restate the condition they assert.

> [!Note]
> Node offers basic file system operations. Node is not part of the environment that changes from one installation to another. We only have to make sure we use portable code. This is an internal design consideration, not an aspect of the environment to assert.


## Roadmap.

### The stages of the design

The roadmap proposes a design in three stages. These stages correspond to scope of implementation:

#### Stage 1 (where the baseline is)

* A **try-it mode**. In try-it mode, Last of Readme uses
    * a fixed external central resolver. Installation does not require hosting a resolver in the target repository. The central resolver URL will be explicit in the updater script, not implicit in copied project files.
    * a GitHub-specific remote

A try-it resolver is :

- suitable for evaluation, but is
- not a long-term package documentation guarantee and
- may change as the project evolves


#### Stage 2

* A **self-hosted mode**.  The resolver becomes a part of the installation process.

Though it should be reasonably easy to install its own resolver, anyone can make its resolver public and declare :

- it is suitable for real usage with
- guarantee provided by resolver maintainer


#### Stage 3

* Add **transition from a try mode to the self-hosted mode**


### Making the contracts well known

An easy made criticism is that the contracts should be stable and visible. However, there is not much we can do in terms of architecture or even documentation to achieve that goal, except having a good architecture in terms of general standards and a useful system that people will discuss and naturally know about. We could have an encyclopedia of documentation and have many formal public declarations of the contracts and it will be useless if  people do not like the system and do not find it easy to use it and understand. Conversely, if the adapters, the resolver, etc. are well designed and structured, clear contracts will naturally be obtained and, because people can easily understand and use the system, making these contracts stable and visible will only be a formality. Therefore, the abstract question how to make the contracts stable and visible is not our concern at this time.

### The README.md

This file  contains useful concepts, but its setup part needs serious updating. The plan is that once we know the installation-per-se procedure it should be available in the readme file. In order for this description to be authoritative, it is necessary that README.md is maintained up-to-date. The README.md of Last of Readme is thus an example of its application, perhaps not a good one at this early stage.  The philosophy of Last of Readme is that in practice, a theoretical contract such as "The readme file is up-to-date and authoritative"  is not realistic and the idea is to allow more realistic contracts where the users have more chance to know what is the real situation.

### Finishing the installation-per-se

Once the requirements are well identified the best we can, the installation-per-se should be completed. (See above).

### Determining installation requirements

To design the check-requirement pipeline, we ask what is needed by each adapter function so that it can fulfil its purpose in the environment.  We do not only require that the function can be executed : it must fulfil its purpose in the environment. This means that a requirement is not mechanically determined by the definition of the function alone.

> [!Note]
>  It's hard to claim this task is completed. It is an always open task, because it depends on our knowledge of the environment, different choices that can be taken at installation time, different configurations, different versions of the dependencies, etc., which we cannot claim to know completely. Moreover, as functionality is added, additional requirements might emerge. 

**Analysis of adapter functions**

Important: This task might involve changes in other parts of Last of Readme. It is important to understand and respect the current architecture:

* The script `install.cjs` is the main orchestrator. It orchestrates the basic-requirements, the phases and the installation-per-se.
* The phases themselves are tiny orchestrators. They orchestrate steps, starting with collect and prepare steps, followed by a single check-requirements step and ending with a finalize step.
* Each step should focus on its responsibility. For example, a check-requirements step should not collect input or prepare input to be saved in pipeline state.
* The step functions are defined in the `step-logic-*.cjs` scripts. Each step-logic script is tied with a single part of the environment.
* The step-logic scripts never directly cross the boundary of Last of Readme by calling a function of the environment. The boundary toward the environment must be crossed by adapter functions.
* The adapter functions can call helper functions. The helper functions only used by the adapter functions are said to be in the adapter-zone.
* All prompts are generated by prompt functions in the script `prompt-user-input.cjs`. These prompt functions belong in the adapter-zone.

### JSDoc comments

Writing JSDoc comments for the exported functions of adapter scripts should help to investigate this structure. In addition to the description of the function at the top, different JSDoc tags should be used.

* Top (equivalent to @description): This defines the purpose of the function. It should be explained in terms of the relevant logic in `step-logic-*.cjs` or the `check-*.cjs` phase or perhaps even the `check*Requirements` function of that phase, depending on where the logic needed to explain the purpose is located.
* @params : As usual, this is a natural place to give runtime requirements on the parameters, which should not be confused with environmental requirements.
* @configRequirement : This is used for a requirement on the environment that can be satisfied through configuration.
* @assertRequirement : This is used for a requirement on the environment that can be asserted.
* @returns : Use as usual.
* @remarks : Runtime requirements not on parameters can be mentioned here. The @configRequirement or @assertRequirement tags should not be used for runtime requirements.

> [!Note] 
> An @assertRequirement tag should only be used when it is possible to assert the requirement. When the installer already takes care of that, the comment should end with "Asserted in check-assert-requirements ...". Otherwise, we mention the requirement only and it will be understood as a TODO.
> Similarly, a @configRequirement tag should only be used when it is possible to satisfy the requirement via some configuration. When the installer already takes care of that, the comment should end with "Obtained in check-config-requirements ...". Otherwise, we mention the requirement only and it will be understood as a TODO.
