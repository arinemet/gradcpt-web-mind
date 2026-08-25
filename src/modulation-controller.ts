import type { JsPsych } from "jspsych";
import { amplitudeModulation } from "./audio.ts";
import { selectedSongs, type Song } from "./song-picker.ts";

export interface ModulationSettings extends Song {
  depth: number;
  frequency: number;
}

export let modulationSettings: ModulationSettings[] = selectedSongs.map(
  (song) => ({
    ...song,
    depth: 0.25,
    frequency: 10,
  }),
);

export class ModulationControllerPlugin {
  static info = {
    name: "modulation-controller",
    parameters: {},
  };

  private jsPsych: JsPsych;

  constructor(jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(displayElement: HTMLElement) {
    const settings: ModulationSettings[] = selectedSongs.map((song) => ({
      ...song,
      depth: 0.25,
      frequency: 10,
    }));
    const options = settings
      .map((song, index) => `<option value="${index}">${song.name}</option>`)
      .join("");

    displayElement.innerHTML = `
      <div class="audio-setup">
        <h2>Adjust modulation</h2>
        <p>Apply modulation settings to each of your four selected songs.</p>

        <div class="audio-control">
          <label for="modulation-song-select">Song</label>
          <select id="modulation-song-select">${options}</select>
        </div>

        <div class="audio-control">
          <label for="depth-slider">Depth <output id="depth-value">0.25</output></label>
          <input id="depth-slider" type="range" min="0" max="0.5" step="0.05" value="0.25">
        </div>

        <div class="audio-control">
          <label for="frequency-slider">
            Frequency <output id="frequency-value">10</output> Hz
          </label>
          <input id="frequency-slider" type="range" min="1" max="100" step="1" value="10">
        </div>

        <div class="audio-setup-actions">
          <button id="preview-song" type="button">Play preview</button>
          <button id="confirm-modulation" class="primary" type="button">Continue</button>
        </div>
        <p id="audio-error" role="alert"></p>
      </div>
    `;

    const songSelect = displayElement.querySelector<HTMLSelectElement>(
      "#modulation-song-select",
    )!;
    const depthSlider =
      displayElement.querySelector<HTMLInputElement>("#depth-slider")!;
    const frequencySlider =
      displayElement.querySelector<HTMLInputElement>("#frequency-slider")!;
    const depthValue =
      displayElement.querySelector<HTMLOutputElement>("#depth-value")!;
    const frequencyValue =
      displayElement.querySelector<HTMLOutputElement>("#frequency-value")!;
    const previewButton =
      displayElement.querySelector<HTMLButtonElement>("#preview-song")!;
    const confirmButton = displayElement.querySelector<HTMLButtonElement>(
      "#confirm-modulation",
    )!;
    const error =
      displayElement.querySelector<HTMLParagraphElement>("#audio-error")!;

    let playing = false;
    let stopPlayer = () => {};
    let previewTimer = 0;

    const currentSettings = () => settings[Number(songSelect.value)];
    const stopPreview = () => {
      window.clearTimeout(previewTimer);
      stopPlayer();
      stopPlayer = () => {};
      playing = false;
      previewButton.textContent = "Play preview";
    };
    const showSettings = () => {
      const current = currentSettings();
      depthSlider.value = String(current.depth);
      frequencySlider.value = String(current.frequency);
      depthValue.value = String(current.depth);
      frequencyValue.value = String(current.frequency);
    };

    songSelect.addEventListener("change", () => {
      stopPreview();
      showSettings();
    });
    depthSlider.addEventListener("input", () => {
      currentSettings().depth = Number(depthSlider.value);
      depthValue.value = depthSlider.value;
    });
    frequencySlider.addEventListener("input", () => {
      currentSettings().frequency = Number(frequencySlider.value);
      frequencyValue.value = frequencySlider.value;
    });

    previewButton.addEventListener("click", async () => {
      if (playing) {
        stopPreview();
        return;
      }
      error.textContent = "";
      previewButton.disabled = true;
      previewButton.textContent = "Loading…";
      try {
        const current = currentSettings();
        const player = await amplitudeModulation(
          current.file,
          current.frequency,
          current.depth,
        );
        player.start();
        stopPlayer = () => player.stop();
        playing = true;
        previewButton.textContent = "Stop preview";
        previewTimer = window.setTimeout(stopPreview, 10_000);
      } catch {
        error.textContent = "The preview could not be played.";
        previewButton.textContent = "Play preview";
        playing = false;
      } finally {
        previewButton.disabled = false;
      }
    });

    confirmButton.addEventListener("click", () => {
      stopPreview();
      modulationSettings = settings;
      this.jsPsych.finishTrial({ modulation_settings: modulationSettings });
    });
  }
}
