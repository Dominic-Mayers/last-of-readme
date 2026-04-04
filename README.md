# Last of README

[![npm version](https://img.shields.io/npm/v/@dominic.mayers/last-of-readme)](https://www.npmjs.com/package/@dominic.mayers/last-of-readme) <!-- DOC-LINK-START --><a href="https://Dominic-Mayers.github.io/last-of-readme/readme-resolver.html?mode=last&pkg=%40dominic.mayers%2Flast-of-readme&repo=Dominic-Mayers%2Flast-of-readme&v=0.1.5&docTagSuffix=-last-doc"><img alt="README-last of 0.1.5" src="https://img.shields.io/badge/README-last%20of%200.1.5-blue?logo=github"></a><!-- DOC-LINK-END -->

Resolve README links to the last commit that still documents a given version.

The resolver:

1. Use an explicit documentation tag (`vX.Y.Z-last-doc`) if it exists
2. Otherwise, fall back to npm version ordering

---

## ⚙️ Setup

Insert the placeholder, copy the update script, hook into version, install the documentation tag script, copy the resolver page, and push tags.

### 1. Add the placeholder to your README

Add the following placeholder in your README:

    <!-- DOC-LINK-START --><!-- DOC-LINK-END -->

Place it where you want the documentation link to appear, before any further occurence of the placeholder. Only the first occurence is processed by the update script.

---

### 2. Add the update script and run it

A. Copy `scripts/update-readme-link.cjs` from this repository and place it at the same location in your repository.

B. Add the repository info in `package.json` (replace `<your-github-username>` and `<your-repo>`):

    {
        "repository": {
            "type": "git",
            "url": "git+https://github.com/<your-github-username>/<your-repo>"
        }
    }


C. Run the script

    node scripts/update-readme-link.cjs

This script:

- reads metadata from `package.json`
- generates a documentation badge and a resolver link for the current version
- inserts the badge into the placeholder

The link is resolved later by `readme-resolver.html`.

---

### 3. Hook into version

Add to `package.json`

    {
        "scripts": {
            "version": "node scripts/update-readme-link.cjs && git add README.md",
        }
    }

This will run the update script and stage the updated README.md whenever the package version is updated.

---

### 4. Install the documentation tag script

A. Copy `scripts/tag-last-doc.cjs` from this repository.

B. Place it in your project (e.g. `scripts/tag-last-doc.cjs`).

C. Add to `package.json`:

    {
        "scripts": {
            "version": "node scripts/update-readme-link.cjs && git add README.md",
            "tag:last-doc": "node scripts/tag-last-doc.cjs"
        }
    }

The command to execute the script:

    npm run tag:last-doc

D. When to use the script

This script:

- reads the current version from `package.json`
- creates a tag of the form `vX.Y.Z-last-doc` pointing to the current commit
- pushes the tag to the remote repository

The script should be executed when the README starts to diverge from the current version of the package. The created tag marks the last commit whose README still matches version `X.Y.Z`.

If no last-doc tag is  present, the resolver falls back to the next version tag (or to the main branch if none exists).

---

### 5. Copy the resolver page

A. Copy `docs/readme-resolver.html` from this repository.

B. Place it in your project (e.g. `docs/readme-resolver.html`).

C. Enable GitHub Pages for that folder.

The page will:

- read the requested version from the URL.
- check for a corresponding documentation tag (`vX.Y.Z-last-doc`).
- otherwise query the npm registry.
- redirect to the appropriate repository state on GitHub, where the README is displayed.

---

### 6. Push tags

* After every `npm version ...`, push commits and tags:

         git push --follow-tags

* You should consider automating it with `postversion`. For example:

        {
            "scripts": {
                "version": "node scripts/update-readme-link.cjs && git add README.md",
                "tag:last-doc": "node scripts/tag-last-doc.cjs"
                "postversion": "git push --follow-tags"
            }
        }

This also pushes any documentation tags (such as `vX.Y.Z-last-doc`) that point to commits on the current branch.

---

## 🧩 Design principles
```
  ┌────────────────────┐                            ┌────────────────────┐   
  │                    │                            │                    │   
  │  Version registry  │ ◄──────┐           ┌──────►│     Git history    │   
  │                    │        │           │       │                    │   
  └────────────────────┘        │           │       └────────────────────┘   
             ▲                  │           │                  ▲             
   Relation  │                  ▼           ▼                  │             
   to        │         ┌─────────────────────────────┐         │ Relation    
   published │         │                             │         │ to          
   code      │         │       Last of README        │         │ contents    
             │         │ maps versions to repository │         │             
             │         │     states (commits)        │         │             
             │         │                             │         │             
             │         └─────────────────────────────┘         │             
──   ──   ── │ ──   ──   ──   ──   ──   ──   ──   ──   ──   ── │ ──   ──   ──
             ▼                                                 ▼             
 ┌────────────────────┐                               ┌────────────────────┐ 
 │                    │                               │                    │ 
 │ Published packages │                               │ Repository content │ 
 │                    │                               │ (code, README, …)  │ 
 └────────────────────┘                               └────────────────────┘ 
```

Last of README operates entirely above the dotted line, mapping version identifiers to commits without relying on relations to published artifacts or repository contents.

It maps versions to repository states (commits) as follows:

- The version registry defines version identifiers and their relation to the published code.
- Git defines repository states (commits) and their relation to contents.
- The user may create Git tags to associate version identifiers with repository states (commits).
- These tags operate entirely at the level of version identifiers and commits, relating the two sides above the dotted line.
- A tag of the form `vX.Y.Z-last-doc` refines this association by marking the last commit whose README still matches version `X.Y.Z`.
- The links inserted into README files rely on this association to resolve a version identifier to a commit, using explicit tags when available and otherwise falling back to npm version ordering (or to the main branch if no such tag exists).

---

## 📄 License

MIT