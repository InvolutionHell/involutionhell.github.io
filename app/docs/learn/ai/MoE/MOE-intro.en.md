---
title: A Brief Introduction to MoE
description: "A brief introduction to the Mixture of Experts (MoE) architecture"
tags:
  - MoE
  - AI
docId: qftv72k0kzwiz8ddksbcl2aw
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Mixture of Experts (MoE) Architecture

To effectively scale model parameters without significantly increasing computational demands, the MoE architecture has emerged as a viable solution. MoE leverages a set of specialized sub-models and a gating mechanism to dynamically select the appropriate "expert network" for a given input. This enables the model to allocate computational resources on demand — a concept known as **conditional computation**.

MoE has been widely adopted in large language models (LLMs), enabling these models to achieve corresponding capability improvements as their parameter counts scale significantly.  
For example, **Mixtral-8x7B** proposed by Mixtral AI activates only 13 billion parameters yet **outperforms or matches Llama-2-70B and GPT-3.5 on multiple benchmarks**.

---

## Traditional MoE Architecture

Since MoE was first introduced into the Transformer architecture, it has primarily served as a replacement module for the **Feed-Forward Network (FFN)**. Typically, each expert in a MoE layer directly replicates the FFN structure it replaces, with a Router trained to decide which expert should handle a given input.

![](./MOE-intro.assets/img-20250920112106486.png)

MoE is applied mainly to the FFN layer rather than the self-attention layer, for the following reasons:

- **Attention layers**: lower sparsity, better suited for global interactions.
- **FFN layers**: higher sparsity, more domain-specific.  
  DS-MoE found that when using Wikitext as the task, only **20%** of FFN experts were activated,  
  while the attention layer activation rate was as high as **80%**. This high utilization rate indicates that the core communication mechanism of attention layers is incompatible with expert specialization. Conversely, FFN layers — with their sparse characteristics — have the full potential for multi-expert specialization.

![](./MOE-intro.assets/img-20250920112106518.png)

---

## Routing Mechanisms: Dense MoE vs Sparse MoE

![](./MOE-intro.assets/img-20250920112106554.png)

- **Dense MoE**
  - The gate uses a **softmax** routing mechanism for input tokens, passing a certain weight to each expert.
  - Advantage: training is stable.
  - Disadvantage: all experts must be computed every time, leading to high computational cost.

- **Sparse MoE**
  - Uses a **Top-K** routing mechanism, activating only the K experts with the highest weights.
  - Advantage: drastically reduces computation — this is the strategy used by current mainstream models (e.g., GShard, Switch Transformer, Mixtral, DeepSeek-MoE).
  - Disadvantage: Router training becomes more complex, prone to the issue where "popular experts are used too often while underutilized experts learn nothing" — known as **routing collapse**.
  - Solution: additional **load balancing loss** must be introduced during training.

---

## Choosing the Number of Experts

**GLaM (Google, 2021)** explored combinations of different expert counts and gating strategies:  
It found that **64 experts (per layer) + Top-2 gating** achieves the best balance between performance and computational efficiency.  
Top-2 gating significantly improves results and is more stable than a single expert. The 64-expert configuration also performs well in **zero-shot, one-shot, and few-shot** settings. Consequently, many subsequent MoE works (e.g., Mixtral, DBRX, DeepSeekMoE) have adopted a scale of ≤64 experts, making this design a practical reference.

---

## MoE and PEFT

There remains substantial interest in PEFT (Parameter-Efficient Fine-Tuning).  
The paper [_Pushing Mixture of Experts to the Limit: Extremely Parameter Efficient MoE for Instruction Tuning_](https://arxiv.org/abs/2309.05444) was the first to propose **combining LoRA-type PEFT methods with the MoE framework**.  
The core idea is to apply LoRA not to the entire large model, but specifically within the MoE expert modules. Since each MoE expert is an FFN (MLP) — the key location for knowledge storage — only a small set of LoRA experts are updated at a time, greatly enhancing scalability.

![](./MOE-intro.assets/img-20250920112106588.png)

The core idea of this method is to use **low-rank approximate updates** to avoid high-cost fine-tuning.

1. **Input (Input → Embedding)**
   - Input tokens (characters or subwords) first pass through an Embedding layer.
   - This part is the same as in a standard Transformer.

2. **Multi-Head Attention**
   - Input embeddings enter the multi-head attention module.
   - Q, K, V remain fully intact and are not modified by LoRAMoE.
   - The output goes through **Add & Norm**, and the result is passed to the FFN.

3. **FFN → MoE (Expert Routing)**
   - The standard Transformer FFN is replaced by a **LoRA + MoE expert network**.
   - The Router selects a subset of experts based on the input; each expert is a **LoRA-adapted (low-rank) module**, not a fully trainable FFN.
   - Frozen parts (❄️) are the pre-trained backbone of the large model.
   - Fire (🔥) represents the LoRA Adapter (trainable parameters, low-rank matrices).
   - The weighted combination output by the Router:

   $$
   y = \sum_i \alpha_i \cdot Expert_i(x)
   $$

   where $\alpha_i$ is the weight computed by the Router for the given input.

4. **Output (Add & Norm → Residual)**
   - The expert-mixed output from the Router, combined with the residual connection, enters Add & Norm and continues to the next layer.

---

#### LoRA Breakdown

The core idea of LoRA (Low-Rank Adaptation):

For a large linear layer weight $W \in \mathbb{R}^{d_{out} \times d_{in}}$, instead of training the entire matrix, a low-rank approximate update is added:

$$
W' = W + \Delta W, \quad \Delta W = BA
$$

- $A \in \mathbb{R}^{r \times d_{in}}, B \in \mathbb{R}^{d_{out} \times r}$
- Rank $r \ll d_{in}, d_{out}$, typically a single digit to a few tens
- $W$: frozen (❄️, pre-trained parameters)
- $A, B$: trainable (🔥, significantly fewer parameters)

Thus, when an input vector $x$ passes through the LoRA linear layer:

$$
Wx + BAx
$$

equals **the original backbone output + a small low-rank correction**.

Returning to the diagram, each expert $Expert_i$ is not a brand new large FFN, but rather **a combination of LoRA adapters over an FFN**:

$$
Expert_i(x) = B_i A_i x
$$

- The Router computes a distribution $\alpha$ over the input hidden state, then applies a weighted combination:

$$
y = \sum_i \alpha_i \cdot Expert_i(x)
$$

- The final result is added to the backbone (frozen FFN weight output):

$$
y_{final} = W_{FFN}x + \sum_i \alpha_i \cdot B_i A_i x
$$

---

Author: **Yang Lewis**  
Non-commercial reproduction must credit the source.  
For commercial use, contact the author: **840691168ly@gmail.com**
