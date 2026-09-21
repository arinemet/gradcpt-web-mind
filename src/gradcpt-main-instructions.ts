import type { JsPsych } from "jspsych";

export class GradCptMainInstructionsPlugin {
  static info = {
    name: "gradcpt-main-instructions",
    parameters: {},
  };

  private jsPsych: JsPsych;

  constructor(jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(displayElement: HTMLElement) {
    displayElement.innerHTML = `<div class="gradcpt-main-instructions"><p>Now, we will begin the main experiment. There will be a total of 8 blocks, each lasting 3 minutes, so this portion of the experiment will take around 25 minutes. You will perform the visual attention task while listening to the music you selected. The instructions are the same: press SPACEBAR after you see a city scene and do <em>NOT</em> press SPACEBAR after you see a mountain scene.</p><p>This study requires fullscreen. Click to enter fullscreen and continue.</p></div>`;

    displayElement.addEventListener(
      "click",
      async () => {
        const isSafari =
          /^((?!chrome|android).)*safari/i.test(navigator.userAgent) &&
          !("maxTouchPoints" in navigator && navigator.maxTouchPoints > 1);
        if (!isSafari) {
          if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
          }
        } else {
          alert(
            "Fullscreen is not yet supported on Safari as sound playback doesn't work",
          );
        }
        this.jsPsych.finishTrial();
      },
      { once: true },
    );
  }
}
