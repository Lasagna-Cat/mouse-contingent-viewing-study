/**
 * Custom jsPsych plugin: image-reveal
 * ------------------------------------
 * Shows a blurred image. Moving the mouse over it reveals a hard-edged
 * circular "spotlight" of the sharp image under the cursor; moving the
 * mouse away re-blurs that area. Logs the mouse path (sampled once per
 * animation frame, not on every raw mousemove event, to keep the file
 * size sane) and finishes the trial when the participant presses Enter.
 *
 * This is a plain script-tag plugin (no build step): it defines a class
 * in global scope and attaches it to `window` so it can be referenced
 * directly as a trial `type` elsewhere, e.g. `type: ImageRevealPlugin`.
 *
 * Trial parameters (all required unless noted):
 *   image            - path to the image file
 *   item_id          - your own identifier for this item, carried into the trial data
 *   reveal_radius    - [optional, default 90] radius in px of the sharp "spotlight" circle
 *   blur_amount      - [optional, default 18] blur strength in px applied to the rest of the image
 *   container_width  - [optional, default 700] fixed display width in px
 *   container_height - [optional, default 500] fixed display height in px
 *   min_view_time    - [optional, default 0] milliseconds before Enter is accepted,
 *                       in case you want to stop people racing through without looking
 *
 * Trial data recorded:
 *   image, item_id, view_duration_ms, n_mouse_samples,
 *   mouse_path (JSON string of [{x, y, t, inside}, ...]),
 *   reveal_radius_px, blur_amount_px
 */
class ImageRevealPlugin {
  constructor(jsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(display_element, trial) {
    const revealRadius = trial.reveal_radius ?? 90;
    const blurAmount = trial.blur_amount ?? 18;
    const containerW = trial.container_width ?? 700;
    const containerH = trial.container_height ?? 500;
    const minViewMs = trial.min_view_time ?? 0;

    const startTime = performance.now();
    const path = [];
    let latestSample = null;
    let rafId = null;

    display_element.innerHTML = `
      <div class="reveal-wrap">
        <div class="reveal-container" id="reveal-container" style="width:${containerW}px;height:${containerH}px;">
          <img class="reveal-img reveal-img-blur" src="${trial.image}" style="filter: blur(${blurAmount}px);">
          <img class="reveal-img reveal-img-sharp" id="reveal-sharp" src="${trial.image}" style="clip-path: circle(0px at -9999px -9999px);">
        </div>
        <p class="reveal-instructions">Move your mouse over the image to reveal it. Press <strong>Enter</strong> when you are done viewing.</p>
      </div>
    `;

    const container = display_element.querySelector("#reveal-container");
    const sharpLayer = display_element.querySelector("#reveal-sharp");

    const setClip = (x, y) => {
      sharpLayer.style.clipPath = `circle(${revealRadius}px at ${x}px ${y}px)`;
    };

    const onMouseMove = (e) => {
      const r = container.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
      latestSample = { x: Math.round(x), y: Math.round(y), t: Math.round(performance.now() - startTime), inside };
      if (inside) setClip(x, y);
    };

    const onMouseLeave = () => {
      setClip(-9999, -9999);
      latestSample = { x: null, y: null, t: Math.round(performance.now() - startTime), inside: false };
    };

    // Sample the latest mouse position once per animation frame rather than
    // logging every raw mousemove event -- this caps the log at roughly the
    // display's refresh rate, which is plenty of resolution for analysis
    // without the file size exploding on long trials.
    const sampleLoop = () => {
      if (latestSample) {
        path.push(latestSample);
        latestSample = null;
      }
      rafId = requestAnimationFrame(sampleLoop);
    };
    rafId = requestAnimationFrame(sampleLoop);

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);

    const onKeyDown = (e) => {
      if (e.key === "Enter" && performance.now() - startTime >= minViewMs) {
        endTrial();
      }
    };
    // Register the listener on the next tick, not immediately. If we
    // attach it synchronously, it can end up catching the very same Enter
    // keypress that just ended the PREVIOUS trial (jsPsych transitions
    // trials synchronously inside that keydown's own event handling), so
    // the image would flash and disappear instantly. Deferring by one
    // tick guarantees it only reacts to a genuinely new keypress.
    setTimeout(() => document.addEventListener("keydown", onKeyDown), 0);

    const endTrial = () => {
      cancelAnimationFrame(rafId);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("keydown", onKeyDown);

      const data = {
        image: trial.image,
        item_id: trial.item_id,
        view_duration_ms: Math.round(performance.now() - startTime),
        n_mouse_samples: path.length,
        mouse_path: JSON.stringify(path),
        reveal_radius_px: revealRadius,
        blur_amount_px: blurAmount
      };

      display_element.innerHTML = "";
      this.jsPsych.finishTrial(data);
    };
  }
}

// NOTE: parameters must be declared here, with real types, for jsPsych to
// auto-resolve `jsPsych.timelineVariable(...)` markers passed into them --
// an UNDECLARED parameter is passed through to trial() completely as-is
// (still the raw lazy-marker object, not its value), which silently breaks
// anything that reads it. `jsPsychModule` is the global jsPsych core exposes
// on the page (the same one official @jspsych/plugin-* packages read
// ParameterType from) -- it must be loaded via its <script> tag before this
// file for the reference below to resolve.
ImageRevealPlugin.info = {
  name: "image-reveal",
  version: "1.0.0",
  parameters: {
    image: { type: jsPsychModule.ParameterType.IMAGE, default: undefined },
    item_id: { type: jsPsychModule.ParameterType.STRING, default: undefined },
    reveal_radius: { type: jsPsychModule.ParameterType.INT, default: 90 },
    blur_amount: { type: jsPsychModule.ParameterType.INT, default: 18 },
    container_width: { type: jsPsychModule.ParameterType.INT, default: 700 },
    container_height: { type: jsPsychModule.ParameterType.INT, default: 500 },
    min_view_time: { type: jsPsychModule.ParameterType.INT, default: 0 }
  },
  data: {
    image: { type: jsPsychModule.ParameterType.STRING },
    item_id: { type: jsPsychModule.ParameterType.STRING },
    view_duration_ms: { type: jsPsychModule.ParameterType.INT },
    n_mouse_samples: { type: jsPsychModule.ParameterType.INT },
    mouse_path: { type: jsPsychModule.ParameterType.STRING },
    reveal_radius_px: { type: jsPsychModule.ParameterType.INT },
    blur_amount_px: { type: jsPsychModule.ParameterType.INT }
  }
};

window.ImageRevealPlugin = ImageRevealPlugin;
