const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;
const rtimeDiv = document.querySelector("#rtime")!;

function parseStimOrder(text: string) {
  return text
    .trim()
    .split("\n")
    .map((line) => line.split(",")[1].replace(";", "").trim());
}

let currentImage: HTMLImageElement;
let previousData: ImageData;
let currentData: ImageData;
let lastSwitch = performance.now();
let startTime: number;
let city: boolean = true;
let clicked: boolean = false;

const offCanvas = document.createElement("canvas");
let offCtx: CanvasRenderingContext2D;

function imageDataFor(img: HTMLImageElement): ImageData {
  offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height);
  offCtx.drawImage(img, 0, 0);
  return offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
}

function dissolve(a: ImageData, b: ImageData, m: number): ImageData {
  const out = new ImageData(a.width, a.height);
  for (let i = 0; i < out.data.length; i++) {
    out.data[i] = a.data[i] + (b.data[i] - a.data[i]) * m;
  }
  return out;
}

(async () => {
  const startScreen = document.querySelector<HTMLDivElement>("#start-screen")!;
  const appDiv = document.querySelector<HTMLDivElement>("#app")!;
  await new Promise<void>((resolve) => {
    startScreen.addEventListener(
      "click",
      () => {
        document.documentElement.requestFullscreen().then(() => {
          startScreen.style.display = "none";
          appDiv.style.display = "";
          resolve();
        });
      },
      { once: true },
    );
  });
  const BASE = import.meta.env.BASE_URL;
  const songText = await fetch(`${BASE}song1.txt`).then((res) => res.text());
  const stimulusFiles = parseStimOrder(songText);
  const stimulusImages = stimulusFiles.map((fileName) => {
    const img = new Image();
    img.src = `${BASE}${fileName}`;
    return img;
  });
  let stimulusIndex = 0;

  await Promise.all(stimulusImages.map((img) => img.decode()));

  offCanvas.width = canvas.width;
  offCanvas.height = canvas.height;
  offCtx = offCanvas.getContext("2d")!;

  currentImage = stimulusImages[stimulusIndex];
  currentData = imageDataFor(currentImage);
  previousData = currentData;
  city = stimulusFiles[stimulusIndex].startsWith("city_");
  ctx.drawImage(currentImage, 0, 0);

  function crossFade(img: HTMLImageElement, currentTime: number) {
    if (!startTime) startTime = currentTime;

    const elapsed = currentTime - startTime;
    // fade in at 800 ms speed
    const progress = Math.min(elapsed / 800, 1);

    ctx.putImageData(dissolve(previousData, currentData, progress), 0, 0);

    if (progress < 1) {
      requestAnimationFrame((time) => crossFade(img, time));
    }
  }

  function exit() {
    document.querySelector("#app")!.innerHTML = `
        <h1>Session incomplete, exited.</h1>
        <p>You exited from fullscreen. Thank you for participating.</p>
      `;
  }

  function checkForFocusLossOrFullscreenLoss() {
    if (!document.fullscreenElement) {
      exit();
    }
    window.addEventListener("blur", () => {
      exit();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        exit();
      }
    });
  }

  function frame() {
    const now = performance.now();

    checkForFocusLossOrFullscreenLoss();

    if (now - lastSwitch >= 800) {
      previousData = currentData;
      if (!clicked && city) {
        rtimeDiv.textContent = `INCORRECT! Did not click.`;
      } else if (!clicked && !city) {
        rtimeDiv.textContent = `CORRECT! Did not click.`;
      }
      stimulusIndex = (stimulusIndex + 1) % stimulusImages.length;
      currentImage = stimulusImages[stimulusIndex];
      currentData = imageDataFor(currentImage);
      city = stimulusFiles[stimulusIndex].startsWith("city_");
      startTime = 0;
      crossFade(currentImage, now);
      console.log("interval:", (now - lastSwitch).toFixed(1));
      lastSwitch = now;
      clicked = false;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !e.repeat && !clicked) {
      const rt = performance.now() - lastSwitch;
      if (city) {
        rtimeDiv.textContent = `CORRECT! reaction: ${rt.toFixed(1)} ms`;
      } else {
        rtimeDiv.textContent = `INCORRECT! reaction: ${rt.toFixed(1)} ms`;
      }
      clicked = true;
    }
  });
})();
