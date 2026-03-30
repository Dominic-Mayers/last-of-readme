# Last of README

> Resolve README to the last relevant commit based on npm version.

<!-- DOC-LINK-START --><a href="https://Dominic-Mayers.github.io/last-of-readme/readme-resolver.html?mode=last&pkg=%40dominic.mayers%2Flast-of-readme&repo=Dominic-Mayers%2Flast-of-readme&v=0.1.1"><img alt="README-last of 0.1.1" src="https://img.shields.io/badge/README-last%20of%200.1.1-blue?logo=github"></a><!-- DOC-LINK-END -->

<details>
<summary>📋 Click to copy placeholder</summary>

```html
<\!-- DOC-LINK-START --><\!-- DOC-LINK-END -->

---

## ⚙️ Setup

Insert placeholder, copy the update script, copy readme-resolver.html, hook into version, and push tags.

### 1. Add managed block placeholder to your README

Add in your README a DOC-LINK placeholder identical to the one used at the top of this README. Place it where you want the documentation button to appear. You do not have to keep the content inside the placeholder. The content will be replaced by the update script anyway.

---

### 2. Add update script and run it

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
- generates a documentation badge and its link
- inserts the badge into the placeholder

---

### 3. Hook into version

Add to `package.json`

    {
        "scripts": {
            "version": "node scripts/update-readme-link.cjs && git add README.md",
        }
    }

This will execute the update script and stage the updated README.md after each new version.

---

### 4. Add resolver page

A. Copy `docs/readme-resolver.html` from this repository.
B. Place it in your project (e.g. `docs/readme-resolver.html`).
C. Enable GitHub Pages for that folder.

The page will:

- read the requested version from the URL.
- query the npm registry.
- redirect to the appropriate repository state on GitHub, where the README is displayed.

---

### 5. Push tags

* After every `npm version ...`,  push commits and tags:

         git push --follow-tags

* You should consider automating it with `postversion`. For example:

        {
            "scripts": {
                "version": "node scripts/update-readme-link.cjs && git add README.md",
                "postversion": "git push --follow-tags"
            }
        }
---

## 🧩 Design principles
```
┌────────────────────┐                                      ┌────────────────────┐
│                    │                                      │                    │
│  Version registry  │ ◄──────┐                     ┌──────►│     Git history    │
│                    │        │                     │       │                    │
└────────────────────┘        │                     │       └────────────────────┘
           ▲                  │                     │                 ▲           
 Relation  │                  ▼                     ▼                 │           
 to        │              ┌─────────────────────────────┐             │ Relation  
 published │              │                             │             │ to        
 code      │              │       Last of README        │             │ contents  
           ▼              │ maps versions to repository │             ▼           
┌────────────────────┐    │     states (commits)        │   ┌────────────────────┐
│                    │    │                             │   │                    │
│ Published packages │    └─────────────────────────────┘   │ Repository content │
│                    │                                      │ (code, README, …)  │
└────────────────────┘                                      └────────────────────┘
```
Last of README maps versions to repository states (commits) as follows:

- The version registry defines version identifiers and their relation to the published code.
- Git defines repository states (commits) and their relation to contents.
- The user creates Git tags to associate versions with repository states.
- The links inserted into README files leverage that association to point to the last commit associated with a given version.

---

## 📄 License

MIT