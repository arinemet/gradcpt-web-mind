import type { JsPsych } from "jspsych";

export class HeadphoneCheckPlugin {
  static info = {
    name: "headphone-check",
    parameters: {},
  };

  private jsPsych: JsPsych;

  constructor(jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(displayElement: HTMLElement) {
    const eventName = "hcHeadphoneCheckEnd";

    displayElement.innerHTML = '<div id="hc-container"></div>';

    const onComplete = (_event: Event, data: HeadphoneCheckResult) => {
      $(document).off(eventName, onComplete);

      if (data.didPass) {
        this.jsPsych.finishTrial({ did_pass: true });
        return;
      }

      displayElement.innerHTML = `
        <h1>Headphone check failed.</h1>
        <p>Please use headphones and reload the page to try again.</p>
      `;
    };

    $(document).on(eventName, onComplete);
    HeadphoneCheck.runHeadphoneCheck({});
  }
}
