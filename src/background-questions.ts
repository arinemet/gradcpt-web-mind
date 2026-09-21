import type { JsPsych } from "jspsych";

const MUSIC_STYLE_CHOICES = [
  "None",
  "Alternative or Indie",
  "Jazz or Blues",
  "Classical or Opera",
  "Country, Western",
  "Dance, Techno, or Electronic",
  "Latin Music",
  "Ballad",
  "Folk",
  "Gospel",
  "Metal or Punk",
  "Soul",
  "Popular Music From Your Culture",
  "Pop",
  "World Music",
  "Rap or Hip-Hop",
  "Reggae",
  "Traditional Music From Your Culture",
  "Rock",
  "R&B",
  "Music From Films, TV Shows, Video Games",
  "Other",
];

const FREQUENCY_CHOICES = [
  "Never",
  "Rarely",
  "Sometimes",
  "Often",
  "Very Often",
];

const AGREEMENT_7_CHOICES = [
  "Strongly disagree",
  "Disagree",
  "Slightly disagree",
  "Neutral",
  "Slightly agree",
  "Agree",
  "Strongly agree",
];

function bipolarLikert(tag: string, prompt: string, points: number): string {
  const cells = Array.from({ length: points }, (_, i) => i + 1)
    .map(
      (value) => `
        <td style="text-align: center;">
          <input type="radio" name="${tag}" value="${value}" required />
        </td>`,
    )
    .join("");

  return `
    <div class="bq-question">
      <p>${prompt}</p>
      <table style="width: 100%;">
        <tr>
          <td>Completely Disagree</td>
          ${cells}
          <td>Completely Agree</td>
        </tr>
        <tr>
          <td></td>
          ${Array.from({ length: points }, (_, i) => `<td style="text-align: center;">${i + 1}</td>`).join("")}
          <td></td>
        </tr>
      </table>
    </div>
  `;
}

function radioQuestion(
  tag: string,
  prompt: string,
  choices: string[],
  required = true,
): string {
  const options = choices
    .map(
      (choice) => `
        <label style="display: block;">
          <input type="radio" name="${tag}" value="${choice}" ${required ? "required" : ""} />
          ${choice}
        </label>`,
    )
    .join("");

  return `
    <div class="bq-question">
      <p>${prompt}</p>
      ${options}
    </div>
  `;
}

function radioWithTextEntryQuestion(
  tag: string,
  prompt: string,
  choices: { label: string; textEntry?: boolean }[],
): string {
  const options = choices
    .map(({ label, textEntry }, index) => {
      const inputId = `${tag}-${index}`;
      return `
        <label style="display: block;">
          <input type="radio" name="${tag}" value="${label}" id="${inputId}" required />
          ${label}
        </label>
        ${textEntry ? `<input type="text" class="bq-text-entry" name="${tag}.text" data-for="${inputId}" hidden />` : ""}`;
    })
    .join("");

  return `
    <div class="bq-question">
      <p>${prompt}</p>
      ${options}
    </div>
  `;
}

function checkboxQuestion(
  tag: string,
  prompt: string,
  choices: string[],
): string {
  const options = choices
    .map(
      (choice) => `
        <label style="display: block;">
          <input type="checkbox" name="${tag}" value="${choice}" />
          ${choice}
        </label>`,
    )
    .join("");

  return `
    <div class="bq-question">
      <p>${prompt}</p>
      ${options}
    </div>
  `;
}

function groupedRadioQuestion(
  tag: string,
  prompt: string,
  groups: { label: string; choices: string[] }[],
): string {
  const groupBlocks = groups
    .map(({ label, choices }) => {
      const options = choices
        .map(
          (choice) => `
        <label style="display: block;">
          <input type="radio" name="${tag}.${label}" value="${choice}" required />
          ${choice}
        </label>`,
        )
        .join("");

      return `
      <div class="bq-question-group">
        <p><strong>${label}</strong></p>
        ${options}
      </div>`;
    })
    .join("");

  return `
    <div class="bq-question">
      <p>${prompt}</p>
      ${groupBlocks}
    </div>
  `;
}

function textQuestion(tag: string, prompt: string, required = true): string {
  return `
    <div class="bq-question">
      <label>${prompt}</label>
      <input type="text" name="${tag}" ${required ? "required" : ""} />
    </div>
  `;
}

function textAreaQuestion(tag: string, prompt: string): string {
  return `
    <div class="bq-question">
      <label>${prompt}</label>
      <textarea name="${tag}"></textarea>
    </div>
  `;
}

function sliderQuestion(
  tag: string,
  prompt: string,
  subLabels: string[],
  min: number,
  max: number,
): string {
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

const PAGES: string[] = [
  `
    ${textQuestion("Q1.02.name", "Your name:")}
    ${radioQuestion("Q1.03.gender", "Your gender identity:", [
      "Male",
      "Female",
      "Non-binary / third gender",
      "Prefer not to say",
    ])}
    ${textQuestion("Q1.04.age", "Your age:")}
    ${textQuestion("Q1.05.occupation", "Your occupation:")}
    ${radioQuestion(
      "Q37",
      "Please select the category that best describes your race/ethnicity (select only one response):",
      [
        "American Indian or Alaska Native (not Hispanic or Latino): origins in any of the original peoples of North and South America (including Central America), and who maintains tribal affiliation or community attachment",
        "Asian (not Hispanic or Latino): origins in any of the original peoples of the Far East, Southeast Asia, or the Indian subcontinent including, for example, Cambodia, China, India, Japan, Korea, Malaysia, Pakistan, the Philippine Islands, Thailand, and Vietnam",
        "Black or African American (not Hispanic or Latino): origins in any of the black racial groups of Africa",
        "Hispanic or Latino: a person of Cuban, Mexican, Chicano, Puerto Rican, South or Central American, or other Spanish culture or origin, regardless of race",
        "Native Hawaiian or Other Pacific Islander (not Hispanic or Latino): origins in any of the original peoples of Hawaii, Guam, Samoa, or other Pacific Islands",
        "White (not Hispanic or Latino): origins in any of the original peoples of Europe, the Middle East, or North Africa",
        "Two or More Races (not Hispanic or Latino): Please select this option if you are two or more races from the options",
        "I prefer not to answer",
      ],
    )}
    ${textQuestion("Q1.06.lang", "What is your first language?")}
    ${textQuestion("Q1.06.2ndlang", "Other fluent languages, if any:", false)}
    ${textQuestion("Q1.07.countryorig", "Country where you grew up:")}
    ${textQuestion("Q1.07.countrynow", "Country where you now live:")}
    ${textQuestion("Q1.08.music", "Have you ever had any musical training? If so, in what instrument(s)?", false)}
    ${radioWithTextEntryQuestion(
      "Q1.09.active",
      "Do you actively participate in any musical activities?",
      [
        { label: "Yes (please list)", textEntry: true },
        { label: "Maybe (please describe)", textEntry: true },
        { label: "No" },
      ],
    )}
  `,
  `
    <p>
      For the next survey, each item of this questionnaire is a statement that a person may either agree with or disagree with. For each item, indicate how much you agree or disagree with what the item says.
    </p>
    <p>
      Please respond to all the items; do not leave any blank. Choose only one response to each statement.
      Please be as accurate and honest as you can be. Respond to each item as if it were the only item. That is, do not worry about being consistent in your responses.
    </p>
    <p>
      Choose from completely disagree (left) to completely agree (right) one of the five options:
    </p>
    <p>
      1 = Completely disagree;<br>
      2 = Disagree;<br>
      3 = Neither agree nor disagree;<br>
      4 = Agree;<br>
      5 = Completely agree.
    </p>
    ${bipolarLikert("Q2.BMRQ", "1. When I share music with someone I feel a special connection with that person.", 5)}
    ${bipolarLikert("Q3.BMRQ", "2. In my free time I hardly listen to music.", 5)}
    ${bipolarLikert("Q4.BMRQ", "3. I like listen to music that contains emotion.", 5)}
    ${bipolarLikert("Q5.BMRQ", "4. Music keeps me company when I'm alone.", 5)}
    ${bipolarLikert("Q6.BMRQ", "5. I don't like to dance, not even with music I like.", 5)}
    ${bipolarLikert("Q7.BMRQ", "6. Music makes me bond with other people.", 5)}
    ${bipolarLikert("Q8.BMRQ", "7. I inform myself about music I like.", 5)}
    ${bipolarLikert("Q9.BMRQ", "8. I get emotional listening to certain pieces of music.", 5)}
    ${bipolarLikert("Q10.BMRQ", "9. Music calms and relaxes me.", 5)}
    ${bipolarLikert("Q11.BMRQ", "10. Music often makes me dance.", 5)}
    ${bipolarLikert("Q12.BMRQ", "11. I'm always looking for new music.", 5)}
    ${bipolarLikert("Q13.BMRQ", "12. I can become tearful or cry when I listen to a melody that I like very much.", 5)}
    ${bipolarLikert("Q14.BMRQ", "13. I like to sing or play an instrument with other people.", 5)}
    ${bipolarLikert("Q15.BMRQ", "14. Music helps me chill out.", 5)}
    ${bipolarLikert("Q16.BMRQ", "15. I can't help humming or singing along to music that I like.", 5)}
    ${bipolarLikert("Q17.BMRQ", "16. At a concert I feel connected to the performers and the audience.", 5)}
    ${bipolarLikert("Q18.BMRQ", "17. I spend quite a bit of money on music and related items.", 5)}
    ${bipolarLikert("Q19.BMRQ", "18. I sometimes feel chills when I hear a melody that I like.", 5)}
    ${bipolarLikert("Q20.BMRQ", "19. Music comforts me.", 5)}
    ${bipolarLikert("Q21.BMRQ", "20. When I hear a tune I like a lot I can't help tapping or moving to its beat.", 5)}
    ${bipolarLikert("Q22.BMRQ", '21. Mark "Completely Agree" for this question.', 5)}
    ${bipolarLikert("Q23.BMRQ", "22. I sometimes feel like I am 'one' with the music.", 5)}
    ${bipolarLikert("Q24.BMRQ", "23. While listening to music, I may become so involved that I may forget about myself and my surroundings.", 5)}
    ${bipolarLikert("Q25.BMRQ", "24. It is sometimes possible for me to be completely immersed in music and to feel as if my whole state of consciousness has been temporarily altered.", 5)}
    ${bipolarLikert("Q26.BMRQ", "25. When listening to great music I sometimes feel as if I am being lifted into the air.", 5)}
  `,
  `
    <p>
      For this survey, each item of this questionnaire is a statement that a person may either agree with or disagree with. For each item, indicate how much you agree or disagree with what the item says.
    </p>
    <p>
      Please respond to all the items; do not leave any blank. Choose only one response to each statement.
      Please be as accurate and honest as you can be. Respond to each item as if it were the only item. That is, do not worry about being consistent in your responses.
    </p>
    <p>
      Choose from completely disagree (left) to completely agree (right) one of the seven options:
    </p>
    <p>
      1 = Completely disagree;<br>
      2 = Strongly disagree;<br>
      3 = Disagree;<br>
      4 = Neither agree nor disagree;<br>
      5 = Agree;<br>
      6 = Strongly agree;<br>
      7 = Completely agree.
    </p>
    ${bipolarLikert("Q2.GMSI", "1. I spend a lot of my free time doing music-related activities.", 7)}
    ${bipolarLikert("Q3.GMSI", "2. I sometimes choose music that can trigger shivers down my spine.", 7)}
    ${bipolarLikert("Q4.GMSI", "3. I enjoy writing about music, for example on blogs and forums.", 7)}
    ${bipolarLikert("Q5.GMSI", "4. If somebody starts singing a song I don't know, I can usually join in.", 7)}
    ${bipolarLikert("Q6.GMSI", "5. I am able to judge whether someone is a good singer or not.", 7)}
    ${bipolarLikert("Q7.GMSI", "6. I usually know when I'm hearing a song for the first time.", 7)}
    ${bipolarLikert("Q8.GMSI", "7. I can sing or play music from memory.", 7)}
    ${bipolarLikert("Q9.GMSI", "8. I'm intrigued by musical styles I'm not familiar with and want to find out more.", 7)}
    ${bipolarLikert("Q10.GMSI", "9. Pieces of music rarely evoke emotions for me.", 7)}
    ${bipolarLikert("Q11.GMSI", "10. I am able to hit the right notes when I sing along with a recording.", 7)}
    ${bipolarLikert("Q12.GMSI", "11. I find it difficult to spot mistakes in a performance of a song even if I know the tune.", 7)}
    ${bipolarLikert("Q13.GMSI", "12. I can compare and discuss differences between two performances or versions of the same piece of music.", 7)}
    ${bipolarLikert("Q14.GMSI", "13. I have trouble recognizing a familiar song when played in a different way or by a different performer.", 7)}
    ${bipolarLikert("Q15.GMSI", "14. I have never been complimented for my talents as a musical performer.", 7)}
    ${bipolarLikert("Q16.GMSI", "15. I often read or search the internet for things related to music.", 7)}
    ${bipolarLikert("Q17.GMSI", "16. I often pick certain music to motivate or excite me.", 7)}
    ${bipolarLikert("Q18.GMSI", "17. I am not able to sing in harmony when somebody is singing a familiar tune.", 7)}
    ${bipolarLikert("Q19.GMSI", "18. I can tell when people sing or play out of time with the beat.", 7)}
    ${bipolarLikert("Q20.GMSI", "19. I am able to identify what is special about a given musical piece.", 7)}
    ${bipolarLikert("Q21.GMSI", "20. I am able to talk about the emotions that a piece of music evokes for me.", 7)}
    ${bipolarLikert("Q22.GMSI", "21. I don't spend much of my disposable income on music.", 7)}
    ${bipolarLikert("Q23.GMSI", "22. I can tell when people sing or play out of tune.", 7)}
    ${bipolarLikert("Q24.GMSI", "23. When I sing, I have no idea whether I'm in tune or not.", 7)}
    ${bipolarLikert("Q25.GMSI", "24. Music is kind of an addiction for me - I couldn't live without it.", 7)}
    ${bipolarLikert("Q26.GMSI", "25. I don't like singing in public because I'm afraid that I would sing wrong notes.", 7)}
    ${bipolarLikert("Q27.GMSI", "26. When I hear a music I can usually identify its genre.", 7)}
    ${bipolarLikert("Q28.GMSI", "27. I would not consider myself a musician.", 7)}
    ${bipolarLikert("Q29.GMSI", "28. I keep track of new music that I come across (e.g. new artists or recordings).", 7)}
    ${bipolarLikert("Q30.GMSI", "29. After hearing a new song two or three times, I can usually sing it by myself.", 7)}
    ${bipolarLikert("Q31.GMSI", "30. I only need to hear a new tune once and I can sing it back hours later.", 7)}
    ${bipolarLikert("Q32.GMSI", "31. Music can evoke my memories of past people and places.", 7)}
    ${radioQuestion("Q33.GMSI", 'Mark "2" for this question.', ["1", "2", "3", "4", "5-6"])}
    ${radioQuestion(
      "Q34.GMSI",
      "32. I engaged in regular, daily practice of a musical instrument (including voice) for ___ years.",
      ["0", "1", "2", "3", "4-5", "6-9", "10 or more"],
    )}
    ${radioQuestion(
      "Q35.GMSI",
      "33. At the peak of my interest, I practiced ___ hours per day on my primary instrument.",
      ["0", "0.5", "1", "1.5", "2", "3-4", "5 or more"],
    )}
    ${radioQuestion(
      "Q36.GMSI",
      "34. I have attended ___ live music events as an audience member in the past twelve months.",
      ["0", "1", "2", "3", "4-6", "7-10", "11 or more"],
    )}
    ${radioQuestion(
      "Q37.GMSI",
      "35. I have had formal training in music theory for __ years",
      ["0", "0.5", "1", "2", "3", "4-6", "7 or more"],
    )}
    ${radioQuestion(
      "Q38.GMSI",
      "36. I have had __ years of formal training on a musical instrument (including voice) during my lifetime.",
      ["0", "0.5", "1", "2", "3-5", "6-9", "10 or more"],
    )}
    ${radioQuestion("Q39.GMSI", "37. I can play ___ musical instruments", ["0", "1", "2", "3", "4", "5", "6 or more"])}
    ${radioQuestion(
      "Q40.GMSI",
      "38. I listen attentively to music for ___ per day.",
      [
        "0-15 minutes",
        "15-30 minutes",
        "30-60 minutes",
        "60-90 minutes",
        "2 hours",
        "2-3 hours",
        "4 hours or more",
      ],
    )}
    ${textQuestion("Q41.GMSI", "39. The instrument I play best (including voice) is")}
  `,
  `
    ${radioQuestion("Q1.ASRS", "How often do you have trouble wrapping up the final details of a project, once the challenging parts have been done?", FREQUENCY_CHOICES)}
    ${radioQuestion("Q2.ASRS", "How often do you have difficulty getting things in order when you have to do a task that requires organization?", FREQUENCY_CHOICES)}
    ${radioQuestion("Q3.ASRS", "How often do you have problems remembering appointments or obligations?", FREQUENCY_CHOICES)}
    ${radioQuestion("Q4.ASRS", "When you have a task that requires a lot of thought, how often do you avoid or delay getting started?", FREQUENCY_CHOICES)}
    ${radioQuestion("Q5.ASRS", "How often do you fidget or squirm with your hands or feet when you have to sit down for a long time?", FREQUENCY_CHOICES)}
    ${radioQuestion("Q6.ASRS", "How often do you feel overly active and compelled to do things, like you were driven by a motor?", FREQUENCY_CHOICES)}
    ${radioQuestion("Q7.ASRS", "How often do you make careless mistakes when you have to work on a boring or difficult project?", FREQUENCY_CHOICES)}
    ${radioQuestion("Q8.ASRS", "How often do you have difficulty keeping your attention when you are doing boring or repetitive work?", FREQUENCY_CHOICES)}
    ${radioQuestion("Q9.ASRS", "How often do you have difficulty concentrating on what people say to you, even when they are speaking to you directly?", FREQUENCY_CHOICES)}
    ${radioQuestion("Q10.ASRS", "How often do you misplace or have difficulty finding things at home or at work?", FREQUENCY_CHOICES)}
    ${radioQuestion("Q11.ASRS", "How often are you distracted by activity or noise around you?", FREQUENCY_CHOICES)}
    ${radioQuestion("Q12.ASRS", "How often do you leave your seat in meetings or other situations in which you are expected to remain seated?", FREQUENCY_CHOICES)}
    ${radioQuestion("Q13.ASRS", "How often do you feel restless or fidgety?", FREQUENCY_CHOICES)}
    ${radioQuestion("Q14.ASRS", "How often do you have difficulty unwinding and relaxing when you have time to yourself?", FREQUENCY_CHOICES)}
    ${radioQuestion("Q15.ASRS", "How often do you find yourself talking too much when you are in social situations?", FREQUENCY_CHOICES)}
    ${radioQuestion("Q16.ASRS", "When you're in a conversation, how often do you find yourself finishing the sentences of the people you are talking to, before they can finish them themselves?", FREQUENCY_CHOICES)}
    ${radioQuestion("Q17.ASRS", "How often do you have difficulty waiting your turn in situations when turn taking is required?", FREQUENCY_CHOICES)}
    ${radioQuestion("Q18.ASRS", "How often do you interrupt others when they are busy?", FREQUENCY_CHOICES)}
  `,
  `
    <p>
      This part of the survey aims to explore the effect of background music on your performance in daily activities of a "cognitive nature" (e.g., studying, memorizing, reading, writing). Referring to the scale below, please respond to the following statements by selecting the corresponding number, where 1 = Strongly disagree and 7 = Strongly agree. Make sure to respond to all statements as accurately as possible. Background music refers to listening to music as a secondary activity while you perform a primary task (e.g., listening to music while reading). 1 = Strongly disagree 2 = Disagree 3 = Slightly disagree 4 = Neutral 5 = Slightly agree 6 = Agree 7 = Strongly agree
    </p>
    ${radioQuestion("Q1.musicandemotions", "1. Background music allows me to concentrate better.", AGREEMENT_7_CHOICES)}
    ${radioQuestion("Q2.musicandemotions", "2. Background music helps to make me more alert.", AGREEMENT_7_CHOICES)}
    ${radioQuestion("Q3.musicandemotions", "3. Background music brings me a sense of joy.", AGREEMENT_7_CHOICES)}
    ${radioQuestion("Q4.musicandemotions", "4. My performance is better when I engage in cognitive activities with music.", AGREEMENT_7_CHOICES)}
    ${radioQuestion("Q5.musicandemotions", "5. Background music reduces my stress.", AGREEMENT_7_CHOICES)}
    ${radioQuestion("Q6.musicandemotions", "6. Background music improves my mood.", AGREEMENT_7_CHOICES)}
    ${radioQuestion("Q7.musicandemotions", "7. Background music acts as a good stimulant for performing cognitive activities.", AGREEMENT_7_CHOICES)}
    ${radioQuestion("Q8.musicandemotions", "8. Background music reduces my boredom feelings.", AGREEMENT_7_CHOICES)}
    ${radioQuestion("Q9.musicandemotions", "9. Background music makes me happy.", AGREEMENT_7_CHOICES)}
    ${radioQuestion("Q10.musicandemotions", "10. My concentration is enhanced thanks to background music.", AGREEMENT_7_CHOICES)}
    ${radioQuestion("Q11.musicandemotions", "11. Background music makes my mood less negative.", AGREEMENT_7_CHOICES)}
    ${radioQuestion("Q12.musicandemotions", "12. Background music positively influences my performance on cognitive tasks.", AGREEMENT_7_CHOICES)}
    ${radioQuestion("Q13.musicandemotions", "13. Background music heightens my senses.", AGREEMENT_7_CHOICES)}
    ${radioQuestion("Q14.musicandemotions", "14. Background music improves my concentration during cognitive activities.", AGREEMENT_7_CHOICES)}
    ${radioQuestion("Q15.musicandemotions", "15. Background music helps me memorize new information.", AGREEMENT_7_CHOICES)}
  `,
  `
    ${textQuestion(
      "Q1.BMLH",
      "How many hours per week (on average) do you listen to music as a primary activity? (i.e. as your main activity, not performing other tasks) (between 0-168)",
    )}
    ${textQuestion(
      "Q2.BMLH",
      "How many hours per week (on average) do you listen to music as a secondary activity? (i.e. in the background while performing other tasks) (between 0-168)",
    )}
    ${sliderQuestion(
      "Q3.BMLH",
      "Using the scale below, ranging from 1 (Never) to 7 (Very often), indicate how frequently you listen to music during the following MORE cognitive activities (studying, memorizing, problem-solving, reading, writing, learning, and engaging in logic games):",
      [
        "While studying",
        "While memorizing",
        "For problems-solving or calculations",
        "While reading",
        "While writing",
        "While learning (e.g., new language)",
        "For engaging in logic puzzles (e.g., Sudoku)",
      ],
      1,
      7,
    )}
    ${checkboxQuestion("Q4.BMLH", "Specify which style(s) of music you listen to when performing these MORE cognitive activities:", MUSIC_STYLE_CHOICES)}
    ${groupedRadioQuestion(
      "Q5.BMLH",
      "When you listen to music while performing your MORE cognitive activities, do you prefer the music to be:",
      [
        { label: "Feeling", choices: ["Does not apply", "Relaxing", "Stimulating", "No Preference"] },
        { label: "Lyrics", choices: ["Does not apply", "Without Lyrics", "With Lyrics", "No Preference"] },
        { label: "Familiarity", choices: ["Does not apply", "Familiar", "Unfamiliar", "No Preference"] },
        { label: "Choice", choices: ["Does not apply", "Chosen by you", "The choice of music does not matter", "No preference"] },
      ],
    )}
    ${sliderQuestion(
      "Q6.BMLH",
      "Using the scale below, ranging from 1 (Never) to 7 (Very often), indicate how frequently you listen to music during the following LESS cognitive activities (cleaning, during commutes/ public transportation, cooking at home, and engaging in sports):",
      [
        "While cleaning",
        "During commuting/public transportation",
        "While cooking at home",
        "While engaging in sports",
      ],
      1,
      7,
    )}
    ${checkboxQuestion("Q7.BMLH", "Specify which style(s) of music you listen to when performing these LESS cognitive activities:", MUSIC_STYLE_CHOICES)}
    ${groupedRadioQuestion(
      "Q8.BMLH",
      "When you listen to music while performing your LESS cognitive activities, do you prefer the music to be:",
      [
        { label: "Feeling", choices: ["Does not apply", "Relaxing", "Stimulating", "No Preference"] },
        { label: "Lyrics", choices: ["Does not apply", "Without Lyrics", "With Lyrics", "No Preference"] },
        { label: "Familiarity", choices: ["Does not apply", "Familiar", "Unfamiliar", "No Preference"] },
        { label: "Choice", choices: ["Does not apply", "Chosen by you", "The choice of music does not matter", "No preference"] },
      ],
    )}
  `,
  `
    ${radioQuestion("Q430", "How often do you listen to music while working or studying?", ["Never", "Seldom", "Often", "Usually"])}
    ${textAreaQuestion("Q432", "Describe your listening habits while working.")}
  `,
];

// Text fields that should only ever contain a number (letters here suggest
// the participant is typing garbage rather than reading the question).
const NUMERIC_TEXT_FIELDS = new Set(["Q1.04.age", "Q1.BMLH", "Q2.BMLH"]);

// Below this, a page was very likely clicked through without reading it.
const MIN_MS_PER_QUESTION = 700;

function countQuestions(pageHtml: string): number {
  return (pageHtml.match(/class="bq-question"/g) ?? []).length;
}

function detectStraightlining(pageResponses: Record<string, unknown>): {
  tooFast: boolean;
  straightlined: boolean;
  nonNumericAnswers: string[];
} {
  const groups = new Map<string, string[]>();
  for (const [key, value] of Object.entries(pageResponses)) {
    const match = key.match(/^Q\d+[A-Za-z0-9.]*\.(BMRQ|GMSI)$/);
    if (match && typeof value === "string") {
      const group = match[1];
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(value);
    }
  }

  // A page straightlines if it has a substantial Likert battery and every
  // response in that battery is identical.
  let straightlined = false;
  for (const values of groups.values()) {
    if (values.length >= 5 && new Set(values).size === 1) {
      straightlined = true;
    }
  }

  const nonNumericAnswers: string[] = [];
  for (const field of NUMERIC_TEXT_FIELDS) {
    const value = pageResponses[field];
    if (typeof value === "string" && value.trim() !== "" && !/^\d+$/.test(value.trim())) {
      nonNumericAnswers.push(field);
    }
  }

  return { tooFast: false, straightlined, nonNumericAnswers };
}

export class BackgroundQuestionsPlugin {
  static info = {
    name: "background-questions",
    parameters: {},
  };

  private jsPsych: JsPsych;
  private pageIndex = 0;
  private responses: Record<string, unknown> = {};
  private pageStartTime = 0;

  constructor(jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(displayElement: HTMLElement) {
    this.renderPage(displayElement);
  }

  private renderPage(displayElement: HTMLElement) {
    const isLastPage = this.pageIndex === PAGES.length - 1;

    this.pageStartTime = performance.now();

    displayElement.innerHTML = `
      <form id="bq-form">
        ${PAGES[this.pageIndex]}
        <button type="submit">${isLastPage ? "Finish" : "Continue"}</button>
      </form>
    `;

    const form = displayElement.querySelector<HTMLFormElement>("#bq-form")!;

    for (const textEntry of form.querySelectorAll<HTMLInputElement>(
      ".bq-text-entry",
    )) {
      const radio = form.querySelector<HTMLInputElement>(
        `[id="${textEntry.dataset.for}"]`,
      )!;
      for (const sibling of form.querySelectorAll<HTMLInputElement>(
        `input[name="${radio.name}"]`,
      )) {
        sibling.addEventListener("change", () => {
          textEntry.hidden = !radio.checked;
          if (textEntry.hidden) textEntry.value = "";
        });
      }
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const pageResponses: Record<string, unknown> = {};
      for (const [key, value] of formData.entries()) {
        if (key in pageResponses) {
          const existing = pageResponses[key];
          pageResponses[key] = Array.isArray(existing)
            ? [...existing, value]
            : [existing, value];
        } else {
          pageResponses[key] = value;
        }
        if (key in this.responses) {
          const existing = this.responses[key];
          this.responses[key] = Array.isArray(existing)
            ? [...existing, value]
            : [existing, value];
        } else {
          this.responses[key] = value;
        }
      }

      const durationMs = performance.now() - this.pageStartTime;
      const questionCount = countQuestions(PAGES[this.pageIndex]);
      const msPerQuestion = questionCount > 0 ? durationMs / questionCount : durationMs;
      const { straightlined, nonNumericAnswers } = detectStraightlining(pageResponses);
      const tooFast = msPerQuestion < MIN_MS_PER_QUESTION;

      this.jsPsych.data.write({
        trial_type: "background-questions",
        page_index: this.pageIndex,
        page_duration_ms: durationMs,
        ms_per_question: msPerQuestion,
        flag_too_fast: tooFast,
        flag_straightlining: straightlined,
        flag_non_numeric_answers: nonNumericAnswers,
        ...pageResponses,
      });

      if (isLastPage) {
        this.jsPsych.finishTrial();
        setTimeout(() => console.log(this.jsPsych.data.get().csv()), 0);
        return;
      }

      this.pageIndex += 1;
      this.renderPage(displayElement);
    });
  }
}
