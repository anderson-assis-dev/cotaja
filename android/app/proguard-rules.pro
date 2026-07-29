# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-dontwarn com.facebook.**

# Firebase
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Stripe
-keep class com.stripe.** { *; }
-dontwarn com.stripe.**

# React Native Push Notifications
-keep class com.dieam.reactnativepushnotification.** { *; }

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }

# Reanimated
-keep class com.swmansion.reanimated.** { *; }

# React Native Config
-keep class com.cotaja_rn.BuildConfig { *; }

# ONNX Runtime (liveness) — classes acessadas via JNI, não podem ser removidas.
-keep class ai.onnxruntime.** { *; }
-keep class com.microsoft.onnxruntime.** { *; }
-dontwarn ai.onnxruntime.**

# React Native VisionCamera (câmera do liveness)
-keep class com.mrousavy.camera.** { *; }
-dontwarn com.mrousavy.camera.**
