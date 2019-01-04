# Sample Continuous S2T
How to continuously stream audio content a receive live S2T transcripts from the [Azure Speech Service](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/overview).

## Contents

There are two projects in this repo:

* **VideoAudioStreamerAPI** - The API which streams audio to the Speech Service, receives transcripts and sends them back to clients.
* **VideoAudioStreamerFront** - Client web application. Requires the API to run.

## Usage

Open solution in Visual Studio and run. The API will be started.

Go to VideoAudioStreamerFront, install packages and run:

```
npm install
npm run serve
```

Enter your Speech subscription key, region and endpoint ID.

Enter a video file URL.

Play the video.

> **Hint**: I use [http-server](https://www.npmjs.com/package/http-server) to pretend that my local files are on a web server ;)

## More

Full description on my blog: https://codez.deedx.cz/posts/continuous-speech-to-text/