export async function loadAudio(
  fileName: string,
  carrierFreq = 2,
  modulationIndex = 0.8,
) {
  const audioCtx = new AudioContext();
  const response = await fetch(fileName);
  const data = await response.arrayBuffer();
  const buffer = await audioCtx.decodeAudioData(data);

  const source = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();
  const carrier = audioCtx.createOscillator();
  const carrierGain = audioCtx.createGain();

  source.buffer = buffer;
  gain.gain.value = 1;
  carrier.frequency.value = carrierFreq;
  carrierGain.gain.value = modulationIndex;

  carrier.connect(carrierGain);
  carrierGain.connect(gain.gain);
  source.connect(gain);
  gain.connect(audioCtx.destination);

  return {
    start() {
      audioCtx.resume();
      carrier.start();
      source.start();
    },
    stop() {
      source.stop();
      carrier.stop();
      audioCtx.close();
    },
  };
}
