# Last of README

Last of Readme is used in the context of package management. It is used to insert  a link in a file of the package that will be resolved to a commit of the package repository that documents the package. The Last of Readme updater is called at each version bump to update the link. This is done using hooks in package.json.

The Last of Readme resolver redirects the link to the adequate commit following a set of rules or contract that is chosen by the maintainer. The user-facing list and behavior of the supported contracts is described in [README.md](README.md). This architecture document focuses on the rationale and implementation structure behind those contracts.

> [!Note]
> The correctness of the content of this commit, for example, executing a `git add` operation on the GitHub readme file, is a responsibility of the user or of an extra script such as `git-add-readme.cjs`, not a direct concern of Last of Readme. Doing otherwise would be too intrusive. Users normally have their own way to update their remote.

### The different contracts

The README gives the concise behavioral description of the contracts. The important architectural point is that the contracts are not arbitrary resolver modes. Four of them form a small family obtained by combining two independent choices:

* whether a `successor-of` tag is allowed to resolve before branch alternatives are exposed;
* whether documentation presented without a `last-of` tag is shown with a warning.

This decomposition is intentionally modest. Last of Readme does not decide what a version bump, a branch, or a tag must mean for every maintainer. Instead, it offers contracts whose observable behavior can be related by maintainers to their own documentation workflow.

The `correction-of` contract is separate from this family. It uses a movable `correction-of` tag to let maintainers attach an explicit correction to an already published package version. It does not participate in the `last-of`/`successor-of` lineage resolution family.

The distinction between the four lineage contracts is reflected directly in the resolver implementation. The resolver has a shared lineage-resolution flow parameterized by two values:

```js
resolveLineageContract(remoteRepository, version, {
  hasWarning,
  successorPriority,
})
```

The `successorPriority` value determines where the `successor-of` check appears in the sequence:

* before branch alternatives, for contracts where the next version bump is allowed to choose the continuation before branch ambiguity is exposed;
* after branch alternatives, for contracts where branch ambiguity is exposed before `successor-of` is considered.

The `hasWarning` value determines whether documentation presented without a `last-of` tag is shown with a warning.

Thus, as far as Last of Readme is concerned, a lineage contract is defined by:

* a resolution-order policy;
* a warning policy.

The broader real-world meaning of those policies belongs to the maintainer's workflow. Last of Readme exposes the choices without enforcing a single interpretation of package versions, branches, or successor releases.

> [!Note] 
> The package.json field `last-of-readme.nextContract` sets only the contract in the next generated resolver link. The contract for each link is determined by its URL contract parameter.

## The files of Last of Readme:

    |-- ARCHITECTURE.md
    |-- docs
    |   |-- readme-resolver-core.js
    |   |-- readme-resolver-driver.html
    |   `-- remote-repository-adapter.js
    |-- nbproject
    |   |-- private
    |   |   |-- private.properties
    |   |   `-- private.xml
    |   |-- project.properties
    |   `-- project.xml
    |-- node_modules
    |   `-- @dominic.mayers
    |       `-- last-of-readme -> ../..
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
            |   |-- user-input-adapter.cjs
            |   `-- user-input-utils.cjs
            |-- attempt-check-contract.cjs
            |-- attempt-readme-link.cjs
            |-- attempt-successor-tag.cjs
            |-- attempt-utils.cjs
            |-- bin
            |   `-- last-of-readme.cjs
            |-- check-contract.cjs
            |-- core
            |   `-- command-result.cjs
            |-- install
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
            |   |-- install-doc-link-config.cjs
            |   |-- install-doc-link-file.cjs
            |   |-- install-non-interactive-policy.cjs
            |   |-- install-owned-version-hooks.cjs
            |   |-- install-remote-config.cjs
            |   |-- remind-not-owned-hooks.cjs
            |   |-- run-installation-per-se.cjs
            |   |-- run-pre-installation-pipeline.cjs
            |   |-- step-logic-filesystem.cjs
            |   |-- step-logic-git.cjs
            |   |-- step-logic-npm.cjs
            |   |-- step-logic-user-input.cjs
            |   `-- utils.cjs
            |-- last-of-readme-contract.cjs
            |-- ports
            |   `-- default-runtime-ports.cjs
            |-- runNpmPkg.cjs
            |-- tag-doc.cjs
            `-- update-readme-link.cjs

The files are available in [Last of Readme GitHub repo](https://github.com/Dominic-Mayers/last-of-readme).

## The core of Last of Readme

The core of Last of Readme consists of the logic that implements package README link creation, documentation tagging, contract checking, and resolver semantics:

* `update-readme-link.cjs`: Create and insert a link to be resolved by the resolver.
* `tag-doc.cjs`: Create `correction-of`, `last-of`, or `successor-of` tags, which are used by the resolver.
* `check-contract.cjs`: Validate the selected documentation contract.
* `readme-resolver-core.js`: The testable contract resolution logic, exposed as a cross-environment IIFE module.

The resolver logic is deliberately separated from its browser driver:

* `readme-resolver-core.js` contains all contract-specific logic — the four lineage resolvers, the `correction-of` path, and the shared `resolveLineageContract` helper. It exposes a `LastOfReadmeResolver` global that can be loaded in a browser or in a test environment without any browser-specific dependencies.
* `readme-resolver-driver.html` is not part of the core. It belongs to the driving adapter layer described below. It reads URL parameters, calls `LastOfReadmeResolver.resolveReadmeLink(...)`, and dispatches the resulting outcome to browser-specific behavior.

This split allows the resolution logic to be unit-tested in isolation, independently of a live browser, a browser page, or a remote repository.

The four lineage contracts are thin parameterizations of a shared lineage-resolution flow, while `correction-of` remains a separate resolver path.

## The installer of Last of Readme

The installer is an important and integral part of Last of Readme. It can be compared to a rendering pipeline in a graph viewer SPA: the rendering pipeline installs the graph, but is an integral part of the graph viewer. The installation process consists of two global phases: a pre-installation pipeline that collects inputs and checks requirements, followed by the installation-per-se. Each global phase has its own orchestrator.

### The pipeline

The pre-installation pipeline consists of a sequence of phases. Each phase starts with zero or more collect and prepare steps. A prepare step does not necessarily correspond to a collect step. These input and prepare steps are followed by a single check-requirements step, the most important step of a pre-installation pipeline phase. The phase ends with a finalize step. For example, a phase might have 6 steps:

* Step 1 — Collect user input

* Step 2 — Prepare user input

* Step 3 — Collect environment-part 1 input

* Step 4 — Prepare environment-part 2 input

* Step 5 — Check requirements on the environment-part

* Step 6 — Finalize and write the new configuration state

Every  collect step is tied with a single part of the environment, but different steps can query different parts. The check-requirements step is also tied with a single part of the environment. Thus, for its main purpose, which is to check requirements, but not for collection of inputs, the phase is tied to that same part.

> [!Note]
> The phases are not expected to cover entirely the part of the environment to which they are tied. **It's a many-to-one relation.** They each correspond to one requirement cycle so that they can have precise names and their orchestration by the pre-installation pipeline orchestrator can present a detailed narrative of the work done in the pipeline.

### The check-requirement steps

There are two kind of check-requirements steps: the check-config-requirements steps and the check-assert-requirements steps:

* **Configuration requirements:** These are requirements that the installer can satisfy through actions, which we identify with configuration settings.

* **Assertion requirements:** These are requirements that can be asserted by the installer, but there is no action to satisfy them.

> [!Note]
> The collect of a configuration value is a check-congig-requirement step. It must not be confused with an ordinary collect-step. A value collected in a collect step is saved in `pipelineState.control` whereas a configuration value is saved in `pipelineState.config`.

> [!Note]
> For pre-installation pipeline phases, the check-requirements step is the most important step of the phase. It can collect information, do some resolving, whatever it needs as long as it does not cross the boundary of its part and does not do pure preparations that never abort. The collect steps are usually used to get information from other parts. Prepare steps are pure preparationd that do not throw and abort.

### The pipelineState

The pipeline state has two sub-objects: `pipelineState.control` and `pipelineState.config`. The object `pipelineState.control` contains values only needed at the time of installation. The object `pipelineState.config` contains configuration values to be persisted as part of the configuration values maintained by npm.

### Main orchestration

The top-level installer orchestrator is `install.cjs`. It orchestrates:

    - `basic-requirements.cjs`
    - `run-pre-installation-pipeline.cjs`
    - `run-installation-per-se.cjs`

The pre-installation pipeline orchestrator orchestrates the requirement-checking phases:

    - `checkCwdIsPackageRoot`,
    - `checkInstallationPreconditions`,
    - `checkRemoteNameConfig`,
    - `checkRemoteUrlsConfig`,
    - `checkGitRemote`,
    - `checkPackageFilePathConfig`,
    - `checkPackageFilePath`,
    - `checkLinkPlaceholder`

The installation-per-se orchestrator orchestrates installation phases such as `install-owned-version-hooks.cjs`.

As we proceed, other phases for checking requirements or for performing installation actions might be added and wired in the corresponding global phase orchestrator. The phases of both global phases are tiny orchestrators of steps. These steps are functions exported by the  `step-logic-*.cjs` scripts. Each `step-logic-*.cjs` script corresponds to a single part of the environment. The `step-logic-*.cjs` scripts are shared by the pre-installation pipeline and the installation-per-se. They are divided by environment part, not by global phase.

A `step-logic-*.cjs` script cannot cross boundaries between parts. Boundaries between parts must be crossed by a phase orchestrator or the top-level orchestrator.


### The role of adapters

As for any other part of Last of Readme, the installer does not directly connect with the environment. All interactions pass through adapter functions. So we have

    `install.cjs` => `basic-requirements.cjs` => `*-adapter.cjs`

    `install.cjs` => `run-pre-installation-pipeline.cjs` => `check-*.cjs` => `step-logic-*.cjs` => `*-adapter.cjs`

    `install.cjs` => `run-installation-per-se.cjs` => `install-*.cjs` => `step-logic-*.cjs` => `*-adapter.cjs`


The adapter functions define the boundary between Last of Readme and its environment.  An adapter function can call helper functions in the adapter script. The adapter functions and these helper functions are said to belong in the adapter-zone. The adapter-zone is shared by the pre-installation pipeline and the installation-per-se. The adapter scripts are divided by environment part, not by global phase. A function in the adapter-zone does not have to cross the boundary toward system functions such as filesystem functions, git functions or npm functions.

> [!Tip]
> We should think of the adapter-zone as a layer around the core logic of Last of Readme, which is as large as needed so that  Last of Readme is as focused as possible on its core logic.
> What an adapter function does is a design choice. It defines the boundary of Last of Readme. If an adapter function does many tasks, these tasks are excluded from Last of Readme internal logic.

#### The `prompt-user-input.cjs` script

All user-facing output — formatted messages, success confirmations, error text — is generated by functions in `prompt-user-input.cjs`. Console output is a boundary crossing in the same sense as a filesystem write or a Git call: it depends on the environment (language, terminal, locale) and must therefore live in the adapter zone.

> [!Note]
> The idea is that all the output read by the user can be seen in one place. If a maintainer needs to modify the text of a message, it only has to look at this script. Moreover, all the output in a single script gives a good overview of the interaction with the user. Another way to view the importance of this architectural rule is to consider a different environment with a different language, say French instead of English.

`prompt-user-input.cjs` is a **pure output adapter**. Its functions have no state, collect no input, and make no decisions about what to output — the caller decides what to output and invokes the appropriate function. Because of this, importing `prompt-user-input.cjs` directly at any architectural level, including high-level orchestrators such as `install.cjs`, does **not** violate separation of concerns. The concern being separated is output formatting and delivery, which `prompt-user-input.cjs` handles completely. The orchestrator's responsibility — deciding what to say and when — is not ceded to the adapter.

This is in contrast to `user-input-adapter.cjs`, which manages interactive readline sessions and collects user decisions. That adapter is stateful and should only be used where interaction is appropriate.

> [!Important]
> The rule is not "orchestrators must not touch adapters directly." The rule is that orchestrators must not cross boundaries by calling environment APIs directly. Calling `prompt-user-input.cjs` functions is not crossing a boundary into orchestration logic — it is delivering output through the correct adapter, as intended.


### The installation-per-se

Once the configuration values have been collected and the requirements checked in the pipeline, the installation-per-se consists in writing the configuration values and wiring Last of Readme commands in `package.json`. The installation-per-se is itself orchestrated as a sequence of installation phases. These phases do not check requirements as their main purpose; they perform installation actions associated with parts of the environment.

> [!Note]
> As with pre-installation pipeline phases, installation-per-se phases are not expected to cover entirely the part of the environment to which they are tied. Multiple installation phases may interact with the same environment part while corresponding to different installation cycles.


The runtime scripts of Last of Readme remain in the installed npm package. They are exposed through the npm bin command `last-of-readme` and are not copied into the target package. The installer itself is executed automatically through the `postinstall` hook of Last of Readme.

**Wiring the core commands**

The installation-per-se wires the commands exposed by `last-of-readme` into the relevant hooks of `package.json`. For example:

```json
{
  "scripts": {
    "preversion": "last-of-readme check-contract && last-of-readme tag-doc successor-of",
    "version": "last-of-readme update-readme-link"
  }
}
```

The commands installed by Last of Readme are fingerprinted commands owned by Last of Readme. User-owned workflow commands that may also be needed, such as staging the package file after it is updated or pushing tags, are handled separately: the user is informed early in the installation process and reminded at the end.

### The npm bin command

Last of Readme exposes an npm bin command named `last-of-readme`.

This command dispatches to the different runtime scripts of Last of Readme while hiding their internal file layout. For example:

```bash
last-of-readme install
last-of-readme check-contract
last-of-readme tag-doc successor-of
last-of-readme update-readme-link
last-of-readme contract
```

The purpose of the dispatcher is to keep hooks wired in `package.json` independent from the internal structure of the package.

### Driving adapters: runtime management wrappers and browser resolver driver

The adapter-zone primarily models Last of Readme as a consumer of environmental services such as npm configuration, Git operations, filesystem access, user interaction, and remote repository APIs.

This corresponds to the driven side of Hexagonal Architecture, also called secondary or output adapters: Last of Readme drives these external systems through adapter functions.

At runtime, however, Last of Readme is also itself driven by external processes and hosts such as:

* npm lifecycle hooks,
* CLI invocation,
* package-manager workflows,
* CI execution,
* browser navigation to a resolver URL.

The driving adapter layer contains the code that adapts those external entry points to the core logic. It includes:

* the `attempt-*.cjs` scripts, which adapt npm lifecycle and CLI execution to command behavior, failure handling, and interactive/non-interactive continuation policy;
* `readme-resolver-driver.html`, which adapts browser URL navigation to the resolver core by reading URL parameters, constructing the remote repository/page adapters, invoking `readme-resolver-core.js`, and rendering or redirecting according to the result.

For example:

```txt
npm lifecycle hook
    ↓
attempt-*.cjs
    ↓
core runtime command
    ↓
*-adapter.cjs
    ↓
environmental service
```

And, for browser resolution:

```txt
browser navigation to resolver URL
    ↓
readme-resolver-driver.html
    ↓
readme-resolver-core.js
    ↓
remote-repository-adapter.js
    ↓
GitHub API / GitHub browser URL
```

The `attempt-*.cjs` scripts adapt Last of Readme behavior to runtime-management concerns such as:

* interactive vs non-interactive execution,
* continuation vs abort policies,
* lifecycle-hook ergonomics,
* user confirmation after failure.

The browser resolver driver adapts Last of Readme behavior to browser-hosted resolver concerns such as:

* parsing URL parameters,
* constructing browser-side repository adapters,
* redirecting to documentation targets,
* rendering resolver choice or warning pages.

This driving adapter layer corresponds to the driving side of Hexagonal Architecture, also called primary or input adapters. The core runtime logic remains comparatively detached from the details of how the request originated, whether from npm, a CLI, CI, or browser navigation.

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
    writeRemoteConfig,
    writeDocLinkConfig,
    writeNonInteractivePolicyIfAbsent,
    getCurrentScriptsHooks,
    getExistingInstallationFingerprint,
    getLastOfReadmeConfig,
    getLastOfReadmeOwnedHookInstallationState,
    installLastOfReadmeOwnedHookCommand,

- Implemented in `npm-adapter.cjs`.


### The adapter API for user input:

  collectDocLinkPlaceholderInput,
  collectPackageFilePathInput,
  collectRemoteInput,
  collectRemoteUrlsInput,
  tryDeriveGitHubUrlsFromRemoteUrl,
  assertInstallationPreconditionsConsent,
  interactivelyInstallFingerprintedHook,
  printFingerprintedHookInstalled,
  printFingerprintedHookPrepended,
  printConvenienceHookReminder,
  isInteractiveSession,
  askWhetherToContinueAfterFailure,
  displayNonInteractiveFailureWarning,

- Implemented in `user-input-adapter.cjs`.

### The adapter API over the remote repository

The remote repository adapter remains the resolver's only boundary to repository state and repository browsing. Its surface is intentionally small:

    resolveTag
    branchesContaining
    browseDocumentation

The script `readme-resolver-core.js` consumes this API only to ask repository questions and to build documentation browsing targets. It does not require a GitHub-specific adapter and must not depend on how the adapter obtains its answers.

The script  `remote-repository-adapter.js` is the production browser/GitHub implementation of this API. Other environments, such as tests or the demo, may provide another implementation with the same surface.

The function `createRemoteRepositoryAPI(remote, urlPath = '')` constructs the production implementation from the resolver URL parameters `repositoryApiUrl`, `repositoryBrowserUrl`, and `urlPath`, which are generated by `update-readme-link.cjs`.


## The `core/` module

The `core/` directory contains modules that are independent of any particular environment or adapter. They can be imported freely from command scripts, orchestrators, or tests without crossing any boundary.

### `command-result.cjs`

`command-result.cjs` defines the contract between a command's logic layer and its drivers (CLI entry points, tests, future UIs). A command's logic function (`runXxxCommand`) returns a structured result; its driver interprets that result to produce output and exit codes.

The helpers it provides:

* `commandSucceeded({ changed, messages, effects, data })` — constructs a successful result. `changed` indicates whether the command mutated any state. `messages` is the list of structured messages to be dispatched by the printer. `effects` is the list of side-effect descriptors for observability and testing.
* `commandFailed(message, { failureKind, messages, effects, data, cause })` — constructs a failure result. `failureKind` is a machine-readable string for programmatic handling. `message` is the human-readable failure description.
* `commandMessage(kind, details)` — constructs a structured message object dispatched by the printer.
* `commandEffect(kind, details)` — constructs a structured effect descriptor.
* `commandFailure(kind, details)` — constructs the `failure` sub-object carried inside a failed result.

All list fields (`messages`, `effects`) accept a single object or an array; `normalizeList` wraps single objects automatically.

## The `ports/` module

The `ports/` directory contains the composition root for runtime adapter injection.

### `default-runtime-ports.cjs`

`default-runtime-ports.cjs` assembles the set of adapters used at runtime into a single `ports` object. Command scripts and orchestrators receive this object rather than importing adapters directly, which keeps them decoupled from the adapter implementations and allows tests to inject alternative ports.

```js
{
  npm:        require('../adapters/npm-adapter.cjs'),
  git:        require('../adapters/git-adapter.cjs'),
  filesystem: require('../adapters/filesystem-adapter.cjs'),
  userInput:  require('../adapters/prompt-user-input.cjs'),
}
```

## The runtime command pattern

The runtime scripts (`check-contract.cjs`, `tag-doc.cjs`, `update-readme-link.cjs`, `last-of-readme-contract.cjs`) each follow a uniform pattern:

1. **`runXxxCommand({ args, ports })`** — pure logic function. Parses arguments, calls adapter functions through `ports`, and returns a structured result built with helpers from `command-result.cjs`. It never writes to stdout or stderr directly.

2. **`printXxxResult(result, ports)`** — output dispatcher. Iterates over `result.messages` and calls the appropriate `ports.userInput.*` function for each message kind. It contains no logic about what happened — only about how to present it.

3. **CLI entry point** — calls `runXxxCommand`, then `printXxxResult`, then exits with code 1 if `!result.ok`. The entry point is guarded by `require.main === module` so the script can be imported by tests without triggering execution.

This separation means tests can drive `runXxxCommand` directly, assert on the structured result, and never need to capture stdout. The printer is tested separately by verifying that it calls the correct `ports.userInput` functions for given message kinds.

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

Although the filesystem is treated architecturally as an environment part behind adapters, its role differs from tools such as Git. Git is an external environment service whose existence must be asserted explicitly by Last of Readme. In contrast, filesystem capabilities are embedded in the Node runtime platform itself. Last of Readme therefore assumes the existence of Node filesystem services in the same way it assumes JavaScript execution, while still treating filesystem access as an adapter boundary for architectural purposes. The distinction is therefore between:

- the architectural role of a part as an environment boundary;
- the operational/runtime role of a part in the execution platform.

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

### Determining installation requirements

To design the check-requirement pipeline, we ask what is needed by each adapter function so that it can fulfil its purpose in the environment.  We do not only require that the function can be executed : it must fulfil its purpose in the environment. This means that a requirement is not mechanically determined by the definition of the function alone.

> [!Note]
>  It's hard to claim this task is completed. It is an always open task, because it depends on our knowledge of the environment, different choices that can be taken at installation time, different configurations, different versions of the dependencies, etc., which we cannot claim to know completely. Moreover, as functionality is added, additional requirements might emerge. 

**Analysis of adapter functions**

Important: This task might involve changes in other parts of Last of Readme. It is important to understand and respect the current architecture:

* The script `install.cjs` is the top-level orchestrator. It orchestrates the basic requirements, the pre-installation pipeline orchestrator and the installation-per-se orchestrator.
* The phases themselves are tiny orchestrators. Pre-installation pipeline phases orchestrate steps starting with collect and prepare steps, followed by a single check-requirements step and ending with a finalize step. Installation-per-se phases orchestrate steps that perform installation actions associated with parts of the environment.
* Each step should focus on its responsibility. For example, a check-requirements step should not collect input or prepare input to be saved in pipeline state.
* The step functions are defined in the `step-logic-*.cjs` scripts. Each step-logic script is tied with a single part of the environment and can contain step logic for both global phases.
* The step-logic scripts never directly cross the boundary of Last of Readme by calling a function of the environment. The boundary toward the environment must be crossed by adapter functions.
* The adapter functions can call helper functions. The helper functions only used by the adapter functions are said to be in the adapter-zone.
* All user-facing output is generated by functions in `prompt-user-input.cjs`. These functions belong in the adapter zone. See the dedicated section on `prompt-user-input.cjs` for the precise rule about where it may be imported.

### JSDoc comments

Writing JSDoc comments for the exported functions of adapter scripts should help to investigate this structure. In addition to the description of the function at the top, different JSDoc tags should be used.

* Top (equivalent to @description): This defines the purpose of the function. It should be explained in terms of the relevant logic in `step-logic-*.cjs` or the `check-*.cjs` phase or perhaps even the `check*Requirements` function of that phase, depending on where the logic needed to explain the purpose is located.
* @params : As usual, this is a natural place to give runtime requirements on the parameters, which should not be confused with environmental requirements.
* @configRequirement : This is used for a requirement on the environment that can be satisfied through configuration.
* @assertRequirement : This is used for a requirement on the environment that can be asserted.
* @returns : Use as usual.
* @remarks : Runtime requirements not on parameters can be mentioned here. The @configRequirement or @assertRequirement tags should not be used for runtime requirements.

**Important invariant**

A requirement tag documents a requirement of the function on which the tag appears. It does not mark the phase or helper that checks the requirement.

Every `@configRequirement` tag should be traceable to an installer phase that checks and satisfies that configuration requirement. Conversely, every phase whose purpose is to check or collect a configuration requirement should correspond to at least one `@configRequirement` tag on a function that needs the resulting configuration.

Similarly, every `@assertRequirement` tag should be traceable to an installer phase that asserts that requirement. Conversely, every phase whose purpose is to assert an environmental requirement should correspond to at least one `@assertRequirement` tag on a function that needs the asserted condition.

> [!Note] 
> An @assertRequirement tag should only be used when it is possible to assert the requirement. When the installer already takes care of that, the comment should end with "Asserted in check-assert-requirements ...". Otherwise, we mention the requirement only and it will be understood as a TODO.
> Similarly, a @configRequirement tag should only be used when it is possible to satisfy the requirement via some configuration. When the installer already takes care of that, the comment should end with "Obtained in check-config-requirements ...". Otherwise, we mention the requirement only and it will be understood as a TODO.

## TODO: 

If the user does not play with the link locally and all bumps are published, it should be the same as the link in the current published npm package, because that link is only modified at version bump. But, it is not safe because that link could be modified and version bump might not be published. So, if the intention is to add a correction-of tag for the "current" contract, we need to query npm with npm view $(npm pkg get name --no-json) version and look at the table to know what version it is and what was the contract.

## 📄 License

MIT