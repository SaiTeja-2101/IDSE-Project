# ResilientBite for Android

Install the signed ResilientBite.apk on Android 8 or later. The hosted build opens the meal planner at https://res-b7z8.onrender.com and uses the Android file picker for CSV and Excel uploads. It needs internet access.

To rebuild the hosted APK on this Mac:

    bash forecast_app/android/build.sh https://res-b7z8.onrender.com

## Local backend

Build with no URL argument to use a configurable server address.

Start the backend from the project folder:

    python -m streamlit run forecast_app/app.py --server.address 0.0.0.0 --server.port 8502

Keep the computer and phone on the same Wi-Fi. In the APK, enter the computer's Wi-Fi address with port 8502, such as http://192.168.1.10:8502. You can find that address in the computer's Wi-Fi settings. The computer must remain running for forecasts to work. The backend uses the computer's date.

The APK was compiled and its signature verified. Physical-device testing is still pending. It uses a demonstration signing key.

To rebuild on this Mac:

    bash forecast_app/android/build.sh
