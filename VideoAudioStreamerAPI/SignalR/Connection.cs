using Microsoft.CognitiveServices.Speech;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VideoAudioStreamerAPI.Speech;

namespace VideoAudioStreamerAPI.SignalR
{
    public class Connection
    {
        public string SessionId;
        public SpeechRecognizer SpeechClient;
        public VoiceAudioStream AudioStream;
    }
}
