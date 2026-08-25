import type { JsPsych } from "jspsych";
import { loadAudio } from "./loader.ts";

export interface Song {
  name: string;
  file: string;
}

const BASE = import.meta.env.BASE_URL;
export const selectedSongs: Song[] = [
  {
    name: "Adele: Hello",
    file: `${BASE}Adele_Hello_3.mp3`,
  },
  {
    name: "Toto: Africa",
    file: `${BASE}Toto_Africa_3.mp3`,
  },
  {
    name: "Lady Gaga: Shallow",
    file: `${BASE}LadyGaga_Shallow_3.mp3`,
  },
  {
    name: "Kesha: Praying",
    file: `${BASE}Kesha_Praying_3.mp3`,
  },
];

export class SongPickerPlugin {
  static info = { name: "song-picker", parameters: {} };

  private jsPsych: JsPsych;

  constructor(jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(displayElement: HTMLElement, trial: { songs: Song[] }) {
    const choices = trial.songs
      .map(
        (song, index) => `
          <tr class="song-choice">
            <td><input type="checkbox" value="${index}" aria-label="Select ${song.name}"></td>
            <td>${song.name}</td>
            <td><button class="play-song" type="button" data-song="${index}">Play</button></td>
          </tr>
        `,
      )
      .join("");

    displayElement.innerHTML = `
      <div class="audio-setup">
        <h2>Choose four songs that you would like to use</h2>
        <table id="song-choices">
          <thead>
            <tr><th>Select</th><th>Song name</th><th>Preview</th></tr>
          </thead>
          <tbody>${choices}</tbody>
        </table>
        <button id="continue" class="primary" type="button">Continue</button>
        <p id="error" role="alert"></p>
      </div>
    `;

    const checkboxes = Array.from(
      displayElement.querySelectorAll<HTMLInputElement>(
        '#song-choices input[type="checkbox"]',
      ),
    );
    const playButtons = Array.from(
      displayElement.querySelectorAll<HTMLButtonElement>(".play-song"),
    );
    const error = displayElement.querySelector<HTMLParagraphElement>("#error")!;
    let audio: HTMLAudioElement | undefined;
    let playingButton: HTMLButtonElement | undefined;

    const stopPreview = () => {
      audio?.pause();
      audio = undefined;
      if (playingButton) playingButton.textContent = "Play";
      playingButton = undefined;
    };

    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const checked = checkboxes.filter((choice) => choice.checked);
        checkboxes.forEach((choice) => {
          choice.disabled = checked.length === 4 && !choice.checked;
        });
        error.textContent = "";
      });
    });

    playButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (button === playingButton) {
          stopPreview();
          return;
        }

        stopPreview();
        const song = trial.songs[Number(button.dataset.song)];
        audio = new Audio(song.file);
        playingButton = button;
        button.textContent = "Stop";
        audio.addEventListener("ended", stopPreview, { once: true });
        void audio.play().catch(() => {
          stopPreview();
          error.textContent = "The preview could not be played.";
        });
      });
    });

    displayElement
      .querySelector("#continue")!
      .addEventListener("click", async () => {
        const indexes = checkboxes
          .filter((checkbox) => checkbox.checked)
          .map((checkbox) => Number(checkbox.value));

        if (indexes.length < 4) {
          error.textContent = "Please choose four songs before continuing.";
          return;
        }

        const songs = indexes.map((index) => trial.songs[index]);
        const continueButton =
          displayElement.querySelector<HTMLButtonElement>("#continue")!;

        continueButton.disabled = true;
        error.textContent = "Loading selected songs…";

        try {
          await Promise.all(songs.map((song) => loadAudio(song.file)));
          selectedSongs.splice(0, selectedSongs.length, ...songs);
          stopPreview();
          this.jsPsych.finishTrial({ selected_songs: selectedSongs });
        } catch {
          error.textContent = "The selected songs could not be loaded.";
          continueButton.disabled = false;
        }
      });
  }
}
