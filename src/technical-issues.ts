import type { JsPsych } from "jspsych";

export class TechnicalIssuesPlugin {
  static info = {
    name: "technical-issues",
    parameters: {},
  };

  private jsPsych: JsPsych;

  constructor(jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(displayElement: HTMLElement) {
    displayElement.innerHTML = `
      <form id="technical-issues-form" style="max-width: 720px; margin: 0 auto; text-align: left;">
        <h2>Technical Issues</h2>
        <p>Did you experience any technical issues during the study? If so, please describe them below. If not, you can leave this blank.</p>
        <textarea id="technical-issues-text" name="technical_issues" rows="6" style="width: 100%; box-sizing: border-box; padding: 0.5rem; font: inherit; color: #fff; background: #000; border: 1px solid #aaa;"></textarea>
        <button type="submit" style="margin-top: 0.75rem;">Continue</button>
      </form>
    `;

    const form =
      displayElement.querySelector<HTMLFormElement>("#technical-issues-form")!;
    const textarea =
      displayElement.querySelector<HTMLTextAreaElement>("#technical-issues-text")!;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.jsPsych.finishTrial({ technical_issues: textarea.value });
    });
  }
}
