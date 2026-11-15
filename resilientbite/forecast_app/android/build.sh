#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
SDK="${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}"
JAVA_HOME="${JAVA_HOME:-/Applications/Android Studio.app/Contents/jbr/Contents/Home}"
export JAVA_HOME
export PATH="$JAVA_HOME/bin:$PATH"
BUILD_TOOLS="$SDK/build-tools/36.0.0"
mkdir -p build/classes build/dex build/generated
HOSTED_URL="${1:-}"
if [[ -n "$HOSTED_URL" && ! "$HOSTED_URL" =~ ^https://[a-zA-Z0-9.-]+/?$ ]]; then
  echo "Provide a complete HTTPS hostname."
  exit 1
fi
printf 'package com.resilientbite.app; public final class BuildConfig { public static final String SERVER_URL = "%s"; }\n' "$HOSTED_URL" > build/generated/BuildConfig.java
"$BUILD_TOOLS/aapt" package -f -m -M AndroidManifest.xml -S res -J build/generated -I "$SDK/platforms/android-34/android.jar" -F build/unsigned.apk
"$JAVA_HOME/bin/javac" --release 8 -classpath "$SDK/platforms/android-34/android.jar" -d build/classes src/com/resilientbite/app/MainActivity.java build/generated/BuildConfig.java build/generated/com/resilientbite/app/R.java
"$JAVA_HOME/bin/jar" cf build/classes.jar -C build/classes .
"$BUILD_TOOLS/d8" --lib "$SDK/platforms/android-34/android.jar" --output build/dex build/classes.jar
(cd build/dex && zip -q -u ../unsigned.apk classes.dex)
"$BUILD_TOOLS/zipalign" -f 4 build/unsigned.apk build/aligned.apk
if [ ! -f build/demo.keystore ]; then
  "$JAVA_HOME/bin/keytool" -genkeypair -keystore build/demo.keystore -storepass android -keypass android -alias demo -dname "CN=ResilientBite Demo" -keyalg RSA -validity 3650
fi
"$BUILD_TOOLS/apksigner" sign --ks build/demo.keystore --ks-pass pass:android --out ../ResilientBite.apk build/aligned.apk
"$BUILD_TOOLS/apksigner" verify --verbose ../ResilientBite.apk
