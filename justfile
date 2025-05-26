build-android:
	rm -rf *.apk
	eas build -p android --profile production --local	
	rm -rf ~/Builds/*.apk
	mv *.apk ~/Builds/

release-android: build-android
	/Users/pablofernandez/zapstore-cli/zapstore publish olas -v `jq .expo.version app.json` --overwrite-release -a *.apk
