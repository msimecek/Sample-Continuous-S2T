<template>
<div>
    <video id="video" v-bind:src="videoUrl" crossorigin="anonymous" 
        @play="play" 
        @pause="pause" 
        @ended="ended"
        controls></video>

    <div style="width:100%; text-align: center">
        <OuButton type="hero" icon="Checkbox" @click="stop" :disabled="!isPlaying">Stop</OuButton>        
    </div>

</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import * as signalR from "@aspnet/signalr";
import * as signalRmsgpack from "@aspnet/signalr-protocol-msgpack";

import Transcriptor from '../utils/Transcriptor'
import OuButton  from './controls/OuButton.vue'

@Component({
  components: {
      OuButton
  }  
})
export default class VideoTranscriptor extends Vue 
{
    @Prop({default: ""}) videoUrl!: string;
    @Prop() speechKey!: string;
    @Prop({ default: "northeurope" }) speechRegion!: string;
    @Prop() speechEndpoint!: string;
    @Prop() voiceHubUrl!: string;

    private video!: HTMLVideoElement;
    private _transcriptor!: Transcriptor;

    isPlaying: boolean = false;
    isPaused: boolean = false;
    transcript: string = "";

    mounted() {
        console.log("setting video");
        this.video = document.getElementById("video") as HTMLVideoElement;
    }

    play(): void {
        this.video.play();
        this.isPlaying = true;
        this.isPaused = false;

        // persist speech settings to storage
        localStorage.speechKey = this.speechKey;
        localStorage.speechRegion = this.speechRegion;
        localStorage.speechEndpoint = this.speechEndpoint;
        localStorage.videoUrl = this.videoUrl;

        // start transcribing
        if (this._transcriptor === null || this._transcriptor === undefined) {
            this._transcriptor = new Transcriptor(this.voiceHubUrl, this.video);
            this._transcriptor.transcriptReadyHandler = (transcript: string) => {
                this.$emit('transcript-ready', transcript);
            };
        }
        this._transcriptor.startTranscript(this.speechKey, this.speechRegion, this.speechEndpoint);
    }

    pause() {
        this._transcriptor.pauseTranscript();

        this.video.pause();
        this.isPaused = true;
    }

    stop() {
        this._transcriptor.stopTranscript();

        this.video.pause();
        this.video.currentTime = 0;

        this.isPlaying = false;
        this.isPaused = false;
    }

    ended() {
        this._transcriptor.stopTranscript();
        this.isPlaying = false;
        this.isPaused = false;
    }
}
</script>

<style scoped>
video {
    width: 100%;
}
</style>
