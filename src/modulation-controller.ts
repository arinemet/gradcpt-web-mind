import type { JsPsych } from "jspsych";
import { amplitudeModulation } from "./audio.ts";
import { selectedSongs, type Song } from "./song-picker.ts";

export interface ModulationSettings extends Song {
  depth: number;
  frequency: number;
}

export let modulationFrequencies: number[] = [];

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
        <h2>Modulation depth setter</h2>
        <p>Please set the modulation to the <b>highest possible tolerable value</b>. You will have to stop and start the preview to hear your changes. <br>Once you find the modulation settings that you like, move onto the next song by picking it from the dropdown.<br>Once you are fully done, click continue near the botton of the page.</p>

        <div class="audio-control">
          <label for="modulation-song-select">Song</label>
          <select id="modulation-song-select">${options}</select>
        </div>

        <div class="audio-control">
          <label for="depth-slider">Depth <output id="depth-value">0.25</output></label>
          <button id="increase-depth" type="button" aria-label="Increase depth by 0.05">Up</button>
          <input id="depth-slider" type="range" min="0" max="0.5" step="0.05" value="0.25">
          <button id="decrease-depth" type="button">Down</button>
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
    const depthValue =
      displayElement.querySelector<HTMLOutputElement>("#depth-value")!;
    const increaseDepthButton =
      displayElement.querySelector<HTMLButtonElement>("#increase-depth")!;
    const decreaseDepthButton =
      displayElement.querySelector<HTMLButtonElement>("#decrease-depth")!;
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
      depthValue.value = current.depth.toFixed(2);
      increaseDepthButton.disabled = current.depth >= Number(depthSlider.max);
      decreaseDepthButton.disabled = current.depth <= Number(depthSlider.min);
    };
    const changeDepth = (amount: number) => {
      const current = currentSettings();
      const minimum = Number(depthSlider.min);
      const maximum = Number(depthSlider.max);
      current.depth = Math.min(
        maximum,
        Math.max(minimum, Number((current.depth + amount).toFixed(2))),
      );
      showSettings();
    };

    songSelect.addEventListener("change", () => {
      stopPreview();
      showSettings();
    });
    depthSlider.addEventListener("input", () => {
      currentSettings().depth = Number(depthSlider.value);
      showSettings();
    });
    increaseDepthButton.addEventListener("click", () => changeDepth(0.05));
    decreaseDepthButton.addEventListener("click", () => changeDepth(-0.05));

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
