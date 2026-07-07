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
- **Platforms:** macOS (arm64 + x64), Windows (x64; arm64 best‑effort)

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
`com.universalpresenterremote.desktop`, mac dmg+zip for both arches, Windows
nsis, GitHub publish target).

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

## Release process & the v1.3.x → 2.0.0 migration

The previously shipped build (v1.3.1) was **unsigned** on macOS. Squirrel.Mac
refuses to apply an update from an unsigned app to a newly signed+notarized one,
so we migrate in two tracks:

1. **Transitional bridge — `1.3.2`, unsigned.** The rewrite, version‑stamped
   1.3.2 and built without signing/notarization, published to the GitHub
   auto‑update feed. Windows installs update to it seamlessly; macOS installs
   attempt it (best‑effort) and, on macOS, show an in‑app notice directing the
   user to download the signed build from the website.

   The bridge is built **locally, once per OS** (the Windows native addon can
   only compile on Windows, and the release workflow deliberately refuses
   `1.3.x` tags). Attach both platforms' artifacts to the same `v1.3.2` GitHub
   release.

   On macOS:

   ```bash
   npm run build:bridge   # electron-vite build --mode bridge (shows the macOS notice)
   CSC_IDENTITY_AUTO_DISCOVERY=false npx electron-builder --mac \
     --publish always \
     --config.mac.notarize=false --config.mac.hardenedRuntime=false
   ```

   On Windows (the migration notice is macOS‑only, so the plain build is fine):

   ```powershell
   npm run build
   npx electron-builder --win --publish always
   ```

2. **Signed line — `2.0.0`, signed + notarized.** Bump `version` to `2.0.0`,
   build normally (`npm run release`, flag off). Distribute from the website now;
   promote it to the GitHub feed once the bridge has circulated, so a fresh
   v1.3.1 user doesn't jump straight to a signed build and hit the same
   discontinuity. From 2.0.0 onward macOS auto‑update works normally
   (signed → signed); Windows updates seamlessly throughout.

> Some macOS v1.3.1 users whose unsigned auto‑update never applied cannot be
> reached by the bridge; point them to the website download via a banner/email.

Keep the same signing identity/Team ID across releases — changing it re‑triggers
the macOS discontinuity.

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
