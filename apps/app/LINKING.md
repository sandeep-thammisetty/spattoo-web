# Linking `@spattoo/designer` (core) into `apps/app`

`apps/app` consumes the cake designer from `spattoo-core` (`@spattoo/designer`).

## Current (stopgap) — vendored tarball
Turbopack can't resolve a `file:` **symlink** pointing outside the repo root, so we
install core as a **packed tarball** committed at `vendor/spattoo-designer-*.tgz`
(referenced by `apps/app/package.json` → `"@spattoo/designer": "file:../../vendor/..."`).
Real files land in `node_modules`, inside the repo root, which Turbopack resolves fine.

### Regenerate after changing core
```sh
cd <spattoo-core checkout> && npm run build && \
  npm pack --pack-destination=<spattoo-web>/vendor
# then bump the filename in apps/app/package.json if the version changed, and:
cd <spattoo-web> && npm install
```

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
