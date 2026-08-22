import { readdir, readFile } from "node:fs/promises";

const files = (await readdir("public")).filter((file) => file.endsWith(".wav"));

for (const file of files) {
  const wav = await readFile(`public/${file}`);
  const dataChunk = wav.indexOf("data");

  if (dataChunk === -1) {
    console.log(`${file}: couldn't find audio data`);
    continue;
  }

  let min = 1;
  let max = -1;

  for (let i = dataChunk + 8; i + 1 < wav.length; i += 2) {
    const sample = wav.readInt16LE(i) / 32768;
    min = Math.min(min, sample);
    max = Math.max(max, sample);
  }

  console.log(`${file}: min=${min.toFixed(3)}, max=${max.toFixed(3)}`);
}
