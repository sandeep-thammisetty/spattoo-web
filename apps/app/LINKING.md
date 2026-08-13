# Linking `@spattoo/designer` (core) into `apps/app`

`apps/app` consumes the cake designer from `spattoo-core` (`@spattoo/designer`).

## Current (stopgap) — vendored tarball
Turbopack can't resolve a `file:` **symlink** pointing outside the repo root, so we
install core as a **packed tarball** committed at `vendor/spattoo-designer-*.tgz`
(referenced by `apps/app/package.json` → `"@spattoo/designer": "file:../../vendor/..."`).
Real files land in `node_modules`, inside the repo root, which Turbopack resolves fine.

### Shipping a core change — use `npm run release`
```sh
cd <spattoo-core checkout>
npm run release              # rebase → verify → bump → push+tag → pack → bump web → install → commit → push
npm run release -- --dry-run # print the plan, change nothing
npm run release -- --no-push # do it all locally, push by hand
```

**Prefer this over doing the steps by hand.** Shipping core is seven steps across two
repos, and the failure when one is missed is never "it broke" — it is "it deployed and
nothing changed", which looks like the code not working and sends you debugging the
wrong thing.

It also closes a hole no amount of care covers: **`npm version patch` increments the
LOCAL package.json and asks nobody.** Two sessions on the same afternoon both read
`0.1.192`, both cut `0.1.193`, and the second push is rejected *after* the tag exists
locally — so it has to be deleted and re-cut by hand. That happened twice in one day.
`release` derives the next version from the highest tag **on origin**, so a parallel
release is stepped over instead of collided with, and pushes the branch and tag with
`--atomic` so a rejected branch push can never leave a tag pointing at a commit nobody
has.

<details><summary>The underlying steps, if you ever need them by hand</summary>

```sh
cd <spattoo-core checkout>
npm run pack:vendor -- <spattoo-web>/vendor
# then bump the filename in apps/app/package.json, and:
cd <spattoo-web> && npm install
```
</details>

`pack:vendor` builds, packs, and refuses to produce a tarball that cannot be trusted. It
stops if the tree is dirty (matches no commit), if HEAD is behind `origin/dev` (see below),
if that version is already vendored (the double-pack trap below), and finally diffs the
tarball's `src/` against `git archive HEAD src`.

> **`npm pack` packs the working tree, not the commit.** Nothing in npm ties the two
> together, so a tarball can carry a version whose source it does not contain. That has
> shipped: `0.1.161`'s release commit contained the template-thumbnail crop, but the
> tarball vendored as `0.1.161` did not — it was packed from a branch predating the merge.
> The crop was live in core and absent from production, and every check run against the
> repo passed. Packing from a stale branch is the failure mode; `pack:vendor` is the guard.

> **Never re-pack the same version twice.** If you change core again, bump the version
> and pack THAT — do not overwrite an existing `vendor/spattoo-designer-<v>.tgz`.
>
> `npm install` keys its resolution on the version string, so a second pack of the same
> version leaves the FIRST tarball's `integrity` hash in `package-lock.json` while the
> file on disk is the second one. Locally everything still works: `npm install`, `npm ci`
> and `next build` all pass, because your npm cache already holds the content and
> satisfies the checksum from cache. Vercel builds with a cold cache, hashes the actual
> file, and dies:
>
> ```
> npm error code EINTEGRITY
> npm error ... wanted sha512-<first pack> but got sha512-<second pack>. (N bytes)
> Error: Command "npm install" exited with 1
> ```
>
> It is invisible to every local check, so the version bump is the safeguard. If you have
> already double-packed, fix it without regenerating the lockfile (that would strip the
> non-darwin optional binaries and break Vercel a different way) — recompute and paste
> the one line:
>
> ```sh
> openssl dgst -sha512 -binary vendor/spattoo-designer-<v>.tgz | openssl base64 -A
> # replace the `integrity` value for that tarball in package-lock.json
> ```

## Proper fix (decision pending)
Publish `@spattoo/designer` to a registry (npm / GitHub Packages) and depend on it
normally. That removes the vendored tarball and the manual re-pack. Chosen later.

## Notes
- Core ships no `.d.ts`; `apps/app/types/spattoo-designer.d.ts` declares the module.
- Core's React/three are peer deps — `apps/app` provides `react`, `three`,
  `@react-three/fiber`, `@react-three/drei`.
