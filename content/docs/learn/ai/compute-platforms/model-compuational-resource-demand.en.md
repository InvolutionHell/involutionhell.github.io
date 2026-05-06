---
title: Compute Requirements Guide
description: How to calculate the GPU memory required to train large models
date: "2025-09-20"
tags:
  - compute-platforms
docId: ns7q5ehuje6oiua7as6rtnyf
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Notes on Multi-GPU Training of Large Models

## 1. Unit Conventions

1 GB = 1024 MB = 1024×1024 KB = 1024×1024×1024 Bytes = 1024×1024×1024×8 Bits

**Parameter types and sizes:**

| Parameter Type | Bytes |
| -------------- | ----- |
| FP32           | 4     |
| FP16 / BF16    | 2     |
| INT8           | 1     |
| INT4           | 0.5   |

---

## 2. GPU Memory Calculation for Training Large Models

Even with 80 GB of GPU memory, a single card cannot handle full training of models with billions of parameters.
Weights are only one part — gradients, optimizer states, and activations all consume GPU memory.

Assuming the model has **N parameters** (e.g., 2B = 2 billion):

1. **Weights W**
   - Storage format: BF16 (2 bytes)
   - Memory: $W = N \times 2$ bytes
   - Example: 2B parameters → ≈ 4 GB

2. **Gradients G**
   - Storage format: BF16 (2 bytes)
   - Memory: $G = N \times 2$ bytes
   - Example: 2B parameters → ≈ 4 GB

3. **Optimizer States (Adam)**
   - Contains momentum V and squared gradient S, each in FP32 (4 bytes)
   - Each ≈ 8 GB, total ≈ 16 GB  
     Note: optimizer memory also includes additional overhead (weight gradients may be copied many times during training)
   1. **Weights W**
      - Model parameters stored in BF16/FP16 at 2 bytes.

   2. **Gradients G**
      - Temporary storage during backpropagation, BF16/FP16 at 2 bytes.

   3. **Optimizer states** (vary significantly by optimizer):
      - **SGD**: typically only needs the gradients themselves — **0 copies**.
      - **SGDM (SGD with momentum)**: requires one momentum vector (FP32, 4 bytes). **One copy**
      - **Adam/AdamW**:
      - **First-order momentum (V)**: FP32 (4 bytes).
      - **Second-order momentum (S)**: FP32 (4 bytes).
      - So **2 state copies**.

   4. **Master weights ($W^A$)**
      - Common in mixed-precision training: although forward/backward passes use BF16, the optimizer update requires FP32 precision → so an additional FP32 copy of the weights is stored.

4. **Activations**
   - Depends on batch size, seq_len, and implementation details
   - Rough estimate: ≈ 0.7–1.0 × weight size

---

## 3. Formula Summary

- **Standard Adam mode:**

  $W + G + W^A + V + S + 0.7W ≈ 24.8$ GB (using 2B parameters as an example)

- **DeepSpeed ZeRO-3 mode:**

  $W + G + W^A + G^A + V + S + 0.7W ≈ 32.8$ GB

Note: ZeRO-3 uses less memory but incurs higher communication and I/O overhead.

---

## 4. Real-World Case: Mixtral-8×7B

### Setup and Constants

- Architecture: `d_model ≈ 4096`, `ffn_dim ≈ 14336`, **8 experts** per layer, **32 layers**, SwiGLU (gate/up/down three linear layers).
- Parameters per single expert:  
  $4096×14336×2 + 14336×4096 = 176,160,768$ ≈ **1.76×10^8**  
  → BF16 weights ≈ **352 MB/expert**
- 8 experts per layer ≈ **2.82 GB/layer**
- 32 layers total ≈ **90 GB (expert weights only)**  
  → Full-expert full-parameter training is impossible on **44 GB GPU memory**.

---

### Case A: Router-only

- Router parameters: `d_model × n_experts ≈ 4k × 8 = 32k`
- All 32 layers ≈ **millions of parameters**
- Extremely low overhead (MB level); memory is mainly consumed by **activations**
- Fully feasible on 44 GB, but improvement is limited

---

### Case B: Partial Layers × Partial Experts

Example: train only the bottom **6 layers**, **2 experts** per layer, plus the router.

- Trainable parameter count:  
  $6 × 2 × 176,160,768 = 2.114B$
- Weights (BF16): ≈ 4.23 GB
- Gradients (BF16): ≈ 4.23 GB
- Adam states (V+S, FP32): ≈ 16.9 GB
- Master weights (FP32): ≈ 8.46 GB
- **Total (persistent memory + gradients)**: ≈ 33.8 GB
- Adding frozen weight footprint and activation overhead, a 44 GB card requires:
  - `batch=1–2`
  - `seq_len ≤ 1024`
  - `use_cache=False`
  - `gradient_checkpointing=True`
- Feasible, but requires strict control.

---

### Case C: 4-bit Full Model + LoRA

Attach LoRA (r=16) to experts / router.

- LoRA parameters per expert:  
  $r × (4096+14336 + 4096+14336 + 14336+4096) = r × 55296$  
  → r=16 → 0.885M/expert
- 8 experts per layer: 7.08M
- 32 layers: 226.6M LoRA parameters
- Memory breakdown:
  - Weights ≈ 0.45 GB
  - Gradients ≈ 0.45 GB
  - Adam + Master ≈ 2.72 GB
  - Total ≈ 3.6 GB
- Well within the 44 GB memory budget

---

## 5. Parallelism Strategies

### Data Parallelism (DP)

- Each GPU holds a full model copy, processes different batches, gradients are aggregated
- Advantage: simple
- Disadvantage: high memory redundancy

### Distributed Data Parallelism (DDP)

- One process per GPU, gradients synchronized in buckets
- Advantage: mainstream, stable
- Disadvantage: still requires full model on each GPU

### ZeRO Optimization (DeepSpeed)

- ZeRO-1: shard optimizer states
- ZeRO-2: also shard gradients
- ZeRO-3: shard parameters as well
- Advantage: memory-efficient
- Disadvantage: complex communication

### Model Parallelism

- **Tensor Parallelism (TP)**: split matrices across devices
- **Pipeline Parallelism (PP)**: split layers, like an assembly line
- **MoE Parallelism**: experts distributed across different devices, tokens activate a subset of experts

---

## 6. Lessons Learned

- Memory fragmentation:  
  `PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True`  
  (must be set before `import torch`)
- Communication library:  
  NCCL > Gloo > MPI (unless in special environments)
- DDP: must synchronize random seed
- Evaluation:
  - eval_mb_size can be larger
  - small training batch + gradient accumulation
  - disable `model.config.use_cache`
- device = "auto": HuggingFace will automatically distribute different parts of the model based on your GPU memory. For large models like 7B on a single 44 GB card: attention + embedding + some FFN layers typically go on GPU, while frozen modules or inactive MoE experts can offload to CPU. This is great for inference but **requires caution during training** — parameters that need gradients must reside on GPU at all times, otherwise each forward/backward pass involves moving parameters back and forth, causing catastrophic communication overhead. Therefore, **device_map=auto is not always safe for training** as it may place trainable layers on CPU, leading to slow or non-functional training.

---

Author: **Yang Lewis**  
Non-commercial reproduction must credit the source.  
For commercial use, contact the author: **840691168ly@gmail.com**
