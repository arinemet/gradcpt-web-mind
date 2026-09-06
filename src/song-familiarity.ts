import type { JsPsych } from "jspsych";
import { selectedSongs } from "./song-picker.ts";

function sliderQuestion(tag: string, prompt: string, subLabels: string[], min: number, max: number): string {
  const rows = subLabels
    .map(
      (label, i) => `
      <div class="bq-slider-row">
        <label>${label}</label>
        <input type="range" name="${tag}.${i + 1}" min="${min}" max="${max}" step="1" value="${min}" />
      </div>`,
    )
    .join("");

  return `
    <div class="bq-question">
      <p>${prompt}</p>
      ${rows}
    </div>
  `;
}

export class SongFamiliarityPlugin {
  static info = {
    name: "song-familiarity",
    parameters: {},
  };

  private jsPsych: JsPsych;

  constructor(jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(displayElement: HTMLElement) {
    const questions = selectedSongs
      .map((song, index) =>
        sliderQuestion(
          `Q${index + 1}.famlike`,
          `Please rate how familiar you are and how much you like "${song.name}" on a scale of 0 to 4 (0 being unfamiliar or unliked, 4 being very familiar or very liked).`,
          ["Liking", "Familarity"],
          0,
          4,
        ),
      )
      .join("");

    displayElement.innerHTML = `
      <form id="song-familiarity-form" style="max-width: 720px; margin: 0 auto; text-align: left;">
        <h2>Familiarity and Liking</h2>
        ${questions}
        <button type="submit">Continue</button>
      </form>
    `;

    const form = displayElement.querySelector<HTMLFormElement>("#song-familiarity-form")!;

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const responses: Record<string, unknown> = {};
      for (const [key, value] of formData.entries()) {
        responses[key] = value;
      }

      this.jsPsych.finishTrial(responses);
    });
  }
}
