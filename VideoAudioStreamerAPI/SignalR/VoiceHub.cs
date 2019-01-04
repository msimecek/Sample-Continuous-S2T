using Microsoft.AspNetCore.SignalR;
using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using VideoAudioStreamerAPI.Speech;

namespace VideoAudioStreamerAPI.SignalR
{
    public class VoiceHub : Hub
    {
        private static IConfiguration _config;
        private static IHubContext<VoiceHub> _hubContext;
        private static Dictionary<string, Connection> _connections;

        public VoiceHub(IConfiguration configuration, IHubContext<VoiceHub> ctx)
        {
            if (_config == null)
                _config = configuration;

            if (_connections == null)
                _connections = new Dictionary<string, Connection>();

            if (_hubContext == null)
                _hubContext = ctx;
        }

#region SignalR messages

        public async void AudioStart(byte[] args)
        {
            Debug.WriteLine($"Connection {Context.ConnectionId} starting audio.");

            var str = System.Text.Encoding.ASCII.GetString(args);
            var keys = JObject.Parse(str);

            var audioStream = new VoiceAudioStream();

            var audioFormat = AudioStreamFormat.GetWaveFormatPCM(16000, 16, 1);
            var audioConfig = AudioConfig.FromStreamInput(audioStream, audioFormat);
            var speechConfig = SpeechConfig.FromSubscription(keys["speechKey"].Value<string>(), keys["speechRegion"].Value<string>());
            speechConfig.EndpointId = keys["speechEndpoint"].Value<string>();

            var speechClient = new SpeechRecognizer(speechConfig, audioConfig);

            speechClient.Recognized += _speechClient_Recognized;
            speechClient.Recognizing += _speechClient_Recognizing;
            speechClient.Canceled += _speechClient_Canceled;

            string sessionId = speechClient.Properties.GetProperty(PropertyId.Speech_SessionId);

            var conn = new Connection()
            {
                SessionId = sessionId,
                AudioStream = audioStream,
                SpeechClient = speechClient,
            };

            _connections.Add(Context.ConnectionId, conn);

            await speechClient.StartContinuousRecognitionAsync();

            Debug.WriteLine("Audio start message.");
        }

        public void ReceiveAudio(byte[] audioChunk)
        {
            //Debug.WriteLine("Got chunk: " + audioChunk.Length);

            _connections[Context.ConnectionId].AudioStream.Write(audioChunk, 0, audioChunk.Length);
        }

        public async Task SendTranscript(string text, string sessionId)
        {
            var connection = _connections.Where(c => c.Value.SessionId == sessionId).FirstOrDefault();
            await _hubContext.Clients.Client(connection.Key).SendAsync("IncomingTranscript", text);
        }

#endregion

#region Speech events

        private void _speechClient_Canceled(object sender, SpeechRecognitionCanceledEventArgs e)
        {
            Debug.WriteLine("Recognition was cancelled.");
        }

        private async void _speechClient_Recognizing(object sender, SpeechRecognitionEventArgs e)
        {
            Debug.WriteLine($"{e.SessionId} > Intermediate result: {e.Result.Text}");
            await SendTranscript(e.Result.Text, e.SessionId);
        }

        private async void _speechClient_Recognized(object sender, SpeechRecognitionEventArgs e)
        {
            Debug.WriteLine($"{e.SessionId} > Final result: {e.Result.Text}");
            await SendTranscript(e.Result.Text, e.SessionId);
        }

#endregion


#region SignalR events

        public async override Task OnDisconnectedAsync(Exception exception)
        {
            var connection = _connections[Context.ConnectionId];
            await connection.SpeechClient.StopContinuousRecognitionAsync();
            connection.SpeechClient.Dispose();
            connection.AudioStream.Dispose();
            _connections.Remove(Context.ConnectionId);

            await base.OnDisconnectedAsync(exception);
        }

#endregion
    }

}
