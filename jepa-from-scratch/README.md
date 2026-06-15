# JEPA from scratch — I-JEPA & V-JEPA on a single GPU

Two small, faithful, **fully runnable** implementations of Joint-Embedding Predictive
Architectures, built to be read top-to-bottom in a notebook:

| Notebook | Model | Data | What it shows |
|----------|-------|------|---------------|
| [`01_i-jepa_images_cifar10.ipynb`](01_i-jepa_images_cifar10.ipynb) | **I-JEPA** (images) | CIFAR-10 (auto-download) | latent prediction learns semantic features — a linear probe (**~58%**) beats a raw-pixel probe (**~40%**) |
| [`02_v-jepa_video_panning_cifar.ipynb`](02_v-jepa_video_panning_cifar.ipynb) | **V-JEPA** (video) | panning CIFAR-10 clips | the same idea in space+time (3D tubelets) — class probe (**~48%**) again beats raw pixels (**~40%**) |

This is the hands-on companion to the interactive course in the parent repo
(*"Predict the representation, not the pixels"*). The course explains the ideas; these
notebooks make you build them. Everything runs on one GPU (or CPU, slower) in a few minutes.

> **Scale honesty.** These are *toys* — a ~6M-param ViT trained for minutes. Real I-JEPA is a
> ViT-H/14 on ImageNet (16 A100s, <72h); real V-JEPA 2 is a >1B-param ViT-g on 1M+ hours of
> video. The **mechanism** here is the real thing; only the scale differs.

---

## Quickstart

The environment is managed with [`uv`](https://docs.astral.sh/uv/). PyTorch has no wheels
for Python 3.14 yet, so we pin **Python 3.12**.

```bash
cd jepa-from-scratch

# 1. create the virtual environment (Python 3.12) and install deps
uv venv --python 3.12 .venv
uv pip install --python .venv torch torchvision numpy matplotlib jupyter ipykernel
#   (the default torch wheel is CUDA-enabled on Linux x86_64; use --index-url
#    https://download.pytorch.org/whl/cpu for a CPU-only build)

# 2. launch Jupyter and open either notebook
.venv/bin/jupyter lab        # or: jupyter notebook
```

Or run a notebook headless end-to-end:

```bash
.venv/bin/jupyter nbconvert --to notebook --execute --inplace 01_i-jepa_images_cifar10.ipynb
```

Datasets (CIFAR-10, MNIST) download automatically to `./data/` on first run — both are
small, public, and standard.

---

## The architecture (shared by both notebooks)

A JEPA has **three networks** and one deliberate **asymmetry**:

```
            visible context patches                 full input
                     │                                  │
            ┌────────▼────────┐                 ┌────────▼────────┐
            │ context encoder │                 │ target encoder  │   (EMA copy of the
            │   (the student, │                 │  (the teacher,  │    student; weights
            │   trained)      │                 │  stop-gradient) │    updated by EMA)
            └────────┬────────┘                 └────────┬────────┘
                     │ s_context                          │ s_target
            ┌────────▼────────┐                           │
            │    predictor    │  + target positions       │
            │   (narrow ViT)  │ ───────────────► ŝ_target │
            └─────────────────┘                           │
                     └──────────  smooth-L1 loss  ─────────┘
                                (entirely in embedding space — no pixels)
```

1. **Context encoder** (student): a small ViT that encodes the *visible* patches. Trained by
   gradient descent; this is the feature extractor you keep.
2. **Target encoder** (teacher): the **exponential moving average** of the student, with a
   **stop-gradient**. Encodes the *full* input; its outputs at the masked positions are the
   targets. The slow, gradient-free teacher gives stable targets the student can't game.
3. **Predictor**: a deliberately narrower ViT. Given the context and a learned *mask token* at
   each target position, it predicts the target embeddings.

**The loss is smooth-L1 between predicted and target embeddings** — there is no decoder and no
pixel anywhere in the objective. That's the whole thesis: *predict the representation.*

### Training loop (the heart of it)

```python
ctx_idx, tgt_idx = sample_mask()                    # which patches are context vs target
ctx = context_encoder(x, keep_idx=ctx_idx)          # encode visible context only
pred = predictor(ctx, ctx_idx, tgt_idx)             # predict the hidden embeddings
with torch.no_grad():
    tgt = target_encoder(x)[:, tgt_idx]             # teacher targets (stop-gradient)
loss = smooth_l1(pred, tgt)                         # error in latent space
loss.backward(); opt.step()
ema_update(target_encoder, context_encoder)         # teacher trails the student
```

---

## Notebook 1 — I-JEPA (images)

- **Masking:** I-JEPA's multi-block scheme — 4 target blocks (15–20% each, aspect 0.75–1.5) on
  the patch grid; context is the complement (a small, readable simplification of the paper's
  "one big context block minus overlap").
- **Result:** a linear probe on the frozen encoder reaches **~58%** on CIFAR-10 vs **~40%** for a
  linear probe on raw pixels (random = 10%). Pretraining never saw a label — the encoder
  organized semantics on its own.

## Notebook 2 — V-JEPA (video)

- **Space-time:** a `Conv3d` tubelet patch embed (2 frames × 8×8 px) and a **tube mask** (spatial
  blocks hidden across all frames). Otherwise identical to I-JEPA, including the EMA + stop-gradient
  anti-collapse asymmetry that real V-JEPA uses.
- **Data:** short clips made by **panning a CIFAR-10 image** with a random velocity. Why not a moving
  MNIST digit? A clean synthetic digit is *linearly trivial* — even a random network reads it off, so
  self-supervised learning has nothing to add (a real and instructive gotcha when evaluating SSL).
  Natural-image content is where the signal is measurable.
- **Result:** a linear probe on the frozen encoder reaches **~48%** object-class accuracy vs **~40%**
  for a raw-clip-pixel probe (random = 10%) — the video version of I-JEPA's win, learned from
  unlabeled clips.

---

## What I learned building this

- **The loss really is just vectors.** Implementing it makes concrete how little there is: encode,
  predict an embedding, compare embeddings. No decoder, no reconstruction.
- **The asymmetry is doing real work.** The EMA teacher + stop-gradient is the only thing standing
  between you and a constant-function encoder — and even it isn't a guarantee at scale.
- **The data decides whether learning shows.** My first V-JEPA attempt used clean Moving-MNIST and
  *couldn't* beat a baseline — a clean synthetic digit is linearly trivial, so a random network
  already solves it. Switching to natural-image clips (panning CIFAR) is what made the
  self-supervised signal measurable. The model is only half the experiment; the eval data is the rest.
- **Evaluation is the subtle part.** With learned targets there's no pixel ground truth, so you lean
  on linear probes against an honest baseline (raw pixels) to claim anything at all.

## Files

```
01_i-jepa_images_cifar10.ipynb         # I-JEPA, end to end
02_v-jepa_video_panning_cifar.ipynb    # V-JEPA (3D tubelets) on panning CIFAR clips
requirements.txt                       # exact versions (also see Quickstart for uv)
data/                                  # auto-downloaded CIFAR-10 (gitignored)
.venv/                                 # uv-managed Python 3.12 env (gitignored)
```
