import { initJsPsych, ParameterType, type JsPsych } from "jspsych";
import "jspsych/css/jspsych.css";

declare global {
  interface Window {
    jsPsychPavlovia?: unknown;
  }
}

let sessionCompleted = false;

const blockMobileUsers = (): void => {
  const userAgent: string = navigator.userAgent;
  const isMobile: boolean = /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);

  if (isMobile) {
    const warningMessage: string = `
      <div style="text-align:center; padding:50px; font-family:sans-serif;">
        <h1>Desktop Only</h1>
        <p>This study cannot be completed from a mobile device.</p>
      </div>
    `;

    throw new Error("Device needs to be desktop");

    if (document.documentElement) {
      document.documentElement.innerHTML = warningMessage;
    }
  }
};

blockMobileUsers();

function parseStimOrder(text: string) {
  return text
    .trim()
    .split("\n")
    .map((line) => line.split(",")[1].replace(";", "").trim());
}

const difficulties: [number, number][] = [
  [0, 1],
  [0.1, 0.9],
  [0.2, 0.8],
  [0.3, 0.7],
  [0.4, 0.6],
  [0.5, 0.5],
];

function runGradCpt(
  jsPsych: JsPsych,
  displayElement: HTMLElement,
  stimulusFiles: string[],
) {
  displayElement.innerHTML = `
    <div id="start-screen">
      <h1>This study requires fullscreen.</h1>
      <p>Click to enter fullscreen and start.</p>
    </div>
    <div id="app" style="display:none">
      <canvas width="256" height="256"></canvas>
      <div id="rtime"></div>
    </div>
  `;

  const canvas = displayElement.querySelector<HTMLCanvasElement>("canvas")!;
  const ctx = canvas.getContext("2d")!;
  const rtimeDiv = displayElement.querySelector<HTMLDivElement>("#rtime")!;
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

  const startScreen =
    displayElement.querySelector<HTMLDivElement>("#start-screen")!;
  const appDiv = displayElement.querySelector<HTMLDivElement>("#app")!;
  startScreen.addEventListener(
    "click",
    async () => {
      await document.documentElement.requestFullscreen();
      startScreen.style.display = "none";
      appDiv.style.display = "";

      const BASE = import.meta.env.BASE_URL;
      const stimulusImages = stimulusFiles.map((fileName) => {
        const img = new Image();
        img.src = `${BASE}${fileName}`;
        return img;
      });
      let stimulusIndex = 0;

      await Promise.all(stimulusImages.map((img) => img.decode()));

      offCanvas.width = canvas.width;
      offCanvas.height = canvas.height;
      offCtx = offCanvas.getContext("2d", { willReadFrequently: true })!;

      let currentImage = stimulusImages[stimulusIndex];
      let currentData = imageDataFor(currentImage);
      let previousData = currentData;
      let lastSwitch = performance.now();
      let startTime = 0;
      let city = stimulusFiles[stimulusIndex].startsWith("city_");
      let clicked = false;
      let difficulty = 0;
      let correctStreak = 0;
      let ended = false;
      let frameId = 0;

      ctx.drawImage(currentImage, 0, 0);

      function incorrect() {
        if (difficulty > 0) {
          difficulty--;
        }
      }

      function correct() {
        if (correctStreak >= 3 && difficulty < difficulties.length - 1) {
          difficulty++;
          correctStreak = 0;
        }
      }

      function crossFade(
        img: HTMLImageElement,
        currentTime: number,
        difficultyIndex: number,
      ) {
        if (!startTime) startTime = currentTime;

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / 800, 1);
        const [start, target] = difficulties[difficultyIndex];
        const m = start + (target - start) * progress;

        ctx.putImageData(dissolve(previousData, currentData, m), 0, 0);

        if (progress < 1) {
          requestAnimationFrame((time) =>
            crossFade(img, time, difficultyIndex),
          );
        }
      }

      function finish(reason: string | null) {
        if (ended) return;
        ended = true;
        cancelAnimationFrame(frameId);
        document.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("blur", onBlur);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        document.removeEventListener("fullscreenchange", onFullscreenChange);
        sessionCompleted = reason === null;
        jsPsych.finishTrial();
      }

      function onKeyDown(e: KeyboardEvent) {
        if (e.code === "Escape") finish("escape pressed");
        if (e.code === "Space" && !e.repeat && !clicked) {
          const rt = performance.now() - lastSwitch;
          if (city) {
            rtimeDiv.textContent = `CORRECT! reaction: ${rt.toFixed(1)} ms`;
            correctStreak++;
            correct();
          } else {
            rtimeDiv.textContent = `INCORRECT! reaction: ${rt.toFixed(1)} ms`;
            incorrect();
          }
          clicked = true;
        }
      }

      function onBlur() {
        finish("focus lost");
      }

      function onVisibilityChange() {
        if (document.hidden) finish("page hidden");
      }

      function onFullscreenChange() {
        if (!document.fullscreenElement) finish("fullscreen exited");
      }

      document.addEventListener("keydown", onKeyDown);
      window.addEventListener("blur", onBlur);
      document.addEventListener("visibilitychange", onVisibilityChange);
      document.addEventListener("fullscreenchange", onFullscreenChange);

      function frame() {
        if (ended) return;
        const now = performance.now();

        if (now - lastSwitch >= 800) {
          if (!clicked && city) {
            rtimeDiv.textContent = `INCORRECT! Did not click.`;
            incorrect();
          } else if (!clicked && !city) {
            rtimeDiv.textContent = `CORRECT! Did not click.`;
            correct();
          }
          if (stimulusIndex === stimulusFiles.length - 1) {
            finish(null);
            return;
          }
          previousData = currentData;
          stimulusIndex++;
          currentImage = stimulusImages[stimulusIndex];
          currentData = imageDataFor(currentImage);
          city = stimulusFiles[stimulusIndex].startsWith("city_");
          startTime = 0;
          crossFade(currentImage, now, difficulty);
          lastSwitch = now;
          clicked = false;
        }
        frameId = requestAnimationFrame(frame);
      }

      frameId = requestAnimationFrame(frame);
    },
    { once: true },
  );
}

class GradCptPlugin {
  static info = {
    name: "gradcpt",
    parameters: {
      stimulusFiles: { type: ParameterType.OBJECT, default: undefined },
    },
  };
  private jsPsych: JsPsych;

  constructor(jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(displayElement: HTMLElement, trial: { stimulusFiles: string[] }) {
    runGradCpt(this.jsPsych, displayElement, trial.stimulusFiles);
  }
}

function loadScript(source: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = source;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`could not load ${source}`));
    document.head.append(script);
  });
}

async function main() {
  document.querySelector("#loading-message")?.remove();

  const mobile =
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

  if (mobile) {
    document.body.innerHTML = `
      <main class="message">
        <h1>Desktop device required.</h1>
        <p>Please open this study on a desktop or laptop computer.</p>
      </main>
    `;
    return;
  }

  const BASE = import.meta.env.BASE_URL;
  const songText = await fetch(`${BASE}song1.txt`).then((res) => res.text());
  const stimulusFiles = parseStimOrder(songText);
  const onPavlovia = location.hostname === "run.pavlovia.org";
  const jsPsych = initJsPsych({
    on_finish: () => {
      if (onPavlovia) return;
      jsPsych.getDisplayElement().innerHTML = sessionCompleted
        ? `<h1>Session complete.</h1><p>Thank you for participating.</p>`
        : `<h1>Session incomplete, exited.</h1><p>You exited from fullscreen. Thank you for participating.</p>`;
    },
  });

  const timeline: object[] = [];

  if (onPavlovia) {
    await loadScript("https://pavlovia.org/lib/jspsych-7-pavlovia-2022.1.1.js");
    timeline.push({ type: window.jsPsychPavlovia, command: "init" });
  }

  timeline.push({ type: GradCptPlugin, stimulusFiles });

  if (onPavlovia) {
    timeline.push({ type: window.jsPsychPavlovia, command: "finish" });
  }

  await jsPsych.run(timeline);
}

main().catch((error: unknown) => {
  document.body.textContent =
    error instanceof Error ? error.message : String(error);
});
