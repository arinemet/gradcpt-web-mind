import * as jsPsychModule from "jspsych";
import "jspsych/css/jspsych.css";
import { GradCptPlugin, sessionCompleted } from "./gradcpt.ts";
import { loadScript, parseStimOrder } from "./loader.ts";

const { initJsPsych } = jsPsychModule;

declare global {
  interface Window {
    jsPsychModule?: typeof jsPsychModule;
    jsPsychPavlovia?: unknown;
  }
}

const blockMobileUsers = (): void => {
  const userAgent: string = navigator.userAgent;
  const isMobile: boolean = /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);

  if (isMobile) {
    const warningMessage: string = `
      <div style="text-align:center; padding:50px; font-family:sans-serif;">
        <h1>Desktop Only</h1>
        <p>This study cannot be completed from a mobile device.</p>
      </div>
    `;

    throw new Error("Device needs to be desktop");

    if (document.documentElement) {
      document.documentElement.innerHTML = warningMessage;
    }
  }
};

blockMobileUsers();

async function main() {
  document.querySelector("#loading-message")?.remove();

  const mobile =
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

  if (mobile) {
    document.body.innerHTML = `
      <main class="message">
        <h1>Desktop device required.</h1>
        <p>Please open this study on a desktop or laptop computer.</p>
      </main>
    `;
    return;
  }

  const BASE = import.meta.env.BASE_URL;
  const songText = await fetch(`${BASE}song1.txt`).then((res) => res.text());
  const stimulusFiles = parseStimOrder(songText);
  const onPavlovia = location.hostname === "run.pavlovia.org";
  const jsPsych = initJsPsych({
    on_finish: () => {
      if (onPavlovia) return;
      jsPsych.getDisplayElement().innerHTML = sessionCompleted
        ? `<h1>Session complete.</h1><p>Thank you for participating.</p>`
        : `<h1>Session incomplete, exited.</h1><p>You exited from fullscreen. Thank you for participating.</p>`;
    },
  });

  const timeline: object[] = [];
  let pavloviaPlugin: unknown;

  if (onPavlovia) {
    window.jsPsychModule = jsPsychModule;
    await loadScript("https://pavlovia.org/lib/jspsych-7-pavlovia-2022.1.1.js");
    pavloviaPlugin = window.jsPsychPavlovia;
    if (typeof pavloviaPlugin !== "function") {
      throw new Error("could not load the Pavlovia jsPsych plugin");
    }
    timeline.push({ type: pavloviaPlugin, command: "init" });
  }

  timeline.push({ type: GradCptPlugin, stimulusFiles });

  if (onPavlovia) {
    timeline.push({ type: pavloviaPlugin, command: "finish" });
  }

  await jsPsych.run(timeline);
}

main().catch((error: unknown) => {
  document.body.textContent =
    error instanceof Error ? error.message : String(error);
});
