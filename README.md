# Last of README

> Resolve README to the last relevant commit based on npm version

<!-- DOC-LINK-START -->[![README-last of pending](https://img.shields.io/badge/README-last%20of%20pending-blue?logo=github)](https://<your-username>.github.io/<your-repo>/readme-resolver.html?mode=last&v=__VERSION__)<!-- DOC-LINK-END -->

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

- Uses **npm registry** to determine version ordering
- Uses **GitHub tags** to locate the corresponding README
- Falls back to `main` when no newer version exists

---

## 🔗 Example

    [![README-last of 0.1.9](...)](readme-resolver.html?mode=last&v=0.1.9)

- If `0.1.10` exists → redirects to `v0.1.10`
- Otherwise → redirects to `main`

---

## ⚙️ Setup

### 1. Add managed block to your README

    <!-- DOC-LINK-START -->[![README-last of pending](https://img.shields.io/badge/README-last%20of%20pending-blue?logo=github)](https://<your-username>.github.io/<your-repo>/readme-resolver.html?mode=last&v=__VERSION__)<!-- DOC-LINK-END -->

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

    {
      "scripts": {
        "prepublishOnly": "node scripts/update-readme-link.cjs"
      }
    }

---

### 4. Add resolver page

1. Copy `readme-resolver.html` from this repository
2. Place it in your project (e.g. `docs/readme-resolver.html`)
3. Enable GitHub Pages for that folder

The page will:

- read the version from the URL
- query the npm registry
- redirect to the appropriate README

---

## ⚠️ Notes

- Git tags must be pushed:

    git push --follow-tags

- The script must run at publish time
- The README block is managed state

---

## 🧩 Design principles

- npm is the source of truth for versions
- GitHub is the source of truth for content
- no hidden automation
- correctness enforced at publish time

---

## 📄 License

MIT
