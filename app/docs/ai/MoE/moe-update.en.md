---
title: "Theory of MoE"
description: ""
date: "2025-10-05"
tags:
  - tag-one
docId: db3qwg25h6l0bh8f2sdabdqc
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Theory of MoE

## Basic Formula Definitions

For a vector $w$, let $\|w\|_2$ and $\|w\|_\infty$ denote its $\ell_2$ norm and $\ell_\infty$ norm, respectively.

Given positive constants $c_1, c_2$, we define:

- $x = \Omega(y)$, if $x > c_2 |y|$;
- $x = \Theta(y)$, if $c_1 |y| \lt x \lt c_2 |y|$;
- $x = O(y)$, if $x \lt c_1 |y|$;
- $x = o(y)$, if $\dfrac{x}{y} \to 0$.

Where:

- $O(y)$: upper bound, meaning "grows no faster than $y$".
- $\Omega(y)$: lower bound, meaning "grows at least as fast as $y$".
- $\Theta(y)$: both upper and lower bounds are on the order of $y$, meaning "same order as $y$".
- $o(y)$: strictly much smaller than $y$, ultimately approaching $0$.

## **Key Assumptions**:

1. This paper aims only to derive closed-form forgetting formulas, so it simplifies directly to a linear model: $f(X)=X^{\top}w,\; w\in \mathbb{R}^d$

2. This paper only discusses task-wise routing methods. During data generation, each sample contains only one signal, with all other entries as Gaussian noise. This is again for model simplification. In practical engineering, tokens are implicitly routed to various experts rather than using manually specified routing.

> ### Dataset Generation Rules
>
> At each training round $t \in [T]$, when a new task $n_t$ arrives, the dataset $\mathcal{D}_t = (X_t, y_t)$ is generated as follows:
>
> 1. **Sample the ground truth vector for the task**
>    - Uniformly sample a ground truth vector $w_{n_t}$ from the task pool $\mathcal{W} = \{w_1, \dots, w_N\}$, and set $w_{n_t}$ as the ground truth for the current task.
> 2. **Generate scaling coefficient**
>    - Independently sample a random variable $\beta_t \in (0, C)$, where $C = \mathcal{O}(1)$.
> 3. **Construct input feature matrix $X_t$**
>    - Generate from $s_t$ samples:
>      - **One sample** is defined as $\beta_t v_{n_t}$, where $v_{n_t}$ is the feature signal of task $n_t$.
>      - The remaining $s_t - 1$ samples come from a Gaussian distribution: $\mathcal{N}(0, \sigma_t^2 I_d)$, where $\sigma_t \ge 0$ is the noise level.
> 4. **Generate output labels $y_t$**
>    - Using linear regression:
>      $$
>      y_t = X_t^\top w_{n_t}
>      $$
>
> **Result**:  
> Dataset $\mathcal{D}_t = (X_t, y_t)$, corresponding to a linear regression task.

3. This paper uses Top-1 expert selection only.

## Formula Theory:

Expert parameter update:
When the router selects a particular expert, all other experts remain unchanged; only the selected expert is updated, according to the following formula:

$$
w_t^{(m_t)} = w_{t-1}^{(m_t)} + X_t (X_t^\top X_t)^{-1}(y_t - X_t^\top w_{t-1}^{(m_t)})
$$

> ### Derivation of the Expert Parameter Update Formula
>
> **Objective**: At round $t$, expert $m_t$ must fit the task dataset $(X_t, y_t)$  
> $$ \min\_{w}\ \|X_t^\top w - y_t\|\_2^2 $$
>
> **Problem**: Under overparameterization ($s_t &lt; d$), the solution is non-unique; directly computing the least-squares solution discards historical information.  
> &gt; Therefore, the paper reformulates it as a **constrained optimization**:
>
> $$
> \min_w \ \|w - w_{t-1}^{(m_t)}\|_2^2 \quad
> s.t.\ \ X_t^\top w = y_t
> $$
>
> **Solution**: Using Lagrange multipliers or residual projection, the update is:
>
> $$
> w_t^{(m_t)} = w_{t-1}^{(m_t)} + X_t (X_t^\top X_t)^{-1}\,(y_t - X_t^\top w_{t-1}^{(m_t)})
> $$
>
> **Interpretation**:
>
> - $(y_t - X_t^\top w_{t-1})$ = **residual** = true output − old prediction
> - $X_t (X_t^\top X_t)^{-1}$ = the correction term that projects the residual back into parameter space
> - The entire expression = a least-squares correction near the old parameters
>
> **Properties**:
>
> - Guarantees $X_t^\top w_t = y_t$ → the new parameters perfectly fit the current task
> - Stays as close as possible to $w_{t-1}$ → minimizes catastrophic forgetting

Auxiliary loss (also commonly referred to as load balance):

$$
L_t^{\text{aux}}(\Theta_t, \mathcal{D}_t) = \alpha \cdot M \cdot \sum_{m \in [M]} f_t^{(m)} \cdot P_t^{(m)}
$$

> ### Auxiliary Loss
>
> **Parameter explanation**
>
> - $\alpha$: weighting coefficient, controls the proportion of auxiliary loss in the total loss
> - $M$: number of experts
> - $f_t^{(m)}$: frequency with which expert $m$ has been selected in the first $t$ rounds (historical usage)
> - $P_t^{(m)}$: average routing probability assigned to expert $m$ by the router at round $t$
>
> **Purpose**
>
> - Penalizes experts that have been frequently used historically and are still assigned high probability in the current round
> - Encourages the router to make greater use of underutilized experts
> - Achieves **load balancing** to prevent experts from being over- or under-used
> - The trailing term is intuitively clear: when an expert $m$ has been used many times historically and is still assigned large logits in the current round, this loss term becomes very large, suppressing the router's preference for a few experts and thus preventing routing collapse

Locality loss:

$$
L_t^{\text{loc}}(\Theta_t, \mathcal{D}_t) = \sum_{m \in [M]} \pi_m(X_t,\Theta_t)\, \|w_t^{(m)} - w_{t-1}^{(m)}\|_2
$$

> ### Locality Loss
>
> **Parameter explanation**
>
> - $\pi_m(X_t,\Theta_t)$: probability assigned to expert $m$ by the router (softmax output)
> - $w_t^{(m)}$: parameters of expert $m$ under the current task
> - $w_{t-1}^{(m)}$: parameters of expert $m$ from the previous round
>
> **Purpose**
>
> - Constrains expert parameter updates from deviating too far from historical values
> - Encourages similar tasks to be routed to the same expert, thereby reducing loss
> - Reduces forgetting (updates for new tasks do not completely overwrite old knowledge)
> - Improves expert **specialization**: each expert gradually stabilizes on a particular type of task

Training loss:

$$
L_t^{\text{tr}}(w_t^{(m_t)}, \mathcal{D}_t) = \frac{1}{s_t}\,\|X_t^\top w_t^{(m_t)} - y_t\|_2^2
$$

> ### Training Loss
>
> **Parameter explanation**
>
> - $s_t$: number of data samples for the current task
> - $X_t$: feature matrix
> - $y_t$: output label vector
> - $w_t^{(m_t)}$: parameters of the expert selected at round $t$
>
> **Purpose**
>
> - Essentially the mean squared error (MSE) of least-squares regression
> - Makes the selected expert fit the current task data
> - Ensures the expert can capture the true signal (ground truth) of the task

Total loss:

$$
L_t^{\text{task}} = L_t^{\text{tr}} + L_t^{\text{loc}} + L_t^{\text{aux}}
$$

With the above total loss function, router parameter updates can be performed during training.

Router update formula:

$$
\theta_{t+1}^{(m)} = \theta_t^{(m)} - \eta \cdot \nabla_{\theta^{(m)}} L_t^{\text{task}}(\Theta_t, w_t^{(m_t)}, \mathcal{D}_t), \quad \forall m \in [M]
$$

### Tricks:

#### Early Termination

In continual learning (CL) scenarios, if the gating network continues to update indefinitely, the allocation probabilities across different experts may gradually converge as more tasks arrive, eventually causing **expert differentiation to collapse** and **routing errors**. To address this, an **Early Termination** mechanism must be introduced.

- **Core Idea**  
  After sufficient rounds of task exploration ($T_1$ rounds), the expert assignments in MoE should gradually converge. Continuing to train the gating network at this point no longer yields benefits and instead leads to overfitting and blurring of task boundaries. Therefore, at an appropriate time, **updates to the router parameters $\Theta_t$ should be terminated** to maintain the stability of expert assignments.

- **Convergence Criterion**  
  Define a convergence indicator $I^{(m)}$ to measure whether expert $m$ has converged:

  $I^{(m)} = \big| h_m(X_t, \theta_t) - h_{m_t}(X_t, \theta_t) \big|$

  where $h_m(X_t,\theta_t)$ denotes the gating output of expert $m$ on the current input, and $h_{m_t}(X_t,\theta_t)$ denotes the output of the expert actually selected by the router.
  - If this gap is **larger than threshold $\Gamma$**, expert $m$ has not yet converged and $\Theta_t$ should continue to be updated.
  - If this gap is **smaller than threshold $\Gamma$**, the gating network is considered converged and updates to $\Theta_t$ are stopped.
  - This prevents the router from continuing to update after convergence, which would otherwise destroy expert assignments. It also ensures that different experts stably serve their respective task clusters. Combined with the constraints of $L^{loc}$ and $L^{aux}$, the early termination mechanism enables the system to maintain balance and low forgetting in CL environments over the long term.

#### Multiple Variants of Locality Loss

- **Parameter Locality**

$$
 L^{loc}_{param} = \sum_{m \in [M]} \pi_m(X_t,\Theta_t)\,\|w_t^{(m)} - w_{t-1}^{(m)}\|_2
$$

    - The method used in the preceding sections.
    - Ensures that the parameter differences for the same expert across adjacent tasks are not too large.

- **Representation Locality** — Constraints can be applied directly to the representations (hidden states) output by each expert.

      - For example:

  $$
  L^{loc}_{repr} = \sum_{m \in [M]} \pi_m(X_t,\Theta_t)\,\|f_m(X_t) - f_m(X_{t-1})\|_2
  $$

      - Keeps similar inputs stable on the same expert.

- **Routing Locality** — Constrains the router's assignment probabilities from jumping too drastically between tasks.

      - Of the form:

  $$
  L^{loc}_{route} = \sum_{m \in [M]} \|\pi_m(X_t,\Theta_t) - \pi_m(X_{t-1},\Theta_{t-1})\|_2
  $$

- **Task Embedding Locality**
  - If task embeddings can be constructed (e.g., via meta-learning or contrastive learning), one can define:
    - Similar tasks → routed to the same expert
    - Dissimilar tasks → differentiated as much as possible
