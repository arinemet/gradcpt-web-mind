const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;
const rtimeDiv = document.querySelector("#rtime")!;

// for qualtrics testing
const params = new URLSearchParams(window.location.search);
const returnUrl = params.get("return");

setTimeout(() => {
  window.location.href =
    returnUrl ?? "https://arinemet.github.io/gradcpt-web-mind/";
}, 1000);

function parseStimOrder(text: string) {
  return text
    .trim()
    .split("\n")
    .map((line) => line.split(",")[1].replace(";", "").trim());
}

let previousImage: HTMLImageElement;
let currentImage: HTMLImageElement;
let lastSwitch = performance.now();
let startTime: number;
let city: boolean = true;
let clicked: boolean = false;

(async () => {
  const startScreen = document.querySelector<HTMLDivElement>("#start-screen")!;
  const appDiv = document.querySelector<HTMLDivElement>("#app")!;
  await new Promise<void>((resolve) => {
    startScreen.addEventListener(
      "click",
      () => {
        startScreen.style.display = "none";
        appDiv.style.display = "";
        resolve();
      },
      { once: true },
    );
  });
  const BASE = "https://arinemet.github.io/gradcpt-web-mind/";
  const songText = await fetch(`${BASE}song1.txt`).then((res) => res.text());
  const stimulusFiles = parseStimOrder(songText);
  const stimulusImages = stimulusFiles.map((fileName) => {
    const img = new Image();
    img.src = `${BASE}${fileName}`;
    return img;
  });
  let stimulusIndex = 0;

  await Promise.all(stimulusImages.map((img) => img.decode()));

  currentImage = stimulusImages[stimulusIndex];
  previousImage = currentImage;
  city = stimulusFiles[stimulusIndex].startsWith("city_");
  ctx.drawImage(currentImage, 0, 0);

  function crossFade(img: HTMLImageElement, currentTime: number) {
    if (!startTime) startTime = currentTime;

    const elapsed = currentTime - startTime;
    // fade in at 800 ms speed
    const progress = Math.min(elapsed / 800, 1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // in
    ctx.globalAlpha = 1 - progress;
    ctx.drawImage(previousImage, 0, 0);

    // out
    ctx.globalAlpha = progress;
    ctx.drawImage(currentImage, 0, 0);

    if (progress < 1) {
      requestAnimationFrame((time) => crossFade(img, time));
    }
  }

  function frame() {
    const now = performance.now();

    if (now - lastSwitch >= 800) {
      previousImage = currentImage;
      if (!clicked && city) {
        rtimeDiv.textContent = `INCORRECT! Did not click.`;
      } else if (!clicked && !city) {
        rtimeDiv.textContent = `CORRECT! Did not click.`;
      }
      stimulusIndex = (stimulusIndex + 1) % stimulusImages.length;
      currentImage = stimulusImages[stimulusIndex];
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
