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

    const DEPTH_MIN = 0;
    const DEPTH_MAX = 0.5;
    const DEPTH_STEP = 0.05;

    displayElement.innerHTML = `
      <div class="audio-setup">
        <h2>Modulation depth setter</h2>
        <p>Click <b>New song</b> to start playing the next song. While it plays, press <b>1</b> to increase the amplitude modulation and <b>2</b> to decrease it. Use the <b>highest amount of modulation that would still be tolerable</b> as background music while you work.<br>Once you're happy with the setting, click <b>Save</b>, then click <b>New song</b> to move on to the next one.</p>

        <div class="audio-control">
          <span id="song-status">No song playing yet.</span>
        </div>

        <div class="audio-control">
          <span>Depth: <output id="depth-value">–</output></span>
        </div>

        <div class="audio-setup-actions">
          <button id="new-song" type="button">New song</button>
          <button id="save-modulation" class="primary" type="button" disabled>Save</button>
        </div>
        <p id="audio-error" role="alert"></p>
      </div>
    `;

    const songStatus =
      displayElement.querySelector<HTMLSpanElement>("#song-status")!;
    const depthValue =
      displayElement.querySelector<HTMLOutputElement>("#depth-value")!;
    const newSongButton =
      displayElement.querySelector<HTMLButtonElement>("#new-song")!;
    const saveButton =
      displayElement.querySelector<HTMLButtonElement>("#save-modulation")!;
    const error =
      displayElement.querySelector<HTMLParagraphElement>("#audio-error")!;

    let currentIndex = -1;
    let stopPlayer = () => {};
    let playing = false;

    const currentSettings = () => settings[currentIndex];

    const stopPreview = () => {
      stopPlayer();
      stopPlayer = () => {};
      playing = false;
    };

    const showDepth = () => {
      depthValue.value = currentSettings().depth.toFixed(2);
    };

    const playCurrent = async () => {
      error.textContent = "";
      const current = currentSettings();
      try {
        const player = await amplitudeModulation(
          current.file,
          current.frequency,
          current.depth,
        );
        player.start();
        stopPlayer = () => player.stop();
        playing = true;
      } catch {
        error.textContent = "The song could not be played.";
        playing = false;
      }
    };

    const changeDepth = async (amount: number) => {
      if (!playing) return;
      const current = currentSettings();
      current.depth = Math.min(
        DEPTH_MAX,
        Math.max(DEPTH_MIN, Number((current.depth + amount).toFixed(2))),
      );
      showDepth();
      stopPreview();
      await playCurrent();
    };

    newSongButton.addEventListener("click", async () => {
      stopPreview();
      currentIndex += 1;
      if (currentIndex >= settings.length) {
        modulationSettings = settings;
        this.jsPsych.finishTrial({ modulation_settings: modulationSettings });
        return;
      }
      songStatus.textContent = `Now playing: ${currentSettings().name}`;
      showDepth();
      saveButton.disabled = false;
      newSongButton.disabled = true;
      await playCurrent();
      newSongButton.disabled = false;
    });

    saveButton.addEventListener("click", () => {
      stopPreview();
      songStatus.textContent = `Saved: ${currentSettings().name} (depth ${currentSettings().depth.toFixed(2)})`;
      saveButton.disabled = true;
    });

    displayElement.addEventListener("keydown", (event) => {
      if (event.key === "1") {
        void changeDepth(DEPTH_STEP);
      } else if (event.key === "2") {
        void changeDepth(-DEPTH_STEP);
      }
    });
    displayElement.tabIndex = -1;
    displayElement.focus();
  }
}
