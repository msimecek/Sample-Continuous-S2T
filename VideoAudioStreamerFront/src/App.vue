<template>
  <div id="app">
    <h1 class="ms-font-xxl">Video to Text (Prototype)</h1>

    <div class="ms-Grid" dir="ltr">
      <div class="ms-Grid-row">
        <div class="ms-Grid-col ms-sm6">
          <VideoTranscriptor 
              :videoUrl="videoUrl" 
              :speechKey="speechKey" 
              :speechRegion="speechRegion"
              :speechEndpoint="speechEndpoint"
              :voiceHubUrl="voiceHubUrl"
              @transcript-ready="transcriptReady" />

        </div>

        <div class="ms-Grid-col ms-sm6">
          <p>First set the key, region and enpoint of your Speech API service.</p>
          <OuTextField v-model="speechKey" label="Speech API key:" inputType="password"></OuTextField>
          <OuTextField v-model="speechRegion" label="Speech API region:"></OuTextField>
          <OuTextField v-model="speechEndpoint" label="Speech API endpoint:"></OuTextField>
          <p>Then provide URL to the video you want to transcribe.</p>
          <OuTextField v-model="videoUrl" label="Video URL:"></OuTextField>
        </div>
      </div>
    </div>

    <p>{{ transcript }}</p>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import VideoTranscriptor from './components/VideoTranscriptor.vue';
import OuTextField from './components/controls/OuTextField.vue';
import Config from './config';

@Component({
  components: {
    VideoTranscriptor,
    OuTextField
  },
})
export default class App extends Vue {
  videoUrl: string = "";
  speechKey: string = "";
  speechRegion: string = "northeurope";
  speechEndpoint: string = "";
  transcript: string = "";

  get voiceHubUrl(): string {    
    return Config.VOICEHUB_URL;
  }

  mounted() {
    if (localStorage.speechKey)
      this.speechKey = localStorage.speechKey;
    
    if (localStorage.speechRegion)
      this.speechRegion = localStorage.speechRegion;

    if (localStorage.speechEndpoint)
      this.speechEndpoint = localStorage.speechEndpoint;

    if (localStorage.videoUrl)
    this.videoUrl = localStorage.videoUrl;
  }

  transcriptReady(val: string) {
    this.transcript = val;
  }
}
</script>

<style>
#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

</style>
