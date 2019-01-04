import * as signalR from '@aspnet/signalr'
import * as signalRmsgpack from '@aspnet/signalr-protocol-msgpack'

export default class Transcriptor {
    private _voiceHub: signalR.HubConnection;
    private _videoElement: HTMLVideoElement;

    private context!: AudioContext;
    private mediaSource: any;
    private jsScriptNode: any;
    private filter: any;
    
    transcriptReadyHandler!: (transcript: string) => void;

    constructor(voiceHubUrl: string, videoElement: HTMLVideoElement) {
        this._voiceHub = new signalR.HubConnectionBuilder()
            .withUrl(voiceHubUrl)
            .withHubProtocol(new signalRmsgpack.MessagePackHubProtocol())
            .configureLogging(signalR.LogLevel.Information)
            .build();

        this._voiceHub.on("IncomingTranscript", (message) => {
            console.log("Got message: " + message);
            this.transcriptReadyHandler(message);
        });
        
        this._videoElement = videoElement;
    }

    async startTranscript(speechKey: string, speechRegion: string, speechEndpoint: string) {
        if (this._voiceHub.state != signalR.HubConnectionState.Connected)
            await this._voiceHub.start();
        
        var startMessage = JSON.stringify({speechKey: speechKey, speechRegion: speechRegion, speechEndpoint: speechEndpoint});

        let buf: ArrayBuffer = new ArrayBuffer(startMessage.length);
        let bufView: Uint8Array = new Uint8Array(buf);

        for (var i = 0; i < startMessage.length; ++i) {
            var code = startMessage.charCodeAt(i);
            bufView[i] = code;
        }
        
        this._voiceHub.send("AudioStart", bufView);
        this._voiceHub.send("ReceiveAudio", new Uint8Array(this.createStreamRiffHeader()));
        this.startStreaming();
    }

    private createStreamRiffHeader() {
        //create data buffer
        const buffer = new ArrayBuffer(44);
        const view = new DataView(buffer);

        /* RIFF identifier */
        view.setUint8(0, 'R'.charCodeAt(0));
        view.setUint8(1, 'I'.charCodeAt(0));
        view.setUint8(2, 'F'.charCodeAt(0));
        view.setUint8(3, 'F'.charCodeAt(0));

        /* file length */
        view.setUint32(4, 2 ^ 31, true);
        /* RIFF type & Format */
        view.setUint8(8, 'W'.charCodeAt(0));
        view.setUint8(9, 'A'.charCodeAt(0));
        view.setUint8(10, 'V'.charCodeAt(0));
        view.setUint8(11, 'E'.charCodeAt(0));
        view.setUint8(12, 'f'.charCodeAt(0));
        view.setUint8(13, 'm'.charCodeAt(0));
        view.setUint8(14, 't'.charCodeAt(0));
        view.setUint8(15, ' '.charCodeAt(0));

        /* format chunk length */
        view.setUint32(16, 16, true);
        /* sample format (raw) */
        view.setUint16(20, 1, true);
        /* channel count */
        view.setUint16(22, 1, true);
        /* sample rate */
        view.setUint32(24, 16000, true);
        /* byte rate (sample rate * block align) */
        view.setUint32(28, 32000, true);
        /* block align (channel count * bytes per sample) */
        view.setUint16(32, 2, true);
        /* bits per sample */
        view.setUint16(34, 16, true);
        /* data chunk identifier */
        view.setUint8(36, 'd'.charCodeAt(0));
        view.setUint8(37, 'a'.charCodeAt(0));
        view.setUint8(38, 't'.charCodeAt(0));
        view.setUint8(39, 'a'.charCodeAt(0));

        /* data chunk length */
        view.setUint32(40, 2^31, true);

        return buffer;
    }

    private startStreaming() {
        if (this.context == null)            
            this.context = new AudioContext();
        else
            this.context.resume();
        
        if (this.mediaSource == null)
            this.mediaSource = this.context.createMediaElementSource(this._videoElement);
        
        this.filter = this.context.createBiquadFilter();
        this.filter.type = "lowpass";
        this.filter.frequency.setValueAtTime(8000, this.context.currentTime);

        this.jsScriptNode = this.context.createScriptProcessor(4096, 1, 1);
        this.jsScriptNode.onaudioprocess = 
                    (processingEvent: any) => 
                        this.processAudio(processingEvent); // passing as arrow to preserve context of 'this'

        if (this.mediaSource.mediaSource == null)
            this.mediaSource.connect(this.filter);
        //filter.connect(context.destination); // rovnou do výstupu
        this.filter.connect(this.jsScriptNode);
        this.jsScriptNode.connect(this.context.destination);        
    }

    private processAudio(audioProcessingEvent: any) {
        var inputBuffer = audioProcessingEvent.inputBuffer;
        // The output buffer contains the samples that will be modified and played
        var outputBuffer = audioProcessingEvent.outputBuffer;

        var isampleRate = inputBuffer.sampleRate;
        var osampleRate = 16000;
        var inputData = inputBuffer.getChannelData(0);
        var outputData = outputBuffer.getChannelData(0);
        var output = this.downsampleArray(isampleRate, osampleRate, inputData);

        for (var i = 0; i < outputBuffer.length; i++) {
            outputData[i] = inputData[i];
        }

        this._voiceHub.send("ReceiveAudio", new Uint8Array(output.buffer)).catch(this.handleError);
    }

    private handleError(err: any) {
        console.error(err);
    }

    private downsampleArray(irate: any, orate: any, input: any): Int16Array {
        const ratio = irate / orate;
        const olength = Math.round(input.length / ratio);
        const output = new Int16Array(olength);

        var iidx = 0;
        var oidx = 0;

        for (var oidx = 0; oidx < output.length; oidx++) {
            const nextiidx = Math.round((oidx + 1) * ratio);

            var sum = 0;
            var cnt = 0;

            for (; iidx < nextiidx && iidx < input.length; iidx++) {
                sum += input[iidx];
                cnt++;
            }

            //saturate output between -1 and 1
            var newfval = Math.max(-1, Math.min(sum / cnt, 1));

            //multiply negative values by 2^15 and positive by 2^15 -1 (range of short)
            var newsval = newfval < 0 ? newfval * 0x8000 : newfval * 0x7FFF;

            output[oidx] = Math.round(newsval);
        }

        return output;
    }

    pauseTranscript() {
        if (this.context)
            this.context.suspend();
    }

    stopTranscript() {
        this._voiceHub.stop();
        this.transcriptReadyHandler(''); // reset transcript
    }
}