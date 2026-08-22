const BASE = import.meta.env.BASE_URL;
export function parseStimOrder(text: string) {
  return text
    .trim()
    .split("\n")
    .map((line) => line.split(",")[1].replace(";", "").trim());
}

export function loadScript(source: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = source;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`could not load ${source}`));
    document.head.append(script);
  });
}

export function loadStimuli(stimulusFiles: String[]) {
  return stimulusFiles.map((fileName) => {
    const img = new Image();
    img.src = `${BASE}${fileName}`;
    return img;
  });
}

export function loadSongs(songFiles: String[]) {
  return songFiles.map((fileName) => {
    const img = new Image();
    img.src = `${BASE}${fileName}`;
    return img;
  });
}
