import type { JsPsych } from "jspsych";

const PAVLOVIA_SURVEY_URL =
  "https://run.pavlovia.org/pavlovia/survey-2026.2.0/?surveyId=12a567b5-f4ad-4c26-8423-43fee0056117&__pilotToken=c4ca4238a0b923820dcc509a6f75849b";

export class BackgroundQuestionsPlugin {
  static info = {
    name: "background-questions",
    parameters: {},
  };

  private jsPsych: JsPsych;

  constructor(jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(displayElement: HTMLElement) {
    displayElement.innerHTML = `
      <iframe
        id="bq-survey-frame"
        src="${PAVLOVIA_SURVEY_URL}"
        style="width: 100%; height: 100vh; border: none;"
        allow="autoplay"
      ></iframe>
    `;

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== "pavlovia-survey-complete") return;

      window.removeEventListener("message", onMessage);
      this.jsPsych.finishTrial(event.data.responses ?? {});
    };

    window.addEventListener("message", onMessage);
  }
}
