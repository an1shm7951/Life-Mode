# Third-party dependency license inventory

**Snapshot:** `package-lock.json` on the `seo-launch-improvements` branch, lockfile version 3.  
**Inventory date:** 27 November 2026.  
**Scope:** 441 installed package entries recorded in the lockfile, including transitive and development dependencies.

This is an automated metadata inventory, not a legal opinion and not a substitute for checking the actual license text shipped with each package. A package's `license` field is a discovery aid; the package's LICENSE/NOTICE files and the applicable license text control.

## SPDX metadata summary

| License expression | Package entries |
|---|---:|
| MIT | 352 |
| Apache-2.0 | 31 |
| ISC | 17 |
| LGPL-3.0-or-later | 10 |
| MPL-2.0 | 13 |
| BSD-2-Clause | 7 |
| BSD-3-Clause | 2 |
| CC-BY-4.0 | 1 |
| CC0-1.0 | 1 |
| 0BSD | 1 |
| BlueOak-1.0.0 | 1 |
| Python-2.0 | 1 |
| Apache-2.0 AND LGPL-3.0-or-later | 3 |
| Apache-2.0 AND LGPL-3.0-or-later AND MIT | 1 |
| **Total** | **441** |

## Packages requiring a closer notice review

### LGPL-3.0-or-later and compound LGPL expressions

The lockfile identifies the following libvips platform packages:

- `@img/sharp-libvips-darwin-arm64@1.2.4`
- `@img/sharp-libvips-darwin-x64@1.2.4`
- `@img/sharp-libvips-linux-arm@1.2.4`
- `@img/sharp-libvips-linux-arm64@1.2.4`
- `@img/sharp-libvips-linux-ppc64@1.2.4`
- `@img/sharp-libvips-linux-riscv64@1.2.4`
- `@img/sharp-libvips-linux-s390x@1.2.4`
- `@img/sharp-libvips-linux-x64@1.2.4`
- `@img/sharp-libvips-linuxmusl-arm64@1.2.4`
- `@img/sharp-libvips-linuxmusl-x64@1.2.4`
- `@img/sharp-wasm32@0.34.5` (compound expression)
- `@img/sharp-win32-arm64@0.34.5` (compound expression)
- `@img/sharp-win32-ia32@0.34.5` (compound expression)
- `@img/sharp-win32-x64@0.34.5` (compound expression)

Review the exact package artifacts and whether any covered binaries are conveyed to users. LGPL obligations can differ depending on whether and how a library is distributed or linked. Do not infer compliance from the package metadata alone.

### MPL-2.0

The lockfile includes:

- `axe-core@4.12.1`
- `lightningcss@1.32.0`
- `lightningcss-android-arm64@1.32.0`
- `lightningcss-darwin-arm64@1.32.0`
- `lightningcss-darwin-x64@1.32.0`
- `lightningcss-freebsd-x64@1.32.0`
- `lightningcss-linux-arm-gnueabihf@1.32.0`
- `lightningcss-linux-arm64-gnu@1.32.0`
- `lightningcss-linux-arm64-musl@1.32.0`
- `lightningcss-linux-x64-gnu@1.32.0`
- `lightningcss-linux-x64-musl@1.32.0`
- `lightningcss-win32-arm64-msvc@1.32.0`
- `lightningcss-win32-x64-msvc@1.32.0`

Review MPL source-file notice and distribution requirements for any modified MPL-covered files that are conveyed.

### Other less-common license identifiers

- `@typescript-eslint/typescript-estree/node_modules/minimatch@10.2.5` — BlueOak-1.0.0
- `argparse@2.0.1` — Python-2.0
- `caniuse-lite@1.0.30001799` — CC-BY-4.0
- `language-subtag-registry@0.3.23` — CC0-1.0

Verify attribution and notice requirements against the original package files and upstream license texts.

## Common license families

The remaining lockfile entries are identified as MIT, Apache-2.0, ISC, BSD-2-Clause, BSD-3-Clause or 0BSD. Preserve the copyright and license notices for any third-party code that is redistributed. Apache-2.0 packages may also include NOTICE files that need to accompany a distribution.

## Required release procedure

1. Re-run the inventory whenever `package-lock.json` changes.
2. Inspect the installed package contents and upstream repositories for LICENSE, COPYING and NOTICE files.
3. Determine which packages are included in the production server bundle, client bundle, build-only environment and any downloadable artifacts.
4. Check whether any covered package has been modified or redistributed in a way that triggers additional obligations.
5. Include the applicable third-party notices in a user-accessible location before distributing covered materials.
6. Have counsel or a qualified open-source compliance reviewer sign off before commercial distribution.

Useful primary references:

- [GNU LGPL FAQ](https://www.gnu.org/licenses/gpl-faq.html)
- [Mozilla Public License 2.0](https://www.mozilla.org/MPL/2.0/)
- [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- [Blue Oak Model License 1.0.0](https://blueoakcouncil.org/license/1.0.0)
- [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/)

## Important limitation

This report does not cover separately acquired images, icons, fonts, illustrations, video, sound, copied code snippets, or other non-NPM assets. Those require their own source and license records.
