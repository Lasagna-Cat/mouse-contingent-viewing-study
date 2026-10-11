/* ======================================================================
 * CONFIGURATION -- the values you're most likely to want to change.
 * Everything that talks to DataPipe lives in ONE place (the `extensions`
 * block inside initJsPsych below) so switching storage providers later
 * -- Zenodo to a different DataPipe provider, or off DataPipe entirely to
 * your own server -- means editing that one block, not the rest of the file.
 * ==================================================================== */
const DATAPIPE_EXPERIMENT_ID = "YgWLJd47aJRp"; // from pipe.jspsych.org, after connecting Zenodo
const REVEAL_RADIUS_PX = 90;    // radius of the sharp "spotlight" circle, in px
const BLUR_AMOUNT_PX = 18;      // blur strength applied to the rest of the image, in px
const IMAGE_CONTAINER_W = 700;  // fixed display size for every image --
const IMAGE_CONTAINER_H = 500;  // keep this constant across trials/participants so that
                                 // mouse coordinates are comparable across the whole dataset
const RANDOMIZE_ITEM_ORDER = true;

/* ====================================================================== */

function generateParticipantId(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
const PARTICIPANT_ID = generateParticipantId();

const jsPsych = initJsPsych({
  extensions: [
    {
      // --- DataPipe/Zenodo save step. This is the one block to change if
      // you ever swap storage providers. ---
      type: jsPsychExtensionPipe,
      params: {
        experiment_id: DATAPIPE_EXPERIMENT_ID,
        filename: () => `${PARTICIPANT_ID}.json`,
        // JSON, not CSV: the mouse-tracking path is a nested array per
        // trial, which does not flatten cleanly into CSV rows.
        format: "json"
      }
    }
  ],
  on_finish: () => {
    // Local backup download in the participant's own browser, in case the
    // network save to DataPipe failed partway through a session. Safe to
    // leave in for a live study -- it just adds one extra file download
    // alongside the DataPipe upload, as a safety net against lost data.
    jsPsych.data.get().localSave("json", `${PARTICIPANT_ID}_backup.json`);
    document.body.innerHTML = `
      <div class="debrief-text">
        <h2>Session complete</h2>
        <p>Thank you for participating. You may now close this window.</p>
      </div>`;
  }
});

/* ---------------------------------------------------------------------
 * Fixed screens
 * ------------------------------------------------------------------- */

const preload = {
  type: jsPsychPreload,
  images: STIMULI.map((s) => s.image)
};

const consent = {
  type: jsPsychHtmlButtonResponse,
  stimulus: CONSENT_HTML,
  choices: ["I consent to participate"],
  data: { trial_phase: "consent" }
};

const instructions = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: INSTRUCTIONS_HTML + "<p><em>Press any key to begin.</em></p>",
  data: { trial_phase: "instructions" }
};

const debrief = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: DEBRIEF_HTML + "<p><em>Press any key to finish.</em></p>",
  data: { trial_phase: "debrief" }
};

/* ---------------------------------------------------------------------
 * One practice item (always the same, not randomized, not saved to the
 * main item set) so participants get used to the controls before the
 * real trials start.
 * ------------------------------------------------------------------- */

const practice_question = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus:
    '<div class="question-prompt"><p>(Practice) Try revealing the image with your mouse, ' +
    "then answer anything to continue.</p><p><em>Press Enter when you are ready to view the image.</em></p></div>",
  choices: ["Enter"],
  data: { trial_phase: "practice_question", item_id: "practice" }
};

const practice_image = {
  type: ImageRevealPlugin,
  image: STIMULI[0].image,
  item_id: "practice",
  reveal_radius: REVEAL_RADIUS_PX,
  blur_amount: BLUR_AMOUNT_PX,
  container_width: IMAGE_CONTAINER_W,
  container_height: IMAGE_CONTAINER_H,
  data: { trial_phase: "practice_image_view", item_id: "practice" }
};

const practice_response = {
  type: jsPsychSurveyText,
  questions: [{ prompt: "(Practice) Type anything and submit.", name: "answer", rows: 4, required: true }],
  button_label: "Submit",
  data: { trial_phase: "practice_response", item_id: "practice" }
};

/* ---------------------------------------------------------------------
 * Main trial loop: one (question -> image view -> response) sequence per
 * item, built once as a template and repeated over STIMULI via
 * timeline_variables. randomize_order shuffles the ITEM order; the
 * question -> image -> response order within an item always stays fixed.
 *
 * Every trial carries the `extensions: [{ type: jsPsychExtensionPipe }]`
 * entry, which is what makes that trial's row stream to DataPipe as soon
 * as the trial finishes (rather than only at the very end of the session).
 * ------------------------------------------------------------------- */

const item_question_trial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function () {
    const q = jsPsych.evaluateTimelineVariable("question");
    return `<div class="question-prompt"><p>${q}</p><p><em>Press Enter when you are ready to view the image.</em></p></div>`;
  },
  choices: ["Enter"],
  data: { trial_phase: "question", item_id: jsPsych.timelineVariable("item_id") },
  extensions: [{ type: jsPsychExtensionPipe }]
};

const item_image_trial = {
  type: ImageRevealPlugin,
  image: jsPsych.timelineVariable("image"),
  item_id: jsPsych.timelineVariable("item_id"),
  reveal_radius: REVEAL_RADIUS_PX,
  blur_amount: BLUR_AMOUNT_PX,
  container_width: IMAGE_CONTAINER_W,
  container_height: IMAGE_CONTAINER_H,
  data: { trial_phase: "image_view", item_id: jsPsych.timelineVariable("item_id") },
  extensions: [{ type: jsPsychExtensionPipe }]
};

const item_response_trial = {
  type: jsPsychSurveyText,
  questions: function () {
    const q = jsPsych.evaluateTimelineVariable("question");
    return [{ prompt: q, name: "answer", rows: 4, required: true }];
  },
  button_label: "Submit",
  data: { trial_phase: "response", item_id: jsPsych.timelineVariable("item_id") },
  extensions: [{ type: jsPsychExtensionPipe }]
};

const main_timeline = {
  timeline: [item_question_trial, item_image_trial, item_response_trial],
  timeline_variables: STIMULI,
  randomize_order: RANDOMIZE_ITEM_ORDER
};

/* ---------------------------------------------------------------------
 * Run it
 * ------------------------------------------------------------------- */

const timeline = [
  preload,
  consent,
  instructions,
  practice_question,
  practice_image,
  practice_response,
  main_timeline,
  debrief
];

jsPsych.run(timeline);
