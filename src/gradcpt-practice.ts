import { ParameterType } from "jspsych";
import type { JsPsych } from "jspsych";
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

export let sessionCompletedPractice = false;
export let redo = true;

function runGradCpt(
  jsPsych: JsPsych,
  displayElement: HTMLElement,
  stimulusFiles: string[],
  songIndex: number,
) {
  sessionCompletedPractice = false;
  displayElement.innerHTML = `
    <div id="start-screen">
      <p>This first section is practice for the visual attention task. You will receive feedback after every spacebar press for whether your response was correct or incorrect. Once you achieve 95% accuracy on the practice, you will be able to move forward.</p>
      <p><strong>Remember, the instructions are to press SPACEBAR after you see a city scene and to <em>NOT</em> press SPACEBAR after you see a mountain scene.</strong></p>
      <p>If you are directed back to this screen again, it means that you scored less than a 95%, and you are given more practice time.</p>
      <button id="continue" class="primary" type="button">Continue</button>
    </div>
    <div id="app" style="display:none">
      <canvas width="256" height="256"></canvas>
    </div>
    <div id="rtime"></div>
  `;

  const canvas = displayElement.querySelector<HTMLCanvasElement>("canvas")!;
  const ctx = canvas.getContext("2d")!;
  const rtimeDiv = document.querySelector("#rtime")!;

  function drawDissolve(
    a: HTMLImageElement,
    b: HTMLImageElement,
    m: number,
  ): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.drawImage(a, 0, 0);
    ctx.globalAlpha = m;
    ctx.drawImage(b, 0, 0);
    ctx.globalAlpha = 1;
  }

  const startScreen =
    displayElement.querySelector<HTMLDivElement>("#start-screen")!;
  const appDiv = displayElement.querySelector<HTMLDivElement>("#app")!;
  const continueButton =
    displayElement.querySelector<HTMLButtonElement>("#continue")!;
  continueButton.addEventListener(
    "click",
    async () => {
      const isSafari =
        /^((?!chrome|android).)*safari/i.test(navigator.userAgent) &&
        !("maxTouchPoints" in navigator && navigator.maxTouchPoints > 1);
      if (isSafari) {
        alert("Safari is not supported. Switch to another browser instead.");
        jsPsych.endExperiment();
      } else {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      }
      startScreen.style.display = "none";
      appDiv.style.display = "";
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

      let currentImage = stimulusImages[stimulusIndex];
      let previousImage = currentImage;
      let lastSwitch = performance.now();
      let startTime = 0;
      let city = stimulusFiles[stimulusIndex].startsWith("city_");
      let clicked = false;
      let spacePressCount = 0;
      let rt: number | null = null;
      let difficulty = 0;
      let correctStreak = 0;
      let difficultyBefore = difficulty;
      let ended = false;
      let frameId = 0;
      let crossFadeFrameId = 0;
      let lastTwentyTrials: boolean[] = [];

      ctx.drawImage(currentImage, 0, 0);

      function incorrect() {
        correctStreak = 0;
        rtimeDiv.textContent = `INCORRECT!`;
      }

      function correct() {
        rtimeDiv.textContent = `CORRECT!`;
      }

      function crossFade(currentTime: number, difficultyIndex: number) {
        if (ended) return;

        if (!startTime) startTime = currentTime;

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / 1500, 1);
        const [start, target] = difficulties[difficultyIndex];
        const m = start + (target - start) * progress;

        drawDissolve(previousImage, currentImage, m);

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
        document.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("blur", onBlur);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        document.removeEventListener("fullscreenchange", onFullscreenChange);
        sessionCompletedPractice = reason === null;
        let numCorrect: number = 0;
        for (const e of lastTwentyTrials) {
          if (e) {
            numCorrect++;
          }
        }
        let ratio: number = numCorrect / lastTwentyTrials.length;
        redo = ratio < 0.9;
        if (reason !== null) {
          jsPsych.endExperiment();
        } else {
          jsPsych.finishTrial();
        }
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

        if (now - lastSwitch >= 1500) {
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
          previousImage = currentImage;
          stimulusIndex++;
          currentImage = stimulusImages[stimulusIndex];
          city = stimulusFiles[stimulusIndex].startsWith("city_");
          lastSwitch += 1500;
          startTime = lastSwitch;
          cancelAnimationFrame(crossFadeFrameId);
          crossFade(now, difficulty);
          clicked = false;
          rt = null;
          spacePressCount = 0;
          difficultyBefore = difficulty;
          lastTwentyTrials.push(clicked && city);
          if (lastTwentyTrials.length > 20) {
            // pop first element, oldest element
            lastTwentyTrials.shift();
          }
        }
        frameId = requestAnimationFrame(frame);
      }

      frameId = requestAnimationFrame(frame);
    },
    { once: true },
  );
}

export class GradCptPracticePlugin {
  static info = {
    name: "mod-gradcpt",
    parameters: {
      stimulusFiles: { type: ParameterType.OBJECT, default: undefined },
      songIndex: { type: ParameterType.INT, default: undefined },
    },
  };

  private jsPsych: JsPsych;

  constructor(jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(
    displayElement: HTMLElement,
    trial: { stimulusFiles: string[]; songIndex: number },
  ) {
    runGradCpt(
      this.jsPsych,
      displayElement,
      trial.stimulusFiles,
      trial.songIndex,
    );
  }
}
