import type { JsPsych } from "jspsych";

export class DropdownPlugin {
  static info = {
    name: "Dropdown Plugin",
    parameters: {},
  };

  private jsPsych: JsPsych;

  constructor(jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(displayElement: HTMLElement) {
    displayElement.innerHTML = `
    <div class="selection-page">

          <h2 for="option-menu">THAMP Experiment Demo</h2>
          <p>This is a special redition of the experiment flow. For demo purposes, we let you jump to specific subsections of the study. <br> In the actual flow of the experiment these sections are executed sequentially, no jumps are allowed. </p>
          <p></p>
          <select id="option-menu">
            <option value="">--Choose a subsection--</option>
            <option value="consent-form">Consent Form</option>
            <option value="headphone-check">Headphone Check</option>
            <option value="background-questions">Background Questions</option>
            <option value="general-instr">General Experiment Instructions</option>
            <option value="song-select">Song Selection</option>
            <option value="song-familiarity-questions">Song Familiarity Questions</option>
            <option value="modulation-controller">Modulation Controller</option>
            <option value="gradcpt-general-instr">GradCPT General Instructions</option>
            <option value="gradcpt-practice">GradCPT Practice</option>
            <option value="gradcpt-calib">GradCPT Difficulty Calibration</option>
            <option value="gradcpt-main-instr">GradCPT Main Instructions</option>
            <option value="gradcpt-unmod">GradCPT Unmodulated</option>
            <option value="gradcpt-mod">GradCPT Modulated</option>
            <option value="exit">Exit</option>
          </select>

          <button id="continue" class="primary" type="button">
            Jump
          </button>

          <p id="error" role="alert"></p>
        </div>
    `;

    const menu =
      displayElement.querySelector<HTMLSelectElement>("#option-menu")!;

    const error = displayElement.querySelector<HTMLParagraphElement>("#error")!;

    const continueButton =
      displayElement.querySelector<HTMLButtonElement>("#continue")!;

    continueButton.addEventListener("click", () => {
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
