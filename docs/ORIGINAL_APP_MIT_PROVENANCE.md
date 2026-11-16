# Original app code: provenance and MIT scope

## Reference points

- Last Xiang-authored source snapshot before later contributions in this
  repository: [`ee17ef3d58d372d8c5157407c036f846869ab251`](https://github.com/mecp-org/MECP/commit/ee17ef3d58d372d8c5157407c036f846869ab251),
  dated 27 February 2026. The app source itself was last changed in the
  preceding Xiang-authored commit, `1441c5d13bd777e8dac8e12567bbd144b1a73e16`.
- Last Xiang-authored commit in the separate `mecp-app` history:
  [`ec600d809af7dae61cd9df68d1975a6f65084515`](https://github.com/mecp-org/mecp-app/commit/ec600d809af7dae61cd9df68d1975a6f65084515).
- Current `mecp-app` tree examined:
  [`80139af8e6855eeb1e6e2cd8f6997c074968155e`](https://github.com/mecp-org/mecp-app/commit/80139af8e6855eeb1e6e2cd8f6997c074968155e),
  fetched on 16 November 2026.

Git author records show provenance, but they do not by themselves prove
copyright ownership. The [MIT grant](../LICENSE-ORIGINAL-APP-MIT.md) relies
on Xiang Wong's representation that he owns the original implementation code
covered by it. It does not grant rights to later contributors' material.

## File comparison

At the reference snapshot, 61 files were tracked under `app/`, `engine/`,
`examples/`, and `web/`. In the current `mecp-app` tree, the original `app/`
prefix has been removed. Comparing the Git blob IDs after that path mapping:

- **54 files are identical** to the original snapshot. This includes the
  original app screens, components, transport and storage code; engine source
  and tests; the three example implementations; and the web tool. The count
  also includes `assets/icon.png`, which is **excluded** from the MIT grant.
- **Six files differ:** `babel.config.js`, `metro.config.js`, `package.json`,
  `src/i18n/languages.ts`, `tsconfig.json`, and `engine/package.json`. Their
  original versions are covered by the scoped MIT grant. The later edits in
  the current files are not covered by that grant.
- **One original file is absent:** `engine/package-lock.json`. Generated
  dependency lockfiles are excluded from the grant.

The embedded `LANGUAGES` object in `web/index.html` contains language text.
Only the implementation code in that otherwise identical file is within the
MIT grant; the language text remains CC BY 4.0. The app icon and third-party
dependencies are excluded. `docs/MECP_Design_Plan.md` is outside the code
paths named in the grant; its current copy also differs from the original.

The 54 matching blobs do **not** make the entire current app repository MIT.
New files and modified portions after the Xiang-authored snapshot remain under
their existing terms unless their rights holders authorize another license.
The current app repository declares GPLv3 for the combined app, engine, web,
and examples.

## Later app repository work to discuss

The non-merge commits by Joey Stanford (`@rinchen`) after the original app
snapshot are:

| Commit | Files or work to clarify for MIT permission |
| --- | --- |
| [`e932997`](https://github.com/mecp-org/mecp-app/commit/e932997) | Submodule setup, README, dependency and language import paths, configuration changes; this commit also added the GPL license file, whose legal text is not being offered under MIT |
| [`6e10820`](https://github.com/mecp-org/mecp-app/commit/6e10820) | TypeScript configuration change |
| [`6094b3c`](https://github.com/mecp-org/mecp-app/commit/6094b3c) | Generated root lockfile |
| [`59090c8`](https://github.com/mecp-org/mecp-app/commit/59090c8) | Import of original engine, examples, web, and design plan, plus new workflows, README and configuration edits |
| [`c8583ea`](https://github.com/mecp-org/mecp-app/commit/c8583ea) | Submodule pointer update |
| [`1221efd`](https://github.com/mecp-org/mecp-app/commit/1221efd) | README link to web builder |

The import commit's authorship does not transfer authorship of the unchanged
original code. The question is whether Joey can authorize **his own
copyrightable additions and modifications** under MIT, including any changes
within files originally written by Xiang, and whether any material in these
commits came from someone else.
