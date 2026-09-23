import type { JsPsych } from "jspsych";

export class GeneralInstructionsPlugin {
  static info = {
    name: "general-instructions",
    parameters: {},
  };

  private jsPsych: JsPsych;

  constructor(jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(displayElement: HTMLElement) {
    displayElement.innerHTML = `<div class="general-instructions"><p>We are testing how amplitude modulation (AM) in background music affects brain activity during tasks of sustained attention. Amplitude modulation is defined as a change in sound that can be added to existing music. <br>
    You will perform a visual attention task on the computer while listening to music in the background. <br>
    Before we do that, we want to help you select music that might best help your cognitive functioning.</p><button id="continue" class="primary" type="button">Continue</button></div>`;

    setTimeout(() => {
      const continueButton =
        displayElement.querySelector<HTMLButtonElement>("#continue")!;
      continueButton.addEventListener(
        "click",
        () => {
          this.jsPsych.finishTrial();
        },
        { once: true },
      );
    }, 0);
  }
}
