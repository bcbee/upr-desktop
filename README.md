# Universal Presenter Remote — Desktop

Control your presentations from any platform. UPR Desktop pairs with the
Universal Presenter Remote phone/web remote: enter the 6‑digit session token
shown by the remote, and the desktop app advances/reverses your slides by sending
arrow‑key presses to whatever presentation software is in focus (Keynote,
PowerPoint, Google Slides, …).

This is a clean‑sheet rewrite on the latest Electron + TypeScript, replacing the
old electron‑react‑boilerplate stack. It keeps the original UI, behaviour, and
server protocol while modernising the security model and build pipeline.

- **Runtime:** Electron (latest), React 19, TypeScript
- **Bundler:** [electron‑vite](https://electron-vite.org)
- **Packaging / updates:** [electron‑builder](https://www.electron.build) +
  [electron‑updater](https://www.electron.build/auto-update) via GitHub Releases
- **Platforms:** macOS (universal arm64 + x64), Windows (x64; arm64 best‑effort)

## Architecture

All privileged work runs in the **main process**; the renderer is a sandboxed
React UI that talks to main over a typed `contextBridge` preload (`window.upr`).
The renderer has no Node/Electron access (`contextIsolation: true`,
`nodeIntegration: false`, `sandbox: true`).

```
src/
  main/        Electron main: window, menu, auto-update, IPC, and all logic:
               session (HTTP join), socket (Socket.IO listener), verify
               (RSA-SHA256 signature check), keys (native keystrokes)
  preload/     contextBridge → window.upr
  renderer/    React UI (Login + Present screens), CSS modules
  shared/      types shared between main and renderer
build/         electron-builder resources (icons, entitlements)
docs/          SOCKETIO_UPGRADE.md — backward-compatible Socket.IO v4 plan
```

Keystroke injection uses two local, first‑party modules kept as `file:`
dependencies:

- [`send-keys-native`](../send-keys-native) — pure JS; macOS sends arrow keys via
  `osascript` (System Events), Windows delegates to the addon below.
- [`send-keys-native-windows`](../send-keys-native-windows) — an N‑API
  (`node-addon-api`) addon wrapping the Win32 SendInput/keybd_event APIs. It is
  only installed/compiled on Windows (`"os": ["win32"]`, optional dependency).

## Prerequisites

- Node.js 20+ and npm
- macOS builds: Xcode Command Line Tools (`xcode-select --install`)
- Windows builds: Visual Studio Build Tools with the **Desktop development with
  C++** workload (to compile `send-keys-native-windows`)

## Development

```bash
npm install
npm run dev          # electron-vite dev server with HMR
npm run typecheck    # tsc for main/preload and renderer
```

> On macOS the app needs Automation permission to drive System Events. The first
> keystroke triggers a system prompt; grant it (or enable it later under System
> Settings → Privacy & Security → Automation / Accessibility).

## Building & packaging

```bash
npm run build        # electron-vite build → out/
npm run package      # build + electron-builder (no publish) → release/
npm run release      # build + electron-builder --publish always (GitHub Releases)
```

`electron-builder.yml` holds the packaging config (appId
`com.universalpresenterremote.desktop`, universal mac dmg+zip, Windows nsis,
GitHub publish target).

## Auto‑update

Updates use `electron-updater` against **GitHub Releases**. On launch (packaged
builds only) the app calls `autoUpdater.checkForUpdatesAndNotify()`; a downloaded
update installs when the user quits the app (`autoInstallOnAppQuit`), never by
force-restarting — an update must not interrupt a live presentation. The
**Help → Check For Updates** / **Enable Beta Updates** menu items expose manual
and prerelease checks.

electron‑builder publishes the files the updater needs to each release:

| Platform | Metadata | Payload | Integrity |
| --- | --- | --- | --- |
| macOS | `latest-mac.yml` | `*-mac.zip` (Squirrel.Mac uses the zip, not the dmg) | `*.zip.blockmap` |
| Windows | `latest.yml` | `*-setup.exe` | `*.exe.blockmap` |

The mac **zip target is required** for macOS auto‑update — a dmg‑only build will
not update. A new release's version must be strictly greater than the installed
one.

> **Do not use `electron-builder` 26.15.0 or 26.15.1.** Those releases bundle
> 7‑Zip 24.09, which dereferences symlinks when building the macOS `.zip`. That
> collapses the `Electron Framework.framework` symlink farm (`Versions/Current`,
> and the top‑level `Electron Framework`/`Resources`/`Libraries`/`Helpers`) into
> duplicated real copies — tripling the app to ~800 MB and breaking the code
> signature (`codesign`: "bundle format is ambiguous"), so Squirrel.Mac rejects
> the update and macOS reports the app as "damaged and can't be opened." It ships
> fine but every macOS auto‑update fails. Fixed in **26.15.2+**
> ([electron-builder#9847](https://github.com/electron-userland/electron-builder/pull/9847));
> keep the pin at ≥ 26.15.2.

## Release process

Bump `version` in `package.json`, commit, and push a matching tag
(e.g. `v2.0.0`) — the release workflow verifies the tag matches the version,
then builds, signs/notarizes (macOS), and publishes both platforms to GitHub
Releases. Installed clients pick the release up on their next launch and
install it when the user quits the app.

History note: the legacy v1.3.x line (the pre‑rewrite app) was signed with the
same Developer ID team but never notarized. That's fine for auto‑update —
Squirrel.Mac validates the code signature (bundle ID + Team ID), not
notarization, so legacy installs update directly to the signed 2.x line. A
transitional unsigned "bridge" build (v1.3.3) was briefly published under the
mistaken belief that v1.3.1 was unsigned; unsigned macOS artifacts fail
Squirrel.Mac validation and must never be published to the update feed again.

**Keep the same Team ID and appId (`com.universalpresenterremote.desktop`)
across releases** — Squirrel.Mac pins both, and changing either strands every
installed macOS client on its current version.

## macOS code signing & notarization

Notarization is required for a Gatekeeper‑friendly, auto‑updatable macOS build.
electron‑builder performs it automatically during a signed build via its built‑in
`mac.notarize: true` (which drives `@electron/notarize` + `notarytool` — no extra
package or `afterSign` hook needed).

### 1. Credentials

You need an Apple Developer account and a **Developer ID Application**
certificate exported as a `.p12`. Provide it and your notarization credentials as
environment variables (e.g. in CI secrets):

```bash
# Signing certificate (Developer ID Application)
export CSC_LINK="base64-of-your-DeveloperID.p12"     # or a file path
export CSC_KEY_PASSWORD="p12-password"

# Notarization — Apple ID + app-specific password
export APPLE_ID="brendan@dbztech.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # appleid.apple.com → App-Specific Passwords
export APPLE_TEAM_ID="XXXXXXXXXX"                          # 10-char Team ID
```

(Alternatively use an App Store Connect API key: `APPLE_API_KEY` /
`APPLE_API_KEY_ID` / `APPLE_API_ISSUER`.)

### 2. Build (signs + notarizes + staples automatically)

```bash
npm run release      # or: npm run package, with the env vars above set
```

With the credentials present and `notarize: true` in `electron-builder.yml`, the
build signs with the hardened runtime, submits to Apple via `notarytool`, waits,
and staples the ticket to the `.app` before zipping/dmg’ing.

### 3. Manual notarization / verification (fallback & debugging)

```bash
# Submit a built artifact and wait for the result
xcrun notarytool submit "release/upr-desktop-2.0.0-arm64-mac.zip" \
  --apple-id "$APPLE_ID" --team-id "$APPLE_TEAM_ID" \
  --password "$APPLE_APP_SPECIFIC_PASSWORD" --wait

# Staple the ticket to the app/dmg
xcrun stapler staple "release/upr-desktop-2.0.0-arm64-mac.dmg"

# Verify signature, stapling, and Gatekeeper acceptance
xcrun stapler validate "release/upr-desktop-2.0.0-arm64-mac.dmg"
spctl -a -vvv -t install "release/mac-arm64/Universal Presenter Remote.app"
codesign --verify --deep --strict --verbose=2 \
  "release/mac-arm64/Universal Presenter Remote.app"
```

### Entitlements & runtime permission

`build/entitlements.mac.plist` grants the hardened‑runtime entitlements Electron
needs plus `com.apple.security.automation.apple-events` (required to drive System
Events for keystrokes). `Info.plist` carries `NSAppleEventsUsageDescription`
(set via `mac.extendInfo`), which is the message shown in the macOS Automation
permission prompt — without it the prompt is suppressed and keystrokes silently
fail under a notarized build. At runtime the first keystroke triggers that
prompt; if denied, the app surfaces the permission notice and the user can grant
it under **System Settings → Privacy & Security → Automation / Accessibility**.

## Windows builds

`electron-builder --win` produces an NSIS installer. `npmRebuild` runs
`@electron/rebuild`, which compiles `send-keys-native-windows` against the target
Electron ABI; the resulting `.node` is kept outside the asar (`asarUnpack`) so it
can be loaded at runtime. Build on Windows (or a Windows CI runner) so the native
toolchain is available.

**Windows on ARM (arm64)** is best‑effort: add `arm64` to the `win` target in
`electron-builder.yml` and build with `--win --arm64`, but the runner needs the
Visual Studio **ARM64 C++ build tools** to compile the native addon. Until that
is set up, ship x64 — it runs on Windows‑on‑ARM under emulation.

## Socket.IO

The app pins `socket.io-client@2` to match the deployed server. See
[docs/SOCKETIO_UPGRADE.md](docs/SOCKETIO_UPGRADE.md) for the backward‑compatible
plan to move the whole stack to Socket.IO v4 without breaking installed clients.

## License

MIT © Brendan Boyle
