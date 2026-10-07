# Mouse-tracking image reveal study -- scaffold

A jsPsych experiment: for each item, participants read a question, press
Enter to view an image that starts blurred and reveals a hard-edged circle
around the cursor as they move the mouse over it, press Enter again, then
type and submit their answer. Repeats for every item, then saves data via
DataPipe to Zenodo.

This is a working scaffold with 4 placeholder image/question pairs, not
your real 40-item study. Treat it as a base to extend, not a finished
deliverable.

## Try it locally

Just open `index.html` in a browser -- no build step, no server needed for
a local try-out (though see "Hosting" below for actually running the
study with real participants).

## Before running a real session, you need to:

1. **Connect Zenodo to DataPipe and get an experiment ID.**
   Go to <https://pipe.jspsych.org/admin> -> "New Experiment" -> choose
   Zenodo as the storage provider -> create the experiment. Copy the
   experiment ID it gives you into `DATAPIPE_EXPERIMENT_ID` at the top of
   `js/experiment.js`.

2. **Replace the placeholder stimuli.**
   Edit `js/stimuli.js`: replace the 4 entries in `STIMULI` with your real
   40 `{ item_id, image, question }` rows, and drop your real image files
   into `images/`. Keep `item_id` short and unique -- it's what ties a
   participant's question / image-view / response trials together in the
   exported data, so don't reuse an id across items.

3. **Replace the placeholder consent, instructions, and debrief text**
   in `js/stimuli.js` (`CONSENT_HTML`, `INSTRUCTIONS_HTML`, `DEBRIEF_HTML`)
   with your real, ethics-board-approved wording.

4. **Decide on the reveal parameters.**
   `REVEAL_RADIUS_PX`, `BLUR_AMOUNT_PX`, `IMAGE_CONTAINER_W/H` are at the
   top of `js/experiment.js`. The container size is deliberately fixed
   (not responsive) so that mouse coordinates mean the same thing across
   every participant's browser window -- don't make it responsive without
   thinking through what that does to your analysis.

## What's already wired up

- **Trial sequence per item**: question (press Enter) -> blurred image
  with mouse reveal (press Enter) -> text response (type + Submit).
  Built once as a template (`item_question_trial`, `item_image_trial`,
  `item_response_trial` in `js/experiment.js`) and repeated over your
  `STIMULI` array via jsPsych's `timeline_variables`.
- **Item order randomization** -- `RANDOMIZE_ITEM_ORDER` (shuffles which
  item comes in which position; the question -> image -> response order
  *within* an item is always fixed). This is a simple shuffle, not full
  counterbalancing -- if your design needs counterbalanced orders across
  participants (e.g. Latin square), that needs more structure than this
  scaffold has; ask if you want that built in.
- **One practice item** before the real trials, using the same mechanics,
  not included in the saved main-item data.
- **Image preloading** (`jsPsychPreload`) so the first mouse movement on
  trial 1 isn't laggy while the browser is still fetching the image.
- **Mouse-tracking data**: the custom plugin in
  `js/jspsych-plugin-image-reveal.js` logs `{x, y, t, inside}` once per
  animation frame (capped at the display's refresh rate, not logged on
  every raw browser mousemove event) for the whole image-viewing trial,
  plus `view_duration_ms` and `n_mouse_samples`. It's stored per trial as
  a JSON string in the `mouse_path` field.
- **DataPipe integration** via `@jspsych/extension-pipe`, registered once
  in `initJsPsych(...)` in `js/experiment.js`. Each trial that includes
  `extensions: [{ type: jsPsychExtensionPipe }]` streams its data to
  DataPipe (and on to Zenodo) as soon as that trial finishes, not only at
  the very end of the session -- so a participant closing the tab partway
  through doesn't lose everything.
- **Local backup download**: `on_finish` in `initJsPsych(...)` also
  triggers a local JSON download in the participant's own browser, as a
  safety net in case the network save failed partway through.
- **Data format is JSON, not CSV** (`format: "json"` in the extension
  config) because the mouse path is a nested array per trial, which
  doesn't flatten cleanly into CSV rows.

## Swapping storage providers later

Everything that talks to DataPipe lives in one place: the `extensions`
block inside `initJsPsych({...})` near the top of `js/experiment.js`. If
you ever need to move off DataPipe/Zenodo entirely (e.g. to a university
server), that block is what changes -- replace it with your own
`on_finish`/per-trial save call, and the rest of the experiment (timeline,
plugin, stimuli) doesn't need to change.

## Hosting for real participants

This is a static site (HTML/CSS/JS + images, no backend of your own) --
upload the whole folder as-is to GitHub Pages, your university's web
space, or similar static hosting. The DataPipe extension's own network
call handles getting data to Zenodo; you don't need a backend for that
part.

## Known simplifications in this scaffold (worth revisiting before a real study)

- No attention checks.
- No completion-code screen for participant-recruitment platforms
  (Prolific/MTurk/SONA) -- add one to `debrief` if you need it.
- Item order is randomized but not counterbalanced across participants.
- No handling of touch devices (mouse-only interaction, as the mechanic
  implies) -- worth an explicit note in your consent/instructions if you
  recruit on a platform where some participants might be on mobile.
