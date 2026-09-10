import * as jsPsychModule from "jspsych";
import "jspsych/css/jspsych.css";
import "./styles.css";
import { GradCptModPlugin, sessionCompletedMod } from "./gradcpt-mod.ts";
import {
  GradCptCalibrationPlugin,
  sessionCompletedCalibration,
  calibratedDifficulty,
} from "./gradcpt-calibration.ts";
import { GradCptUnmodPlugin, sessionCompletedUnmod } from "./gradcpt-unmod.ts";
import {
  GradCptPracticePlugin,
  sessionCompletedPractice,
} from "./gradcpt-practice.ts";
import { loadImage, loadScript, parseStimOrder } from "./loader.ts";
import SurveyMultiChoicePlugin from "@jspsych/plugin-survey-multi-choice";
import { ModulationControllerPlugin } from "./modulation-controller.ts";
import { SongPickerPlugin } from "./song-picker.ts";
import { HeadphoneCheckPlugin } from "./headphone-check.ts";
import { BackgroundQuestionsPlugin } from "./background-questions.ts";

const { initJsPsych } = jsPsychModule;

declare global {
  interface Window {
    jsPsychModule?: typeof jsPsychModule;
    jsPsychPavlovia?: unknown;
  }
}

const blockMobileUsers = (): void => {
  const userAgent: string = navigator.userAgent;
  const isMobile =
    /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent) ||
    (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1);
  const warningMessage: string = `
      <div style="text-align:center; padding:50px; font-family:sans-serif;">
        <h1>Desktop Only</h1>
        <p>This study cannot be completed from a mobile device.</p>
      </div>
    `;

  if (isMobile) {
    document.documentElement.innerHTML = warningMessage;
    throw new Error("Device needs to be desktop");
  }
};

blockMobileUsers();

async function main() {
  const BASE = import.meta.env.BASE_URL;
  const orderFiles = ["song5.txt", "song6.txt", "song7.txt", "song8.txt"];
  const stimulusFileSets: string[][] = [];

  for (const orderFile of orderFiles) {
    const response = await fetch(`${BASE}${orderFile}`);
    const text = await response.text();
    stimulusFileSets.push(parseStimOrder(text));
  }

  const imageFiles = [...new Set(stimulusFileSets.flat())];
  const loadingMessage = document.querySelector("#loading-message")!;
  loadingMessage.textContent = "Loading images…";
  await Promise.all(
    imageFiles.map((fileName) => loadImage(`${BASE}${fileName}`)),
  );
  loadingMessage.textContent = "";

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

  timeline.push({
    type: SurveyMultiChoicePlugin,
    preamble: `
    <div class="consent-box">
    <h2>Consent</h2>
    Welcome! We are inviting you to take part in a research study. This consent form will tell you about the study. If you want a copy of this consent form for your records, you can print it from the screen. Please carefully read the following information. 
Key information about this research study: The following is a short summary of this study to help you decide whether to be a part of this study. This study is about how musical training affects the brain. You will be asked to complete surveys and to do computerized tasks. We expect that you the entire research study will take between 45 - 60 minutes. Your participation in this study does not involve any risk to you beyond that of everyday life. If you feel uncomfortable with any aspect of the study, you may discontinue at any time. All responses are completely anonymous. Your real-life face, body, and voice will NOT be recorded. Only aggregated results will be published. There will be no direct benefit to you other than contributing to scientific research and financial compensation for participating. 
Why am I being asked to take part in this research study? We are asking you to be in this study either because you are undergoing musical training, or because you have no formal musical training and are a control subject for our study. You should be between the ages of 18 and 65 years old and normal hearing. 
Why is this research study being done? This study is part of the research to better understand how musical training may influence the brain and cognition 
What will I be asked to do? You will be asked to complete several questionnaires that relate to your handedness, musical training and engagement, health history, demographics, and a questionnaire that determines your musical experience. Then, you will proceed with computerized listening and/or cognitive tests. This study will take between 45-60 minutes. 
Will I benefit by being in this research? There will be no direct benefit to you for taking part in this study. However, information gained from this study may help scientists to better understand how the brain responds to music and music training. You will be compensated financially for your participation. 
Who will see the information about me? Your participation in this study is confidential. No reports or publications will identify you in any way as being part of this project. All responses will be submitted using an anonymous identification number. The information you give us will be strictly confidential and will not be made available to anyone who is not directly involved in analyzing the data. 
Can I stop my participation in this study? Your participation in this research is completely voluntary. You do not have to participate if you do not want to and you can refuse to answer any question. Even if you begin the study, you may quit at any time. 
Who can I contact if I have questions or problems? If you have any questions about this study, please feel free to contact Dr. Psyche Loui (mindlabwes@gmail.com), the Principal Investigator. 
Who can I contact about my rights as a participant? If you have any questions about your rights in this research, you may contact Nan C. Regina, Director, Human Subject Research Protection, Mail Stop: 560-177, 360 Huntington Avenue, Northeastern University, Boston, MA 02115. Tel: 617.373.4588, Email: n.regina@neu.edu. You may call anonymously if you wish. 
If you want a copy of this consent for your records, you can print it from the screen. 
<strong>If you wish to participate, please select “I Agree.” If you do not wish to participate, please select “I Disagree” or close your browser.</strong>
    </div>
`,
    questions: [
      {
        prompt: "",
        name: "consent",
        options: ["I Agree", "I Disagree"],
        required: true,
      },
    ],

    button_label: "Continue",
    on_finish: (data: { response: { consent: string } }) => {
      if (data.response.consent === "I Disagree") {
        jsPsych.endExperiment("You chose to not participate");
      }
    },
  });

  timeline.push({ type: HeadphoneCheckPlugin });

  timeline.push({
    type: BackgroundQuestionsPlugin,
  });

  timeline.push({
    type: SongPickerPlugin,
    songs: [
      {
        name: "Adele: Hello",
        file: `${BASE}Adele_Hello_3.mp3`,
        frequency: 5.266666667,
      },
      {
        name: "Adele: Someone Like You",
        file: `${BASE}Adele_SomeoneLikeYou_3.mp3`,
        frequency: 4.533333333,
      },
      {
        name: "Alicia Keys: Girl on Fire",
        file: `${BASE}AliciaKeys_GirlOnFire_3.mp3`,
        frequency: 6.2,
      },
      {
        name: "Avril Lavigne: Complicated",
        file: `${BASE}AvrilLavigne_Complicated_3.mp3`,
        frequency: 5.2,
      },
      {
        name: "Bill Medley & Jennifer Warnes: I've Had the Time of My Life",
        file: `${BASE}BillMedley_JenniferWarnes_I'veHadTheTimeOfMyLife_3.mp3`,
        frequency: 7.266666667,
      },
      {
        name: "Bon Jovi: Livin' on a Prayer",
        file: `${BASE}BonJovi_LivinOnAPrayer_3.mp3`,
        frequency: 8.2,
      },
      {
        name: "Boyz II Men: I'll Make Love to You",
        file: `${BASE}Boyz2Men_I'llMakeLoveToYou_3.mp3`,
        frequency: 4.8,
      },
      {
        name: "Bruno Mars: Versace on the Floor",
        file: `${BASE}BrunoMars_VersaceOnTheFloor_3.mp3`,
        frequency: 5.8,
      },
      {
        name: "Bruno Mars: When I Was Your Man",
        file: `${BASE}BrunoMars_WhenIWasYourMan_3.mp3`,
        frequency: 4.866666667,
      },
      {
        name: "Christina Aguilera: Beautiful",
        file: `${BASE}ChristinaAguilera_Beautiful_3.mp3`,
        frequency: 5.066666667,
      },
      {
        name: "Death Cab for Cutie: I Will Follow You into the Dark",
        file: `${BASE}DeathCabForCutie_IWillFollowYouIntoTheDark_3.mp3`,
        frequency: 5.333333333,
      },
      {
        name: "Ed Sheeran: Perfect",
        file: `${BASE}EdSheeran_Perfect_3.mp3`,
        frequency: 6.466666667,
      },
      {
        name: "Ed Sheeran: Thinking Out Loud",
        file: `${BASE}EdSheeran_ThinkingOutLoud_3.mp3`,
        frequency: 5.266666667,
      },
      {
        name: "Eric Carmen: All by Myself",
        file: `${BASE}EricCarmen_AllByMyself_3.mp3`,
        frequency: 7.733333333,
      },
      {
        name: "John Legend: All of Me",
        file: `${BASE}JohnLegend_AllOfMe_3.mp3`,
        frequency: 8,
      },
      {
        name: "Julia Michaels: Issues",
        file: `${BASE}JuliaMichaels_Issues_3.mp3`,
        frequency: 7.6,
      },
      {
        name: "Kelly Clarkson: Because of You",
        file: `${BASE}KellyClarkson_BecauseOfYou_3.mp3`,
        frequency: 4.666666667,
      },
      {
        name: "Kelly Clarkson: Since U Been Gone",
        file: `${BASE}KellyClarkson_SinceUBeenGone_3.mp3`,
        frequency: 8.733333333,
      },
      {
        name: "Kesha: Praying",
        file: `${BASE}Kesha_Praying_3.mp3`,
        frequency: 4.933333333,
      },
      {
        name: "Lady Antebellum: Need You Now",
        file: `${BASE}LadyAntebellum_NeedYouNow_3.mp3`,
        frequency: 7.2,
      },
      {
        name: "Lady Gaga: Shallow",
        file: `${BASE}LadyGaga_Shallow_3.mp3`,
        frequency: 6.4,
      },
      {
        name: "Miley Cyrus: Wrecking Ball",
        file: `${BASE}MileyCyrus_WreckingBall_3.mp3`,
        frequency: 8,
      },
      {
        name: "Pink: Just Give Me a Reason",
        file: `${BASE}Pink_JustGiveMeAReason_3.mp3`,
        frequency: 6.333333333,
      },
      {
        name: "Rufus Wainwright: Hallelujah",
        file: `${BASE}RufusWainwright_Hallelujah_3.mp3`,
        frequency: 4.866666667,
      },
      {
        name: "Sam Smith: Stay with Me",
        file: `${BASE}SamSmith_StayWithMe_3.mp3`,
        frequency: 5.6,
      },
      {
        name: "Sara Bareilles: Love Song",
        file: `${BASE}SaraBareilles_LoveSong_3.mp3`,
        frequency: 8.2,
      },
      {
        name: "Survivor: Eye of the Tiger",
        file: `${BASE}Survivor_EyeOfTheTiger_3.mp3`,
        frequency: 7.266666667,
      },
      {
        name: "Plain White T's: Hey There Delilah",
        file: `${BASE}ThePlainWhiteTs_HeyThereDelilah_3.mp3`,
        frequency: 6.933333333,
      },
      {
        name: "Toto: Africa",
        file: `${BASE}Toto_Africa_3.mp3`,
        frequency: 6.133333333,
      },
      {
        name: "Whitney Houston: I Have Nothing",
        file: `${BASE}WhitneyHouston_IHaveNothing_3.mp3`,
        frequency: 5.133333333,
      },
      {
        name: "Whitney Houston: I Will Always Love You",
        file: `${BASE}WhitneyHouston_IWillAlwaysLoveYou_3.mp3`,
        frequency: 4.533333333,
      },
      {
        name: "Wiz Khalifa: See You Again",
        file: `${BASE}WizKhalifa_SeeYouAgain_3.mp3`,
        frequency: 5.333333333,
      },
    ],
  });

  timeline.push({ type: ModulationControllerPlugin });

  timeline.push({
    type: GradCptPracticePlugin,
    stimulusFiles: stimulusFileSets[0],
    songIndex: 0,
  });

  timeline.push({
    type: GradCptCalibrationPlugin,
    stimulusFiles: stimulusFileSets[0],
    songIndex: 0,
  });

  timeline.push({
    type: GradCptUnmodPlugin,
    stimulusFiles: stimulusFileSets[0],
    songIndex: 0,
    difficulty: () => calibratedDifficulty,
  });

  if (onPavlovia) {
    timeline.push({ type: pavloviaPlugin, command: "finish" });
  }

  await jsPsych.run(timeline);
}

$(document).ready(() => {
  void main();
});
