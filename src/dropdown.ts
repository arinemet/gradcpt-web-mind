import type { JsPsych } from "jspsych";

export class JsPsychePlugin {
  static info = {
    name: "jspyche-plugin",
    parameters: {},
  };

  private jsPsych: JsPsych;

  constructor(jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(displayElement: HTMLElement) {
    displayElement.innerHTML = `
    <div class="selection-page">
          <h2>Choose an option</h2>

          <label for="option-menu">Option</label>
          <select id="option-menu">
            <option value="">Select an option</option>
            <option value="option-1">Option 1</option>
            <option value="option-2">Option 2</option>
            <option value="option-3">Option 3</option>
          </select>

          <button id="continue" class="primary" type="button">
            Continue
          </button>

          <p id="error" role="alert"></p>
        </div>
    `;

    const menu =
      displayElement.querySelector<HTMLSelectElement>("#option-menu")!;

    const error = displayElement.querySelector<HTMLParagraphElement>("#error")!;

    const conitnueButton =
      displayElement.querySelector<HTMLButtonElement>("#continue")!;

    conitnueButton?.addEventListener("click", () => {
      if (menu.value === "") {
        error.textContent = "Please select a option";
        return;
      }

      this.jsPsych.finishTrial({
        selected_option: menu.value,
      });
    });
  }
}
