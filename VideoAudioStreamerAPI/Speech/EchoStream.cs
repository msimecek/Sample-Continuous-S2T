using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Collections.Concurrent;

namespace VideoAudioStreamerAPI.Speech
{
    // solution from here: https://stackoverflow.com/a/19137392
    public class EchoStream : MemoryStream
    {
        private readonly ManualResetEvent _DataReady = new ManualResetEvent(false);
        private readonly ConcurrentQueue<byte[]> _Buffers = new ConcurrentQueue<byte[]>();

        public bool DataAvailable { get { return !_Buffers.IsEmpty; } }

        public override void Write(byte[] buffer, int offset, int count)
        {
            _Buffers.Enqueue(buffer.Take(count).ToArray());
            _DataReady.Set();
        }

        public override int Read(byte[] buffer, int offset, int count)
        {
            //Debug.WriteLine("Data available: " + DataAvailable);

            _DataReady.WaitOne();

            byte[] lBuffer;

            if (!_Buffers.TryDequeue(out lBuffer))
            {
                _DataReady.Reset();
                return -1;
            }

            if (!DataAvailable)
                _DataReady.Reset();

            Array.Copy(lBuffer, buffer, lBuffer.Length);
            return lBuffer.Length;
        }
    }
}
