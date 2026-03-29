# Last of README

> Resolve README to the last relevant commit based on npm version.

<!-- DOC-LINK-START --><a href="https://dominic-mayers.github.io/last-of-readme/readme-resolver.html?mode=last&v=__VERSION__"><img alt="README-last of pending" src="https://img.shields.io/badge/README-last%20of%20pending-blue?logo=github"></a><!-- DOC-LINK-END -->



---

## ✨ Motivation

When a package evolves, its README changes over time.

For a given version `V`, the most relevant documentation is:

> the last README commit before the next version is released

This project provides a lightweight way to resolve that automatically.

---

## 🧠 How it works

Given a version `V`, the resolver computes:

    last(V) = next(V) if it exists, otherwise main

- Uses **npm registry** to determine version ordering.
- Uses GitHub tags to locate the corresponding repository state (where the README is displayed).
- Falls back to `main` when no newer version exists.

---

## 🔗 Example usage of readme-resolver.html

    readme-resolver.html?mode=last&v=0.1.9

- If `0.1.10` exists → redirects to the repository at tag v0.1.10
- Otherwise → redirects to `main`

---

## ⚙️ Setup

Copy the block, copy the script, copy readme-resolver.html, add `prepublishOnly`, and push tags.

### 1. Add managed block to your README

    <!-- DOC-LINK-START --><a href="https://<your-username>.github.io/<your-repo>/readme-resolver.html?mode=last&v=__VERSION__"><img alt="README-last of pending" src="https://img.shields.io/badge/README-last%20of%20pending-blue?logo=github"></a><!-- DOC-LINK-END -->


Replace `<your-username>` and `<your-repo>`.

---

### 2. Add update script

Create:

    scripts/update-readme-link.cjs

Use the provided script from this repository.

This script:

- reads `package.json.version`
- updates the badge and link
- replaces the managed block

---

### 3. Hook into publish

Add to `package.json`

    {
        "scripts": {
            "prepublishOnly": "node scripts/update-readme-link.cjs"
        }
    }

---

### 4. Add resolver page

1. Copy `readme-resolver.html` from this repository.
2. Place it in your project (e.g. `docs/readme-resolver.html`).
3. Enable GitHub Pages for that folder.

The page will:

- read the version from the URL.
- query the npm registry.
- redirect to the appropriate repository state on GitHub, where the README is displayed.

---

### 5. Push tags

* After every `npm version ...`,  push commits and tags:

         git push --follow-tags

* You should consider automating it with `postversion`. For example:

        {
            "scripts": {
                "postversion": "git push --follow-tags"
            }
        }
---

## 🧩 Design principles

- npm is the source of truth for versions.
- GitHub is the source of truth for content.
- No hidden automation.
- Correctness enforced at publish time.

---

## 📄 License

MIT