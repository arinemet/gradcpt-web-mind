const audioFiles = new Map<string, Promise<ArrayBuffer>>();
const images = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(path: string): Promise<HTMLImageElement> {
  if (!images.has(path)) {
    const loadingImage = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`could not load ${path}`));

      image.src = path;
    });
    images.set(path, loadingImage);
  }
  return images.get(path)!;
}

export function loadAudio(path: string): Promise<ArrayBuffer> {
  if (!audioFiles.has(path)) {
    const loadingAudio = fetch(path).then((response) => {
      if (!response.ok) {
        throw new Error(`could not load ${path}: ${response.status}`);
      }

      return response.arrayBuffer();
    });
    audioFiles.set(path, loadingAudio);
  }
  return audioFiles.get(path)!;
}

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
