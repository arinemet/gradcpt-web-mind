export async function amplitudeModulation(
  fileName: string,
  carrierFreq: number,
  depth: number,
) {
  const audioCtx = new AudioContext();
  const response = await fetch(fileName);
  const data = await response.arrayBuffer();
  const buffer = await audioCtx.decodeAudioData(data);

  const numSamples = buffer.length;
  // sample rate of the audio
  const sr = buffer.sampleRate;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sr;
    const carrier = 0.5 + depth * Math.cos(2 * Math.PI * carrierFreq * t);

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const samples = buffer.getChannelData(channel);
      samples[i] *= carrier;
    }
  }

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);

  return {
    start() {
      audioCtx.resume();
      source.start();
    },
    stop() {
      source.stop();
      audioCtx.close();
    },
  };
}
