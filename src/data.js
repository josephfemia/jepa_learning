/* Module-scope course data — pure data, no React and no theme references.
   Colors are stored as palette KEY STRINGS ("cyan", "violet", …) and resolved
   against the live theme with C[key] inside the components that render them. */

/* Section nav order + scroll anchors. */
export const SECTIONS = [
  { id: "idea", label: "The Idea" },
  { id: "why", label: "Why Latent" },
  { id: "build", label: "Architecture" },
  { id: "collapse", label: "Collapse" },
  { id: "depth", label: "Under the Hood" },
  { id: "compare", label: "Vs Others" },
  { id: "history", label: "History" },
  { id: "models", label: "The Models" },
  { id: "worldmodels", label: "World Models" },
  { id: "recap", label: "Recap" },
];

// which completion key (in the `done` map) marks each section "done" — drives the
// nav checkmarks. Sections gain a check once their self-test (predict-first guess,
// recall prompt, or final quiz) is answered.
export const SECTION_CHECK = {
  idea: "g1", collapse: "g2", compare: "r-compare", history: "r-history",
  models: "g3", worldmodels: "r-worldmodels", recap: "quiz",
};

/* Discovery timeline — each step's problem motivates the next idea. */
export const TIMELINE = [
  { yr: "1980s–2006", t: "Energy-based models & Siamese nets", problem: "How do you score whether two things are compatible without a fragile probability over everything?",
    idea: "LeCun's energy-based learning: a scalar energy, low for compatible pairs. Two-branch Siamese nets encode and compare. JEPA's DNA: energy = prediction error between two encoders." , c: "violet" },
  { yr: "2018", t: "Contrastive Predictive Coding", problem: "Reconstructing raw future data is wasteful and hard.",
    idea: "Predict future latent codes from past context. The seed of 'predict the representation, not the data' — though still reliant on contrastive negatives.", c: "violet" },
  { yr: "2018", t: "World Models (Ha & Schmidhuber)", problem: "Agents that learn only by trial in the real world are painfully slow.",
    idea: "Compress observations to a latent, learn to predict the next latent, then plan — even 'dream' — inside the learned model. Planning in latent space becomes concrete.", c: "cyan" },
  { yr: "2020–21", t: "BYOL · SimSiam · VICReg", problem: "Contrastive learning needs huge batches of negatives. Can we drop them?",
    idea: "Yes — via EMA teachers + stop-gradients, or explicit variance/covariance regularization. Exactly the anti-collapse machinery JEPA will adopt.", c: "cyan" },
  { yr: "Jun 2022", t: "A Path Towards Autonomous Machine Intelligence", problem: "LLMs manipulate text statistics but, in LeCun's view, are far weaker at modeling physical reality, planning over sensory futures, and handling uncertainty.",
    idea: "A six-module agent (perception, world model, cost, actor…) with a Hierarchical JEPA as the world-model engine. The manifesto.", c: "amber" },
  { yr: "2023→2026", t: "I-JEPA → V-JEPA → V-JEPA 2 → LeJEPA → LeWorldModel", problem: "Does the blueprint actually work — and can it become a stable world model?",
    idea: "Images, then video, then a video world model planning real robots zero-shot, then LeJEPA's provable training objective — culminating in LeWorldModel, a stable end-to-end latent world model from pixels. The same year, LeCun leaves Meta to found AMI Labs around this exact bet.", c: "cyan" },
];

/* The JEPA family deep dives. */
export const MODELS = [
  { id: "ijepa", name: "I-JEPA", year: "2023", domain: "Images", pill: "first real JEPA",
    blurb: "The first working JEPA. Two Vision Transformers operating on fixed image patches plus a narrow predictor. From one image it picks a context block and several large target blocks, predicting each target's representation from context — conditioned on position.",
    why: "Large semantic target blocks force the model to capture high-level structure instead of interpolating texture. More compute-efficient than MAE or contrastive methods, and needs no hand-crafted augmentations.",
    stats: [["3", "networks"], ["ViT-H/14", "14×14 patches"], ["EMA", "no negatives"]] },
  { id: "vjepa", name: "V-JEPA", year: "2024", domain: "Video", pill: "adds time",
    blurb: "The template extended to spacetime. Clips are tokenized into space-time blocks; large tube regions are masked; the predictor infers their embeddings from visible context, with an EMA target encoder.",
    why: "Latent prediction matters even more for video — there are explosively many plausible pixel futures, but how a scene evolves abstractly is tractable. Learns transferable motion + appearance features.",
    stats: [["3D", "spacetime masking"], ["frozen", "backbone probed"], ["0 pixels", "pure latent loss"]] },
  { id: "vjepa2", name: "V-JEPA 2", year: "Jun 2025", domain: "Video world model + robotics", pill: "world model",
    blurb: "Two-stage. (1) Action-free pretraining of a billion-parameter ViT-g encoder on VideoMix22M (1M+ hours of internet video), using mask-denoising and 3D rotary position embeddings to predict masked future representations. (2) Action-conditioned post-training (V-JEPA 2-AC): freeze the encoder, train a 24-layer predictor that takes the current latent state + a 7-DoF robot action and predicts the next latent — from <62h of DROID robot video.",
    why: "Given a goal image, the robot plans by Model-Predictive Control: imagine the latent consequences of candidate action sequences, score each by the L1 distance to the goal embedding, execute the first action, then re-plan. The optimizer is the Cross-Entropy Method. Zero-shot pick-and-place on Franka arms in two unseen labs — no task rewards, ~16 sec per action vs ~4 min for the diffusion-based Cosmos baseline (≈15× faster).",
    stats: [["1M+ h", "internet video"], ["62 h", "robot data"], ["0-shot", "new labs"], ["~15×", "faster vs Cosmos"]] },
  { id: "lejepa", name: "LeJEPA", year: "Nov 2025", domain: "Theory + method", pill: "the principled rewrite",
    blurb: "Removes heuristics instead of adding them. Proves an isotropic Gaussian is the unique embedding distribution minimizing worst-case downstream risk; enforces it with SIGReg (checks Gaussianity along random 1-D projections, linear cost); combines with latent prediction into a one-hyperparameter objective.",
    why: "No EMA, no stop-gradient, no teacher–student asymmetry — yet stable, collapse-free training across architectures. Turns JEPA from an empirical recipe into a method with provable guarantees, right as the field pivots to world models.",
    stats: [["N(0,I)", "provably optimal"], ["SIGReg", "linear cost"], ["1", "hyperparameter"]] },
  { id: "lewm", name: "LeWorldModel", year: "Mar 2026", domain: "Latent world model from pixels", pill: "the synthesis",
    blurb: "An action-conditioned world model trained end-to-end from raw pixels with a two-term objective: next-embedding prediction + SIGReg. No pixel reconstruction, no reward, no frozen encoder, no EMA or stop-gradient. A ViT-Tiny encoder (~5M params) maps each frame to a single 192-dim token; a small predictor models the dynamics — about 15M parameters in total.",
    why: "Brings LeJEPA's provable anti-collapse to world modeling, finally making end-to-end pixel training stable and simple — one effective hyperparameter where prior end-to-end methods (PLDM) needed seven loss terms. Plans via CEM from start+goal images in ~1s (≈48× faster than DINO-WM), trains on a single GPU in hours. The model that ties the whole program together.",
    stats: [["~15M", "params (total)"], ["2", "loss terms"], ["~1s", "to plan"], ["48×", "faster than DINO-WM"]] },
];

/* Click-to-expand key terms. */
export const GLOSSARY = [
  ["Embedding / representation", "A vector of numbers a network produces to describe an input. After training, directions in this space carry meaning (object identity, motion, etc.)."],
  ["Latent space", "The abstract space where embeddings live. 'Predicting in latent space' = predicting these vectors instead of raw pixels or tokens."],
  ["Context / target", "Context is the visible part of an input; target is the hidden part whose representation the model must predict."],
  ["Predictor", "The network that maps the context embedding (plus target position, and optionally an action or latent z) to a predicted target embedding. Becomes the world model."],
  ["EMA target encoder", "A 'teacher' whose weights are an exponential moving average of the trained 'student' encoder, with gradients stopped. Provides stable targets and fights collapse."],
  ["Representation collapse", "The failure where the encoder maps everything to the same (or a low-dimensional) embedding, making prediction trivial and the features useless."],
  ["VICReg", "Variance–Invariance–Covariance Regularization (Bardes, Ponce & LeCun 2022): three loss terms that keep embeddings spread out and decorrelated to prevent collapse."],
  ["Energy-Based Model (EBM)", "A model that scores compatibility with a scalar 'energy' (low = compatible). JEPA's energy is prediction error in embedding space."],
  ["Latent variable z", "An extra input to the predictor representing information about the target not in the context — i.e. residual uncertainty / multiple valid futures."],
  ["World model", "An internal simulator that predicts how states evolve, optionally given actions. JEPA's predictor, action-conditioned, is one. You plan by searching it instead of acting in the real world."],
  ["Frozen vs end-to-end", "Two ways to avoid collapse in a world model: freeze a pretrained encoder (DINO-WM — safe, but inherited features) or train the encoder jointly (PLDM, LeWM — powerful, but needs anti-collapse machinery)."],
  ["LeWorldModel (LeWM)", "2026 JEPA world model (LeCun, Balestriero et al.): action-conditioned, end-to-end from pixels, two-term loss (prediction + SIGReg), ~15M params, plans ~48× faster than DINO-WM. The synthesis of the whole program."],
  ["AMI Labs", "Advanced Machine Intelligence — LeCun's Paris startup (founded Dec 2025) built on the world-model bet rather than LLMs; raised a ~$1B seed in early 2026."],
  ["MPC / CEM", "Model-Predictive Control: plan by searching for action sequences that reach a goal, execute one, re-plan. The Cross-Entropy Method is the sampling-based optimizer used."],
  ["SIGReg / LeJEPA", "Sketched Isotropic Gaussian Regularization: a 2025 regularizer that pushes embeddings toward an isotropic Gaussian — provably optimal — removing EMA/stop-gradient heuristics."],
];

/* World-model landscape comparison. */
export const WORLD_MODELS = [
  { id: "dinowm", name: "DINO-WM", who: "Zhou et al., 2024", color: "violet",
    encoder: "Frozen DINOv2 (pretrained)", collapse: "Sidesteps it — encoder isn't trained, so it can't collapse",
    loss: "Predictor-only objective", plan: "CEM in latent space (slower — many patch tokens)",
    note: "Proved a reward-free, task-agnostic world model on frozen self-supervised features can plan zero-shot. But you inherit whatever DINOv2 encodes — you can't shape the representation for your task." },
  { id: "pldm", name: "PLDM", who: "Sobal et al., 2025", color: "amber",
    encoder: "Trained end-to-end from pixels", collapse: "VICReg-derived — seven loss terms (spatial/temporal variance & covariance, inverse dynamics…)",
    loss: "~7 terms, many coefficients to tune", plan: "CEM in latent space",
    note: "Brought the JEPA recipe back to fully end-to-end pixel world modeling — but training was fragile and required a big coefficient search." },
  { id: "vjepa2", name: "V-JEPA 2-AC", who: "Assran et al., 2025", color: "cyan",
    encoder: "Frozen V-JEPA 2 (web-scale pretrain)", collapse: "EMA + stop-gradient (during pretraining)",
    loss: "Latent prediction + action conditioning", plan: "CEM / MPC, ~16s per action on a Franka arm",
    note: "Scaled the idea to 1M+ hours of video, then made it controllable with 62h of robot data. The big-model, web-scale end of the spectrum." },
  { id: "lewm", name: "LeWorldModel", who: "Maes, …, LeCun, Balestriero · Mar 2026", color: "green",
    encoder: "Trained end-to-end from pixels (ViT-Tiny ~5M; ~15M params total)", collapse: "SIGReg — one regularizer, no EMA, no stop-gradient, no frozen encoder",
    loss: "Two terms: next-embedding prediction + SIGReg (effectively one hyperparameter, λ)", plan: "CEM from start+goal images, ~1s (≈48× faster than DINO-WM, ~200× fewer tokens)",
    note: "The synthesis: end-to-end from pixels like PLDM, but stable and simple like a frozen-encoder method — because SIGReg's provably-optimal Gaussian target replaces the whole bag of tricks. Trains on a single GPU in hours." },
];
