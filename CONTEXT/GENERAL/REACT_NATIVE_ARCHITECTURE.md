# React Native/Expo Architecture: Client-Server Model

## Overview

React Native uses a **client-server architecture** where:
- **Client** = Native app running on your device/simulator (iOS/Android)
- **Server** = Metro bundler running on your computer (JavaScript bundler)

## The Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR COMPUTER                         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Metro Bundler (Server)                    │  │
│  │         Port: 8081                                │  │
│  │                                                    │  │
│  │  • Bundles JavaScript/TypeScript                 │  │
│  │  • Serves code over HTTP                          │  │
│  │  • Provides hot reload                            │  │
│  │  • Shows console logs                             │  │
│  └──────────────────────────────────────────────────┘  │
│                        ↕ HTTP                           │
│                        ↕ WebSocket                      │
└─────────────────────────────────────────────────────────┘
                          ↕ Network
                          ↕ (WiFi/USB)
┌─────────────────────────────────────────────────────────┐
│                  YOUR DEVICE/SIMULATOR                   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Native App (Client)                       │  │
│  │                                                    │  │
│  │  • Native iOS/Android code                       │  │
│  │  • JavaScript Runtime (Hermes/JSC)               │  │
│  │  • Requests JavaScript bundle from Metro          │  │
│  │  • Executes JavaScript code                      │  │
│  │  • Sends logs/errors back to Metro               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## How It Works

### 1. **Metro Bundler (Server)**
- **What it is**: JavaScript bundler and development server
- **Runs on**: Your computer (Mac/PC)
- **Port**: 8081 (default)
- **Responsibilities**:
  - Transpiles TypeScript/JavaScript
  - Bundles all your code into a single file
  - Serves the bundle over HTTP
  - Provides hot reload via WebSocket
  - Shows console logs from the app

### 2. **Native App (Client)**
- **What it is**: Compiled iOS/Android app
- **Runs on**: Your device/simulator
- **Responsibilities**:
  - Contains native code (Swift/Kotlin)
  - Has JavaScript runtime embedded
  - Requests JavaScript bundle from Metro
  - Executes JavaScript code
  - Renders UI using native components
  - Sends logs/errors back to Metro

### 3. **Connection**
- **Protocol**: HTTP (for bundle) + WebSocket (for hot reload)
- **Network**: Same WiFi network OR USB (for physical devices)
- **URL Format**: `exp://YOUR_IP:8081` or `http://YOUR_IP:8081`

## Development Workflow

### Step 1: Build Native App (One-Time)

```bash
npx expo run:ios --device
```

**What this does:**
1. Compiles native iOS code (Swift/Objective-C)
2. Links native modules (Firebase, Notifications, etc.)
3. Embeds JavaScript runtime
4. Installs app on device
5. **May start Metro automatically** (depends on Expo version)

**Result**: Native app installed, ready to connect to Metro

### Step 2: Start Metro Bundler (Every Time)

```bash
npx expo start --dev-client
```

**What this does:**
1. Starts Metro bundler on port 8081
2. Waits for client to connect
3. Serves JavaScript bundle when requested
4. Enables hot reload via WebSocket

**Result**: Server ready, waiting for app to connect

### Step 3: Connect App to Metro

**Automatic (if on same WiFi):**
- App opens → Detects Metro → Connects automatically

**Manual:**
- Shake device → Enter URL → `exp://192.168.1.100:8081`

## Why Port 8081 Might Already Be In Use

### Scenario 1: Metro Already Running

If `npx expo run:ios --device` started Metro automatically:

```bash
# Check what's using port 8081
lsof -i :8081

# You'll see something like:
# COMMAND   PID  USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
# node    12345  matt   23u  IPv4  ...      0t0  TCP *:8081 (LISTEN)
```

**Solution**: Use the existing Metro server! Don't start a new one.

### Scenario 2: Previous Metro Still Running

If you closed the terminal but Metro is still running:

```bash
# Kill the process
killall node

# Or kill specific process
kill -9 <PID>

# Then start fresh
npx expo start --dev-client
```

### Scenario 3: Another App Using Port 8081

Rare, but possible:

```bash
# Find what's using it
lsof -i :8081

# Kill it
kill -9 <PID>

# Or use different port
npx expo start --dev-client --port 8082
```

## Understanding the Commands

### `npx expo run:ios --device`
- **Purpose**: Build and install native app
- **Starts Metro?**: Sometimes (depends on Expo version/flags)
- **When to use**: When native code changes, first time setup
- **Output**: Native app on device

### `npx expo start --dev-client`
- **Purpose**: Start Metro bundler for development
- **Starts Metro?**: Always
- **When to use**: Every time you want to develop/debug
- **Output**: Metro server on port 8081

### `npx expo start` (without --dev-client)
- **Purpose**: Start Metro for Expo Go
- **Use case**: Expo Go (not development builds)
- **Not for**: Development builds with native modules

## Development vs Production

### Development Mode (What We're Doing)

```
Native App (Device) ←→ Metro Bundler (Computer)
     ↓                        ↓
Requests JS bundle    Serves JS bundle
Sends logs           Shows logs
Hot reload           Provides hot reload
```

**Benefits:**
- Hot reload (instant updates)
- Console logs visible
- Fast iteration
- Debugging tools

**Requirements:**
- Metro must be running
- Device and computer on same network
- App must be connected to Metro

### Production Mode (App Store Build)

```
Native App (Device)
     ↓
Bundled JavaScript (embedded in app)
```

**How it works:**
- JavaScript is bundled at build time
- Bundle is embedded in the app
- No Metro server needed
- App works offline
- No hot reload

## Checking Your Setup

### Is Metro Running?

```bash
# Check port 8081
lsof -i :8081

# Should show node process if Metro is running
```

### Is App Connected?

**Signs it's connected:**
- ✅ Logs appear in Metro terminal
- ✅ Hot reload works
- ✅ Changes appear instantly
- ✅ Console.log shows in terminal

**Signs it's NOT connected:**
- ❌ No logs in terminal
- ❌ "No development server" message
- ❌ Changes require rebuild
- ❌ App uses bundled code (not live)

### What's Running?

```bash
# See all node processes
ps aux | grep node

# See what's on port 8081
lsof -i :8081

# See network connections
netstat -an | grep 8081
```

## Best Practices

### 1. One Metro Server at a Time
- Don't start multiple Metro servers
- If port is in use, use the existing one or kill it first

### 2. Keep Metro Running
- Start Metro once at beginning of session
- Keep it running while developing
- Only restart if you have issues

### 3. Rebuild Only When Needed
- Rebuild (`npx expo run:ios`) when native code changes
- Don't rebuild for JavaScript changes
- Use hot reload for JS changes

### 4. Check Connection Status
- Monitor Metro terminal for logs
- If no logs, app isn't connected
- Use manual URL if auto-connect fails

## Troubleshooting

### "Port 8081 already in use"

```bash
# Option 1: Use existing Metro
# Just connect your app to it (shake device → enter URL)

# Option 2: Kill existing Metro
lsof -i :8081  # Find PID
kill -9 <PID>  # Kill it
npx expo start --dev-client  # Start fresh

# Option 3: Use different port
npx expo start --dev-client --port 8082
# Then connect app to: exp://YOUR_IP:8082
```

### "No development server found"

1. **Check Metro is running:**
   ```bash
   lsof -i :8081
   ```

2. **Check same network:**
   - Device and computer on same WiFi

3. **Try manual URL:**
   - Shake device → Enter URL manually
   - Use: `exp://YOUR_COMPUTER_IP:8081`

4. **Restart both:**
   - Kill Metro: `killall node`
   - Restart Metro: `npx expo start --dev-client`
   - Reload app on device

### No Logs Appearing

1. **Verify connection:**
   - Shake device → Check dev menu
   - Should show "Development server" or URL

2. **Check Metro terminal:**
   - Should show "Metro waiting on..."
   - Should show connection when app opens

3. **Try manual connection:**
   - Shake device → "Enter URL manually"
   - Enter Metro URL from terminal

## Summary

- **Metro Bundler** = Server on your computer (port 8081)
- **Native App** = Client on your device
- **Connection** = App requests code from Metro, Metro serves it
- **Development** = App uses live code from Metro (hot reload)
- **Production** = App uses bundled code (no Metro needed)

The key insight: **Metro is the server, your app is the client**. They communicate over the network to enable development features like hot reload and live logs.

