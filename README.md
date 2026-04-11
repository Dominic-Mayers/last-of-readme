# Last of README

[![npm version](https://img.shields.io/npm/v/@dominic.mayers/last-of-readme)](https://www.npmjs.com/package/@dominic.mayers/last-of-readme) <!-- DOC-LINK-START --><a href="https://dominic-mayers.github.io/last-of-readme/readme-resolver.html?mode=last&pkg=%40dominic.mayers%2Flast-of-readme&repo=Dominic-Mayers%2Flast-of-readme&host=github.com&v=0.1.22&urlPath="><img alt="README-last of 0.1.22" src="https://img.shields.io/badge/README-last%20of%200.1.22-blue?logo=github"></a><!-- DOC-LINK-END -->

By default, a package version is expected to contain its correct documentation, but in practice there is no guarantee that documentation is complete or even correct at release time.

Last of Readme helps maintainers make more realistic guarantees about their documentation.

---

## 🔗 How it works

Last of Readme connects:

* a **package version**
* a **repository state (commit)**

This connection is established through a **README link**.

The system relies on:

* tags (explicit signals from maintainers)
* repository structure (implicit signals)
* a resolver that applies these rules

At each version, a link is inserted into the README.
This link points to a resolver, which redirects to the repository state that satisfies the maintainer’s guarantees.

---

## 📐 Resolution strategy (last-of contract)

Different contracts are planned for future versions of Last of Readme. This implementation offers the **last-of contract**:

> A more complete and possibly corrected documentation for the package will appear *after* the version is released.

Resolution order:

1. `vX.Y.Z-last-doc` tag → explicitly designated last valid documentation
2. `vX.Y.Z-next-doc` tag → same as last-doc, but automatically asserted by a newer version
3. A unique branch contains the version → use its HEAD
4. Multiple branches contain the version → present options
5. No branch contains the version → fall back to the version itself
6. Otherwise → not found

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

## 📄 License

MIT