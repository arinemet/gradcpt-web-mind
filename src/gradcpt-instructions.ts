import type { JsPsych } from "jspsych";

export class GradCptInstructionsPlugin {
  static info = {
    name: "gradcpt-instructions",
    parameters: {},
  };

  private jsPsych: JsPsych;

  constructor(jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(displayElement: HTMLElement) {
    displayElement.innerHTML = `<div class="gradcpt-instructions"><p>Now you will perform the attention task. A series of 10 pictures will gradually be presented on the screen one after another. <em>In this phase of the experiment, you will press SPACEBAR when you see a picture of a city scene, and you will NOT press SPACEBAR when you see a picture of a mountain scene.</em> <b>Click on the text to continue.</b></p></div>`;

    setTimeout(() => {
      displayElement.addEventListener(
        "click",
        () => {
          this.jsPsych.finishTrial();
        },
        { once: true },
      );
    }, 0);
  }
}
