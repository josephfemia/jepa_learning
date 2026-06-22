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
  { id: "depth2", label: "Frontier & Eval" },
  { id: "compare", label: "Vs Others" },
  { id: "history", label: "History" },
  { id: "models", label: "The Models" },
  { id: "worldmodels", label: "World Models" },
  { id: "recap", label: "Recap" },
];

/* Paginated-lecture nav (robotic_learning style): a welcome page, then the eleven
   lectures grouped into a sidebar. PAGES is the linear prev/next order. */
export const START = { id: "start", label: "Start here" };

export const NAV_GROUPS = [
  { header: "Orientation", items: ["start"] },
  { header: "The core idea", items: ["idea", "why", "build", "collapse"] },
  { header: "Under the hood", items: ["depth", "depth2"] },
  { header: "In context", items: ["compare", "history"] },
  { header: "The frontier", items: ["models", "worldmodels"] },
  { header: "Lock it in", items: ["recap"] },
];

// linear order for the prev/next pager and "jump to next unfinished"
export const PAGES = ["start", ...SECTIONS.map((s) => s.id)];

// id → short sidebar/topbar label (start + the eleven lectures)
export const PAGE_LABEL = { start: START.label, ...Object.fromEntries(SECTIONS.map((s) => [s.id, s.label])) };

// which completion key (in the `done` map) marks each section "done" — drives the
// nav checkmarks. Sections gain a check once their self-test (predict-first guess,
// recall prompt, or final quiz) is answered.
export const SECTION_CHECK = {
  idea: "g1", why: "g-why", build: "g-build", collapse: "g2",
  depth: "r-depth", compare: "r-compare", history: "r-history",
  models: "g3", worldmodels: "r-worldmodels", recap: "quiz",
};

/* Primary sources, keyed so per-lecture readings + the footer share one list. */
export const SOURCES = {
  cpc: ["van den Oord et al. — Contrastive Predictive Coding (2018)", "https://arxiv.org/abs/1807.03748"],
  worldmodels: ["Ha & Schmidhuber — World Models (2018)", "https://arxiv.org/abs/1803.10122"],
  byol: ["Grill et al. — BYOL (2020)", "https://arxiv.org/abs/2006.07733"],
  simsiam: ["Chen & He — SimSiam (2021)", "https://arxiv.org/abs/2011.10566"],
  vicreg: ["Bardes, Ponce & LeCun — VICReg (2022)", "https://arxiv.org/abs/2105.04906"],
  path: ["LeCun — A Path Towards Autonomous Machine Intelligence (2022)", "https://openreview.net/pdf?id=BZ5a1r-kVsf"],
  ijepa: ["Assran et al. — I-JEPA, CVPR (2023)", "https://arxiv.org/abs/2301.08243"],
  vjepa: ["Bardes et al. — V-JEPA (2024)", "https://arxiv.org/abs/2404.08471"],
  dinowm: ["Zhou et al. — DINO-WM (2024)", "https://arxiv.org/abs/2411.04983"],
  pldm: ["Sobal et al. — PLDM / latent planning (2025)", "https://arxiv.org/abs/2502.14819"],
  vjepa2: ["Assran, Ballas et al. — V-JEPA 2 (2025)", "https://arxiv.org/abs/2506.09985"],
  lejepa: ["Balestriero & LeCun — LeJEPA (2025)", "https://arxiv.org/abs/2511.08544"],
  lewm: ["Maes, …, LeCun & Balestriero — LeWorldModel (2026)", "https://arxiv.org/abs/2603.19312"],
};
export const SOURCE_ORDER = ["cpc", "worldmodels", "byol", "simsiam", "vicreg", "path", "ijepa", "vjepa", "dinowm", "pldm", "vjepa2", "lejepa", "lewm"];

/* Course units (modules) — group the eleven lectures into a syllabus. */
export const UNITS = [
  { roman: "I", title: "The Core Idea", blurb: "What a JEPA predicts, and why moving the loss into latent space changes everything.", lectures: ["idea", "why", "build", "collapse"] },
  { roman: "II", title: "Under the Hood", blurb: "The energy formulation, the real loss functions, the masking algorithm, and how representations are measured.", lectures: ["depth", "depth2"] },
  { roman: "III", title: "In Context", blurb: "How JEPA sits against generative and contrastive learning — and the lineage that produced it.", lectures: ["compare", "history"] },
  { roman: "IV", title: "The Frontier", blurb: "The model family, model by model, and the world-model program the whole idea was built to power.", lectures: ["models", "worldmodels"] },
];

/* Per-lecture syllabus metadata: objectives, takeaways, est. minutes, difficulty
   tier, prerequisites, and primary readings (keys into SOURCES). Drives the
   objectives box at the top of each lecture and the takeaways box at the foot. */
export const LECTURE_META = {
  idea: {
    minutes: 5, difficulty: "Intro", prereqs: ["gradient descent", "what an embedding is"],
    objectives: [
      "Say what a JEPA predicts, and how that differs from a generative model",
      "Define self-supervised learning and “embedding” in one sentence each",
      "State the course thesis: predict the representation, not the pixels",
    ],
    takeaways: [
      "A JEPA predicts the meaning (an embedding) of the hidden part of its input, not the pixels",
      "Where the loss lives — pixel space vs. embedding space — is the whole game",
      "Self-supervised learning lets a model learn from unlabeled data by hiding part of itself",
    ],
    readings: ["path"],
  },
  why: {
    minutes: 6, difficulty: "Core", prereqs: ["§01 The Idea"],
    objectives: [
      "Explain the “reconstruction tax” a generative model pays on every pixel",
      "Say why a learned target lets the encoder drop unpredictable detail",
      "Read a JEPA training step as code and spot the anti-collapse term",
    ],
    takeaways: [
      "Reconstructing pixels wastes capacity on detail no model can predict",
      "A learned target frees the encoder to keep meaning and discard noise",
      "JEPA is an energy-based model: low energy = compatible, no normalization needed",
    ],
    readings: ["path"],
  },
  build: {
    minutes: 6, difficulty: "Core", prereqs: ["§02 Why Latent"],
    objectives: [
      "Name the three networks of a JEPA and what each does",
      "Explain why the architecture is deliberately asymmetric (stop-gradient + EMA)",
      "Describe what a Vision Transformer feeds the encoder (patches → tokens)",
    ],
    takeaways: [
      "Context encoder (kept), target encoder (EMA teacher), predictor (the bridge)",
      "The asymmetry exists to stop the two encoders colluding into collapse",
      "The EMA teacher lags the student on purpose, so targets stay un-gameable",
    ],
    readings: ["ijepa"],
  },
  collapse: {
    minutes: 6, difficulty: "Core", prereqs: ["§03 Architecture"],
    objectives: [
      "Define representation collapse and its two flavors (complete, dimensional)",
      "Explain why a self-graded objective invites the collapse shortcut",
      "Connect each anti-collapse defense to the failure it prevents",
    ],
    takeaways: [
      "Collapse = mapping everything to one point (or one tiny subspace) to trivialize the loss",
      "Complete collapse kills all spread; dimensional collapse hides as a healthy-looking line",
      "Every odd JEPA design choice exists to stop the model cheating its own exam",
    ],
    readings: ["vicreg", "simsiam", "byol"],
  },
  depth: {
    minutes: 9, difficulty: "Advanced", prereqs: ["§04 Collapse"],
    objectives: [
      "Write a JEPA's energy F(x,y) = minₖ E and explain the min over z",
      "Contrast the two ways to shape an energy landscape (contrastive vs. regularized)",
      "Read VICReg's three terms in code and map each to a collapse it prevents",
    ],
    takeaways: [
      "min over z lets one context hold many valid futures — no probability needed",
      "Contrastive pushes up negatives (needs many); regularized constrains statistics (needs none)",
      "VICReg = variance (kills complete) + covariance (kills dimensional) + invariance (pulls views together)",
    ],
    readings: ["vicreg", "path"],
  },
  depth2: {
    minutes: 9, difficulty: "Frontier", prereqs: ["§05 Under the Hood"],
    objectives: [
      "State LeJEPA's claim and its assumptions (isotropic Gaussian, linear probes)",
      "Explain SIGReg via the Cramér–Wold “every shadow is a circle” intuition",
      "List how a frozen representation is evaluated and why those probes work",
    ],
    takeaways: [
      "LeJEPA proves an isotropic Gaussian minimizes worst-case linear-probe risk",
      "SIGReg enforces it cheaply by testing 1-D projections — no EMA, stop-grad, or negatives",
      "If a linear probe or k-NN can read labels off frozen features, the representation is good",
    ],
    readings: ["lejepa"],
  },
  compare: {
    minutes: 5, difficulty: "Core", prereqs: ["§02 Why Latent"],
    objectives: [
      "Say where generative, contrastive, and JEPA models each compute their loss",
      "Explain why “no negatives” is a selling point",
      "Name JEPA's honest open questions (slow features, distractors)",
    ],
    takeaways: [
      "Generative → pixel loss; contrastive → needs negatives; JEPA → latent loss, no negatives",
      "Contrastive's apparatus (positives, negatives, big batches) is exactly what JEPA drops",
      "JEPA isn't automatic — target construction and masking still decide whether it works",
    ],
    readings: ["path", "cpc"],
  },
  history: {
    minutes: 4, difficulty: "Intro", prereqs: ["§04 Collapse"],
    objectives: [
      "Trace the lineage from energy-based models to today's JEPA world models",
      "Explain how each step's problem motivated the next idea",
      "Place the 2022 “Path” manifesto and its six-module agent in context",
    ],
    takeaways: [
      "JEPA's history is largely a history of anti-collapse techniques",
      "Each milestone fixed the previous one's blocking problem, not a random improvement",
      "The predictor is one module (the world model) of a larger proposed autonomous agent",
    ],
    readings: ["cpc", "worldmodels", "byol", "vicreg", "path"],
  },
  models: {
    minutes: 7, difficulty: "Advanced", prereqs: ["§03 Architecture", "§05 Under the Hood"],
    objectives: [
      "Say what each model (I-JEPA → V-JEPA → V-JEPA 2) added",
      "Walk through latent planning with CEM step by step",
      "Explain why latent scoring makes real-time robot planning affordable",
    ],
    takeaways: [
      "Each model adds exactly one thing the last lacked: time, scale, control",
      "Planning = sample action sequences, score by latent distance to goal, keep elites, replan",
      "Scoring embeddings (not rendered pixels) is the reported ~15× speedup that runs on a real arm",
    ],
    readings: ["ijepa", "vjepa", "vjepa2"],
  },
  worldmodels: {
    minutes: 7, difficulty: "Frontier", prereqs: ["§09 The Models"],
    objectives: [
      "Define a world model and why collapse is its central training obstacle",
      "Compare the three ways to train one without collapse",
      "Explain how LeWorldModel ties the whole program together",
    ],
    takeaways: [
      "An action-conditioned predictor is a world model you plan against instead of acting blindly",
      "Frozen encoder (safe), end-to-end + many regularizers (fragile), or end-to-end + SIGReg (the synthesis)",
      "LeWorldModel: end-to-end from pixels, two-term loss, ~15M params — stable and small",
    ],
    readings: ["dinowm", "pldm", "vjepa2", "lewm"],
  },
  recap: {
    minutes: 5, difficulty: "Review", prereqs: ["all lectures"],
    objectives: [
      "Reconstruct the whole argument from thesis to world models in your own words",
      "Pass the final review covering every lecture's core check",
      "Know the open questions and where the research is heading",
    ],
    takeaways: [
      "Predict the representation, not the pixels — then plan against the predictor",
      "Collapse is the recurring enemy; the field's history is its defenses",
      "The program runs from one image (I-JEPA) to a robot planning zero-shot (V-JEPA 2) to a clean world model (LeWM)",
    ],
    readings: [],
  },
};

/* Final review — one core question per lecture, aggregated into a graded deck.
   Mirrors each lecture's predict-first check so the review is true spaced retrieval. */
export const REVIEW = [
  { id: "idea", q: "Where does a JEPA compute its training loss?",
    options: ["In pixel space, like a generative model", "In embedding (representation) space", "Against human-provided labels"], correct: 1 },
  { id: "why", q: "Why does reconstructing raw pixels charge a generative model a “tax”?",
    options: ["It must spend capacity predicting detail it can never guess", "Pixels are expensive to store", "It can't run on a GPU"], correct: 0 },
  { id: "build", q: "What actually keeps the two encoders from colluding into collapse?",
    options: ["The EMA specifically — without it they always collapse", "The asymmetry (stop-gradient + predictor) — EMA is just one optional way to get a stable target; SimSiam works with no EMA at all", "Saving memory by sharing weights"], correct: 1 },
  { id: "collapse", q: "What is the laziest way for a JEPA to drive its loss to zero?",
    options: ["Use a bigger predictor", "Map every input to the same embedding", "Lower the learning rate"], correct: 1 },
  { id: "depth", q: "What does the min over z in F(x,y) = minₖ E let a JEPA represent?",
    options: ["A single deterministic future", "Several valid futures, with no probability needed", "The exact pixels of the future"], correct: 1 },
  { id: "depth2", q: "What distribution does LeJEPA's SIGReg push the embeddings toward?",
    options: ["A one-hot code", "An isotropic Gaussian", "A uniform grid"], correct: 1 },
  { id: "compare", q: "What apparatus does JEPA avoid that contrastive learning needs?",
    options: ["Negatives, big batches, and hand-crafted augmentations", "Gradient descent", "Any neural network at all"], correct: 0 },
  { id: "history", q: "Most of JEPA's history is, in effect, a history of…",
    options: ["bigger datasets", "anti-collapse techniques", "faster GPUs"], correct: 1 },
  { id: "models", q: "Why can V-JEPA 2 plan much faster (reported ~15×) than a diffusion world model like Cosmos?",
    options: ["It uses a bigger inference cluster", "It scores plans by comparing embeddings, not rendering pixels", "It memorizes each task in advance"], correct: 1 },
  { id: "worldmodels", q: "How does LeWorldModel train end-to-end from pixels without collapse?",
    options: ["By freezing a pretrained encoder", "Next-embedding prediction + SIGReg — one regularizer", "Seven hand-tuned loss terms"], correct: 1 },
  { id: "recap", q: "The course thesis, in one line:",
    options: ["Predict the pixels as precisely as possible", "Predict the representation, not the pixels", "Always use the largest model available"], correct: 1 },
];

/* Discovery timeline — each step's problem motivates the next idea. */
export const TIMELINE = [
  { yr: "1980s–2006", t: "Energy-based models & Siamese nets", problem: "How do you score whether two things are compatible without a fragile probability over everything?",
    idea: "LeCun's energy-based learning: a scalar energy, low for compatible pairs. Two-branch Siamese nets encode and compare. JEPA's DNA: energy = prediction error between two encoders." , c: "violet" },
  { yr: "2018", t: "Contrastive Predictive Coding", problem: "Reconstructing raw future data is wasteful and hard.",
    idea: "Predict future latent codes from past context. The seed of 'predict the representation, not the data' — though still reliant on contrastive negatives.", c: "violet" },
  { yr: "2018", t: "World Models (Ha & Schmidhuber)", problem: "Agents that learn only by trial in the real world are painfully slow.",
    idea: "Compress observations to a latent, learn to predict the next latent, then plan — even 'dream' — inside the learned model. Planning in latent space becomes concrete.", c: "cyan" },
  { yr: "2020–21", t: "BYOL · SimSiam · VICReg · DINO", problem: "Contrastive learning needs huge batches of negatives. Can we drop them?",
    idea: "Yes — and non-contrastive SSL splits into distinct anti-collapse families: asymmetry (BYOL/SimSiam — stop-gradient + predictor head, with BYOL adding an EMA target; SimSiam showed the asymmetry, not the EMA, is what matters), statistical regularizers (VICReg's variance/covariance, Barlow Twins' cross-correlation), and centering + sharpening (DINO/DINOv2). JEPA inherits the asymmetry + regularizer lines.", c: "cyan" },
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
    why: "Given a goal image, the robot plans by Model-Predictive Control: imagine the latent consequences of candidate action sequences, score each by the L1 distance to the goal embedding, execute the first action, then re-plan. The optimizer is the Cross-Entropy Method. Zero-shot pick-and-place on Franka arms in two unseen labs — no task rewards, ~16 sec per action vs a reported ~4 min for the diffusion-based Cosmos baseline (≈15× faster — the gap is latent-embedding scoring vs full pixel rendering, same CEM search on both sides).",
    stats: [["1M+ h", "internet video"], ["62 h", "robot data"], ["0-shot", "new labs"], ["~15×", "reported vs Cosmos"]] },
  { id: "lejepa", name: "LeJEPA", year: "Nov 2025", domain: "Theory + method", pill: "the principled rewrite",
    blurb: "Removes heuristics instead of adding them. Proves an isotropic Gaussian minimizes worst-case downstream risk (for linear probes); enforces it with SIGReg (checks Gaussianity along random 1-D projections, linear cost); combines with latent prediction into a one-hyperparameter objective.",
    why: "No EMA, no stop-gradient, no teacher–student asymmetry — yet stable, collapse-free training across architectures. Turns JEPA from an empirical recipe into a method with provable guarantees, right as the field pivots to world models.",
    stats: [["N(0,I)", "provably optimal"], ["SIGReg", "linear cost"], ["1", "hyperparameter"]] },
  { id: "lewm", name: "LeWorldModel", year: "Mar 2026", domain: "Latent world model from pixels", pill: "the synthesis",
    blurb: "An action-conditioned world model trained end-to-end from raw pixels with a two-term objective: next-embedding prediction + SIGReg. No pixel reconstruction, no reward, no frozen encoder, no EMA or stop-gradient. A ViT-Tiny encoder (~5M params) maps each frame to a single 192-dim token; a small predictor models the dynamics — about 15M parameters in total.",
    why: "Brings LeJEPA's provable anti-collapse to world modeling, finally making end-to-end pixel training stable and simple — one effective hyperparameter where prior end-to-end methods (PLDM) needed seven loss terms. Plans via CEM from start+goal images in ~1s (a reported ≈48× faster than DINO-WM-class world models), trains on a single GPU in hours. The model that ties the whole program together.",
    stats: [["~15M", "params (total)"], ["2", "loss terms"], ["~1s", "to plan"], ["~48×", "reported speedup"]] },
];

/* Click-to-expand key terms. */
export const GLOSSARY = [
  ["Self-supervised learning", "Training with no human labels: the data creates its own supervision by hiding part of itself and asking the model to predict the missing part. This is what lets you learn from a billion unlabeled video frames or images."],
  ["Embedding / representation", "A vector of numbers a network produces to describe an input. After training, directions in this space carry meaning (object identity, motion, etc.)."],
  ["Latent space", "The abstract space where embeddings live. 'Predicting in latent space' = predicting these vectors instead of raw pixels or tokens."],
  ["Vision Transformer (ViT) / patches", "The image encoder used in every JEPA: it splits an image into a grid of small square patches (e.g. 14×14 px), turns each patch into a token vector, and processes the set like a language transformer processes words. 'Encode the visible patches' = run the ViT on the patches you didn't hide."],
  ["Negatives & augmentations", "Contrastive-learning machinery. Augmentations are hand-designed distortions (crop, recolor) that turn one image into a 'positive' pair; negatives are unrelated images pushed far apart. They need big batches — and JEPA needs neither."],
  ["InfoNCE", "The standard contrastive loss (introduced by CPC): pull a positive pair together in embedding space while pushing many sampled negatives apart. The objective JEPA's lineage moves away from."],
  ["Barlow Twins", "A non-contrastive SSL method that drives the cross-correlation matrix between two views' embeddings toward the identity — same spirit as VICReg's covariance term (decorrelate the dimensions), achieved a slightly different way."],
  ["Siamese network", "An architecture with two (often weight-sharing) encoder branches that each process one input, so two things can be compared in embedding space. JEPA's context/target two-branch design is a Siamese descendant."],
  ["Linear probe / k-NN eval", "Ways to measure a frozen representation. Linear probe: freeze the encoder, train only a linear classifier on top. k-NN: label a new point by its nearest neighbors in embedding space (no training). If a dumb readout can recover the labels, the embedding already encodes the meaning."],
  ["Context / target", "Context is the visible part of an input; target is the hidden part whose representation the model must predict."],
  ["Predictor", "The network that maps the context embedding (plus target position, and optionally an action or latent z) to a predicted target embedding. Becomes the world model."],
  ["EMA target encoder", "A 'teacher' whose weights are an exponential moving average of the trained 'student' encoder, with gradients stopped. Provides stable targets and fights collapse."],
  ["stop-gradient", "Treating a tensor as a constant during backprop — no gradient flows through it. In JEPA the target branch is stop-gradient'd so the only way to lower the loss is to predict better, not to drag the target toward the prediction."],
  ["Representation collapse", "The failure where the encoder maps everything to the same (or a low-dimensional) embedding, making prediction trivial and the features useless."],
  ["VICReg", "Variance–Invariance–Covariance Regularization (Bardes, Ponce & LeCun 2022): three loss terms that keep embeddings spread out and decorrelated to prevent collapse."],
  ["Reconstruction tax", "The wasted modeling capacity a pixel-reconstructing model spends on unpredictable, low-level detail (texture, noise) it can never get right — effort a JEPA refuses to pay by predicting in embedding space instead."],
  ["MAE (Masked Autoencoder)", "A generative self-supervised method that masks image patches and reconstructs the missing pixels. The cleanest contrast to I-JEPA: same masking, but the target is pixels, not embeddings."],
  ["Energy-Based Model (EBM)", "A model that scores compatibility with a scalar 'energy' (low = compatible). JEPA's energy is prediction error in embedding space."],
  ["Latent variable z", "An extra input to the predictor representing information about the target not in the context — i.e. residual uncertainty / multiple valid futures."],
  ["World model", "An internal simulator that predicts how states evolve, optionally given actions. JEPA's predictor, action-conditioned, is one. You plan by searching it instead of acting in the real world."],
  ["Frozen vs end-to-end", "Two ways to avoid collapse in a world model: freeze a pretrained encoder (DINO-WM — safe, but inherited features) or train the encoder jointly (PLDM, LeWM — powerful, but needs anti-collapse machinery)."],
  ["LeWorldModel (LeWM)", "2026 JEPA world model (LeCun, Balestriero et al.): action-conditioned, end-to-end from pixels, two-term loss (prediction + SIGReg), ~15M params, plans a reported ~48× faster than DINO-WM-class world models. The synthesis of the whole program."],
  ["AMI Labs", "Advanced Machine Intelligence — LeCun's Paris startup (founded Dec 2025) built on the world-model bet rather than LLMs; raised a ~$1B seed in early 2026."],
  ["MPC / CEM", "Model-Predictive Control: plan a short horizon, execute one action, then re-plan from what you actually see (so errors can't compound). The Cross-Entropy Method (CEM) is the sampling-based optimizer it uses inside each step — sample candidate action sequences, keep the best ('elites'), refit the sampling distribution, repeat. MPC is the loop; CEM runs inside it. NOTE: CEM is unrelated to the cross-entropy loss from classification, despite the shared name."],
  ["SIGReg / LeJEPA", "Sketched Isotropic Gaussian Regularization: a 2025 regularizer that pushes embeddings toward an isotropic Gaussian — provably optimal — removing EMA/stop-gradient heuristics."],
  ["Isotropic Gaussian 𝒩(0, I)", "The 'most boring' cloud of points: round, the same spread in every direction, with no direction correlated with another. LeJEPA's result is that this is the safest target shape for embeddings when the downstream task is unknown."],
];

/* World-model landscape comparison. */
export const WORLD_MODELS = [
  { id: "dinowm", name: "DINO-WM", who: "Zhou et al., 2024", color: "violet",
    encoder: "Frozen DINOv2 (pretrained)", collapse: "Sidesteps it — encoder isn't trained, so it can't collapse",
    loss: "Predictor-only objective", plan: "CEM in latent space (slower — many patch tokens)",
    note: "Proved a reward-free, task-agnostic world model on frozen self-supervised features can plan zero-shot. DINOv2 itself avoids collapse via centering+sharpening (the DINO family's mechanism) and has strong emergent properties (segmentation, correspondence) — which is exactly why a frozen DINOv2 is good enough to plan on. But you inherit whatever DINOv2 encodes — you can't shape the representation for your task." },
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
    loss: "Two terms: next-embedding prediction + SIGReg (effectively one hyperparameter, λ)", plan: "CEM from start+goal images, ~1s (a reported ≈48× faster than DINO-WM-class models, ~200× fewer tokens)",
    note: "The synthesis: end-to-end from pixels like PLDM, but stable and simple like a frozen-encoder method — because SIGReg's provably-optimal Gaussian target replaces the whole bag of tricks. Trains on a single GPU in hours." },
];
