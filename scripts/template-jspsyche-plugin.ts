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

  trial(displayElement: HTMLElement) {}
}
