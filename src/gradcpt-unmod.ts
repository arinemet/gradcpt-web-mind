import { ParameterType } from "jspsych";
import type { JsPsych } from "jspsych";
import { amplitudeModulation } from "./audio.ts";
import { modulationSettings } from "./modulation-controller.ts";
import { loadImage } from "./loader.ts";

const difficulties: [number, number][] = [
  [0, 1],
  [0.1, 0.9],
  [0.2, 0.8],
  [0.3, 0.7],
  [0.4, 0.6],
  [0.5, 0.5],
];

export let sessionCompletedUnmod = false;

function runGradCpt(
  jsPsych: JsPsych,
  displayElement: HTMLElement,
  stimulusFiles: string[],
  songIndex: number,
  fixedDifficulty: number,
) {
  sessionCompletedUnmod = false;
  displayElement.innerHTML = `
    <div id="app">
      <canvas width="256" height="256"></canvas>
    </div>
  `;

  const canvas = displayElement.querySelector<HTMLCanvasElement>("canvas")!;
  const ctx = canvas.getContext("2d")!;
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
      const song = modulationSettings[songIndex];
      if (!song) {
        throw new Error(
          `Missing modulation settings for song ${songIndex + 1}`,
        );
      }
      const BASE = import.meta.env.BASE_URL;
      const stimulusImages = await Promise.all(
        stimulusFiles.map((fileName) => loadImage(`${BASE}${fileName}`)),
      );
      let stimulusIndex = 0;
      const songPlayer = await amplitudeModulation(
        song.file,
        song.frequency,
        0,
      );

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
      let spacePressCount = 0;
      let rt: number | null = null;
      const difficulty = fixedDifficulty;
      let correctStreak = 0;
      const difficultyBefore = difficulty;
      let ended = false;
      let frameId = 0;
      let crossFadeFrameId = 0;

      ctx.drawImage(currentImage, 0, 0);
      songPlayer.start();

      function incorrect() {
        correctStreak = 0;
      }

      function correct() {
        if (correctStreak >= 3) {
          correctStreak = 0;
        }
      }

      function crossFade(currentTime: number, difficultyIndex: number) {
        if (ended) return;

        if (!startTime) startTime = currentTime;

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / 800, 1);
        const [start, target] = difficulties[difficultyIndex];
        const m = start + (target - start) * progress;

        ctx.putImageData(dissolve(previousData, currentData, m), 0, 0);

        if (progress < 1) {
          crossFadeFrameId = requestAnimationFrame((time) =>
            crossFade(time, difficultyIndex),
          );
        }
      }

      function finish(reason: string | null) {
        if (ended) return;
        ended = true;
        cancelAnimationFrame(frameId);
        cancelAnimationFrame(crossFadeFrameId);
        songPlayer.stop();
        document.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("blur", onBlur);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        document.removeEventListener("fullscreenchange", onFullscreenChange);
        sessionCompletedUnmod = reason === null;
        jsPsych.finishTrial();
        setTimeout(() => console.log(jsPsych.data.get().csv()), 0);
      }

      function saveData(now: number) {
        jsPsych.data.write({
          trial_type: "stimulus",
          is_city: city,
          stimulus: stimulusFiles[stimulusIndex],
          response: clicked ? "space" : null,
          rt,
          correct: clicked === city,
          difficulty_before: difficultyBefore,
          difficulty_after: difficulty,
          duration: now - lastSwitch,
          gradcpt_run: songIndex + 1,
          song_name: song.name,
          modulation_depth: song.depth,
          modulation_frequency: song.frequency,
          flag_spamming: spacePressCount > 3,
        });
      }

      function onKeyDown(e: KeyboardEvent) {
        if (e.code === "Escape") finish("escape pressed");
        if (e.code === "Space" && !e.repeat) {
          spacePressCount++;
          if (!clicked) {
            rt = performance.now() - lastSwitch;
            if (city) {
              correctStreak++;
              correct();
            } else {
              incorrect();
            }
            clicked = true;
          }
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
            incorrect();
          } else if (!clicked && !city) {
            correctStreak++;
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
          cancelAnimationFrame(crossFadeFrameId);
          crossFade(now, difficulty);
          clicked = false;
          rt = null;
          spacePressCount = 0;
        }
        frameId = requestAnimationFrame(frame);
      }

      frameId = requestAnimationFrame(frame);
  })();
}

export class GradCptUnmodPlugin {
  static info = {
    name: "mod-gradcpt",
    parameters: {
      stimulusFiles: { type: ParameterType.OBJECT, default: undefined },
      songIndex: { type: ParameterType.INT, default: undefined },
      difficulty: { type: ParameterType.INT, default: undefined },
    },
  };

  private jsPsych: JsPsych;

  constructor(jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(
    displayElement: HTMLElement,
    trial: { stimulusFiles: string[]; songIndex: number; difficulty: number },
  ) {
    runGradCpt(
      this.jsPsych,
      displayElement,
      trial.stimulusFiles,
      trial.songIndex,
      trial.difficulty,
    );
  }
}
