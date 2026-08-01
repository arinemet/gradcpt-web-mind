import { ParameterType } from "jspsych";
import type { JsPsych } from "jspsych";

const difficulties: [number, number][] = [
  [0, 1],
  [0.1, 0.9],
  [0.2, 0.8],
  [0.3, 0.7],
  [0.4, 0.6],
  [0.5, 0.5],
];

export let sessionCompleted = false;

function runGradCpt(
  jsPsych: JsPsych,
  displayElement: HTMLElement,
  stimulusFiles: string[],
) {
  sessionCompleted = false;
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
      let rt: number | null = null;
      let difficulty = 0;
      let correctStreak = 0;
      let difficultyBefore = difficulty;
      let ended = false;
      let frameId = 0;

      ctx.drawImage(currentImage, 0, 0);

      function incorrect() {
        correctStreak = 0;
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
        setTimeout(() => console.log(jsPsych.data.get().csv()), 0);
      }

      function saveData(now: number) {
        jsPsych.data.write({
          trial_type: "stimulus",
          stimulus: stimulusFiles[stimulusIndex],
          response: clicked ? "space" : null,
          rt,
          correct: clicked === city,
          difficulty_before: difficultyBefore,
          difficulty_after: difficulty,
          duration: now - lastSwitch,
        });
      }

      function onKeyDown(e: KeyboardEvent) {
        if (e.code === "Escape") finish("escape pressed");
        if (e.code === "Space" && !e.repeat && !clicked) {
          rt = performance.now() - lastSwitch;
          if (city) {
            rtimeDiv.textContent = `CORRECT! reaction: ${rt.toFixed(1)} ms Difficulty ${difficulty.toFixed(1)}`;
            correctStreak++;
            correct();
          } else {
            rtimeDiv.textContent = `INCORRECT! reaction: ${rt.toFixed(1)} ms Difficulty ${difficulty.toFixed(1)}`;
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
          saveData(now);
          if (stimulusIndex === stimulusFiles.length - 1) {
            finish(null);
            return;
          }
          previousData = currentData;
          stimulusIndex++;
          currentImage = stimulusImages[stimulusIndex];
          currentData = imageDataFor(currentImage);
          city = stimulusFiles[stimulusIndex].startsWith("city_");
          lastSwitch += 800;
          startTime = lastSwitch;
          crossFade(currentImage, now, difficulty);
          clicked = false;
          rt = null;
          difficultyBefore = difficulty;
        }
        frameId = requestAnimationFrame(frame);
      }

      frameId = requestAnimationFrame(frame);
    },
    { once: true },
  );
}

export class GradCptPlugin {
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
