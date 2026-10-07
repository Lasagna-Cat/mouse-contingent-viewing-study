/**
 * Placeholder stimulus set + placeholder consent/instructions/debrief text.
 *
 * SWAP THIS FILE for your real study content:
 *   - Replace the 4 entries in STIMULI with your 40 (item_id, image, question) rows.
 *     item_id should be a short, stable identifier (not re-used across items) --
 *     it is what ties a participant's question/image-view/response trials
 *     together in the exported data.
 *   - Replace CONSENT_HTML / INSTRUCTIONS_HTML / DEBRIEF_HTML with your real,
 *     IRB/ethics-approved text.
 */

const STIMULI = [
  { item_id: "item_01", image: "./mscoco/0.jpg", question: "What is the main object shown in this image?" },
  { item_id: "item_02", image: "./mscoco/1.jpg", question: "How many distinct shapes can you count?" },
  { item_id: "item_03", image: "./mscoco/2.jpg", question: "What color dominates the right half of the image?" },
  { item_id: "item_04", image: "./mscoco/3.jpg", question: "Describe anything unusual you notice." }
];

const CONSENT_HTML = `
  <div class="consent-text">
    <h2>Informed Consent</h2>
    <p>[Placeholder -- replace with your IRB/ethics-board-approved consent text: the
    purpose of the study, what participation involves, roughly how long it takes,
    the voluntary nature of participation and the right to withdraw at any time,
    how and where your data will be stored and for how long, and contact details
    for the researcher and the ethics board.]</p>
  </div>
`;

const INSTRUCTIONS_HTML = `
  <div class="consent-text">
    <h2>Instructions</h2>
    <p>In this study you will see a series of images, each preceded by a question.</p>
    <p>Read the question, then press <strong>Enter</strong> to see the image. The image
    will start out blurred -- move your mouse over it to reveal the area under your
    cursor. When you are done looking, press <strong>Enter</strong> again, then type
    and submit your answer.</p>
    <p>We will start with one practice item so you can get used to the controls.</p>
  </div>
`;

const DEBRIEF_HTML = `
  <div class="debrief-text">
    <h2>Thank you</h2>
    <p>[Placeholder -- replace with your debrief text: the study's real purpose if it
    was disguised during the task, contact details, and how to withdraw your data
    after the fact if your ethics approval allows it.]</p>
  </div>
`;
