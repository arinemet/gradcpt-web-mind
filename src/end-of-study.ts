import { ParameterType } from "jspsych";
import type { JsPsych } from "jspsych";

export const sessionCompleteHtml = `<h1>Session complete.</h1><p>Thank you for participating.</p>`;
export const studyFailedHtml = `<h1>Study failed.</h1><p>You lost focus, exited fullscreen, or otherwise interrupted the task. Thank you for participating.</p>`;

export class EndOfStudyPreviewPlugin {
  static info = {
    name: "end-of-study-preview",
    parameters: {
      html: { type: ParameterType.STRING, default: undefined },
    },
  };

  private jsPsych: JsPsych;

  constructor(jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(displayElement: HTMLElement, trial: { html: string }) {
    displayElement.innerHTML = `
      <div class="message">
        ${trial.html}
        <button id="continue" class="primary" type="button">Back to menu</button>
      </div>
    `;

    displayElement
      .querySelector<HTMLButtonElement>("#continue")!
      .addEventListener(
        "click",
        () => {
          this.jsPsych.finishTrial();
        },
        { once: true },
      );
  }
}
