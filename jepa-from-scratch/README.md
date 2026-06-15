# JEPA from scratch — from one GPU to a distributed pipeline

Small, faithful, **fully runnable** implementations of Joint-Embedding Predictive
Architectures, then the systems work that scaling them actually requires. Built to be read
top-to-bottom in a notebook:

| Notebook | Topic | What it shows |
|----------|-------|---------------|
| [`01_i-jepa_images_cifar10.ipynb`](01_i-jepa_images_cifar10.ipynb) | **I-JEPA** (images) | latent prediction learns semantic features — linear probe **~57%** vs raw-pixel **~40%** |
| [`02_v-jepa_video_panning_cifar.ipynb`](02_v-jepa_video_panning_cifar.ipynb) | **V-JEPA** (video, 3D tubelets) | the same idea in space+time — class probe **~48%** vs raw pixels **~40%** |
| [`03_distributed_training_ddp_fsdp.ipynb`](03_distributed_training_ddp_fsdp.ipynb) | **Multi-GPU: DDP & FSDP** | the same I-JEPA across 2 real GPUs — data-parallel scaling, the **straggler effect**, and FSDP memory sharding |
| [`04_efficient_video_data_pipelines.ipynb`](04_efficient_video_data_pipelines.ipynb) | **Video / streaming data pipelines** | why the input pipeline becomes the bottleneck at scale — workers, pinned memory, streaming + sharding, GPU starvation |

This is the hands-on companion to the interactive course in the parent repo
(*"Predict the representation, not the pixels"*). Notebooks 01–02 run on one GPU (or CPU) in
minutes; 03–04 demonstrate **how training changes when you go multi-GPU and to streaming-scale
data** — measured live on this box's two GPUs (an RTX 4090 + an RTX 3060).

> **Scale honesty.** The models are *toys* (a ~6M-param ViT trained for minutes; real I-JEPA is
> ViT-H/14 on 16 A100s, real V-JEPA 2 is a >1B-param ViT-g on 1M+ hours of video). But the
> *mechanisms* — latent prediction, DDP gradient all-reduce, FSDP sharding, the straggler effect,
> input-pipeline starvation — are exactly what you hit at real scale, only smaller.

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

## Notebook 3 — Multi-GPU training (DDP & FSDP)

Takes the *same* I-JEPA and runs it across **both real GPUs** in this box via `torchrun`.

- **DDP (data parallel):** replicate the model per GPU, all-reduce gradients each step. The EMA target
  encoder is deliberately kept **outside** DDP (it's not trained, only EMA-updated from the synced
  student — a momentum-encoder gotcha). Covers `DistributedSampler`/`set_epoch`, rank-0-only logging,
  effective batch size and the linear LR-scaling rule.
- **The straggler effect, measured live:** these GPUs are mismatched (4090 + 3060), and the results show
  DDP across both (**~5,000 img/s**) is *slower* than the 4090 alone (**~10,000 img/s**) — because the
  per-step all-reduce barrier runs at the pace of the slowest worker. This is the single most important
  distributed lesson, and the reason real clusters fight for homogeneous hardware + fast interconnect.
- **FSDP (sharded):** when the model doesn't fit, FSDP shards params/grads/optimizer state across GPUs.
  On a 96M-param ViT we measure **per-GPU peak memory 5.29 GB (DDP) → 4.11 GB (FSDP)** (the gap widens
  with model size; activations aren't sharded by default → activation checkpointing).

## Notebook 4 — Efficient video / streaming data pipelines

Once the GPUs are fast and many, **feeding them** becomes the bottleneck — acutely so for decode-heavy
video. All measured on a synthetic clip source with a realistic per-clip decode cost:

- **`num_workers`** parallelizes decode: **~240 → ~1,700 clips/s** going 0 → 8 workers.
- **Pinned memory** raises host→device bandwidth (**~19 → ~24 GB/s**) and enables transfer/compute overlap.
- **Streaming `IterableDataset` + sharding:** the `world_size × num_workers` stride that gives every
  (rank, worker) a disjoint slice — verified 600/600 unique, no duplicates (get it wrong and you train on
  6× duplicated data).
- **GPU starvation, measured:** the same GPU work goes from **78% idle** (serial pipeline) to **22% idle**
  (8 workers). Plus video-specific notes: decode cost, frame/clip sampling, latent caching for frozen
  encoders, overlap/prefetch.

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
- **Multi-GPU is a *systems* problem, not a model change.** The model code barely changes; what changes
  is synchronization (the straggler effect), communication cost, rank-awareness, and memory layout
  (DDP replicates, FSDP shards). The bottleneck moves from FLOPs to comms.
- **Distributed compute and distributed data are the same problem.** Scaling the GPUs is pointless if the
  input pipeline starves them — each rank needs its own fast, disjoint, streaming pipeline. The whole
  game is keeping every expensive GPU busy.

## Files

```
01_i-jepa_images_cifar10.ipynb         # I-JEPA, end to end
02_v-jepa_video_panning_cifar.ipynb    # V-JEPA (3D tubelets) on panning CIFAR clips
03_distributed_training_ddp_fsdp.ipynb # multi-GPU DDP + FSDP via torchrun (both GPUs)
04_efficient_video_data_pipelines.ipynb# workers, pinned memory, streaming/sharding, GPU starvation
requirements.txt                       # exact versions (also see Quickstart for uv)
data/                                  # auto-downloaded CIFAR-10 (gitignored)
.venv/                                 # uv-managed Python 3.12 env (gitignored)
```

Notebooks 03–04 generate small helper scripts at runtime (`ddp_ijepa.py`, `fsdp_mem.py` via
`%%writefile`); these are gitignored since the notebooks recreate them.
