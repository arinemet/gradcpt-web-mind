import type { JsPsych } from "jspsych";

const BREAK_SECONDS = 15;

export class GradCptBreakPlugin {
  static info = {
    name: "gradcpt-break",
    parameters: {},
  };

  private jsPsych: JsPsych;

  constructor(jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(displayElement: HTMLElement) {
    displayElement.innerHTML = `
      <div class="gradcpt-break">
        <h1>Take a short break</h1>
        <p id="break-countdown">${BREAK_SECONDS}</p>
        <p><strong>Reminder: press SPACEBAR after you see a city scene and do NOT press SPACEBAR after you see a mountain scene.</strong></p>
      </div>
    `;

    const countdownEl =
      displayElement.querySelector<HTMLParagraphElement>("#break-countdown")!;
    let secondsRemaining = BREAK_SECONDS;

    const interval = setInterval(() => {
      secondsRemaining--;
      countdownEl.textContent = `${secondsRemaining}`;
      if (secondsRemaining <= 0) {
        clearInterval(interval);
        this.jsPsych.finishTrial();
      }
    }, 1000);
  }
}
