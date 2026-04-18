---
title: Introduction of Multi-Agent Systems (For Any Task You Want)
description: ""
date: "2025-09-29"
tags:
  - multi-agent-systems
  - agent-framework
  - llm-agents
docId: h53uwefhlykt9ietsx9x0vtn
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Introduction of Multi-Agent Systems (For Any Task You Want)

Overview of Multi-Agent Systems

## 1. What Is a Multi-Agent System (MAS)?

A Multi-Agent System (MAS) is a computational system composed of multiple relatively autonomous agents that interact, cooperate, or compete within a shared environment to achieve individual or collective goals.
It focuses not on the optimal behavior of a single agent, but on the organization, coordination, and emergent behavior at the group level.
Note: Emergent behavior refers to behaviors that arise from the interaction and collaboration of multiple agents that no single agent could accomplish alone. For example, flocks of birds follow simple rules to produce elegant formations that resist air currents — formations that were never explicitly designed.
Intuitive understanding: Think of LLMs as multiple "roles" that simulate team/department collaboration to complete tasks together.

## 2. Typical Applications and Problem Types

Real-world distributed problems: power grid scheduling, intelligent transportation, supply chains, disaster response — all naturally exhibit distributed, dynamic, and uncertain characteristics that monolithic systems struggle to handle with global optimality and robustness.

Example research directions: generation, translation, repair, judge, etc.

## 3. Core Concepts in Multi-Agent Systems

### 3.1 Agent

A computational entity that operates in an environment through a Perception — Deliberation/Policy — Action cycle.

Typical properties: autonomy, reactivity, proactiveness (initiative), sociability (ability to interact).

### 3.2 Environment

The object that agents perceive and act upon; can be fully/partially observable, deterministic/stochastic, static/dynamic, discrete/continuous.

| Dimension                                      | Definition                                                                                                                   | Characteristics / Key Points                                                                                                                                                                               | Typical Examples                                                                                                                                                     | Impact on Agent Design                                                                                                                                                                                                                                          |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fully Observable vs Partially Observable       | Whether the agent can perceive the full state of the environment at every moment                                             | If fully observable, the agent can make decisions based on the current state directly; if partially observable, hidden information exists and the agent may need internal memory and uncertainty reasoning | Chess is fully observable; poker (where opponents' hands are hidden) is partially observable                                                                         | In partially observable environments, agents typically need to maintain a **belief state** (probability distribution over true states) or an internal state model, making policies more complex                                                                 |
| Deterministic vs Stochastic / Nondeterministic | Whether a given state + action leads to a unique next state/outcome, or multiple possible outcomes/probability distributions | Deterministic: action + current state uniquely determine the next state; stochastic/nondeterministic: multiple possible transitions with probability distributions                                         | Board games (e.g., chess) are approximately deterministic; real-world robot manipulation and traffic systems often involve stochasticity                             | In stochastic environments, agent policies must account for expectations/distributions/risk, e.g., probabilistic policies, reinforcement learning, robust design                                                                                                |
| Static vs Dynamic                              | Whether the environment can change while the agent is deliberating/acting                                                    | Static: environment remains unchanged during the agent's decision-making; dynamic: the environment may evolve while the agent thinks/acts                                                                  | In a turn-based board game, the environment is static during the current agent's turn; traffic systems are dynamic as other vehicles/pedestrians continuously change | In dynamic environments, agents need fast response, real-time planning, and future prediction capabilities — they cannot afford costly computation delays                                                                                                       |
| Discrete vs Continuous                         | Whether the state, action, and time of the environment form a discrete/enumerable set or a continuous/real-valued domain     | Discrete: states/actions/time are enumerable or discrete; continuous: these quantities vary over real-valued domains                                                                                       | Board games, grid worlds, turn-based games are discrete; robot positions/velocities/accelerations, drone control are continuous                                      | In continuous environments, agents typically use function approximation (neural networks, control models), continuous policies, differential equations, or continuous action optimization; in discrete environments, enumeration, search, and discrete RL apply |

### 3.3 Interaction

Forms include communication, negotiation, competition, cooperation, game theory, etc.

### 3.4 Organization

The totality of roles, hierarchies, norms, protocols, and team structures.

|               Component                | Meaning / Function                                                                                                                                    | Common Design Approaches / Examples                                                                                                            | Considerations / Trade-offs                                                                                                                                         |
| :------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|                 Roles                  | Each agent's functional position and behavioral responsibilities in the organization. Roles abstract behavioral interfaces and capability constraints | "Planner" role handles task decomposition; "Executor" handles execution; "Critic" handles evaluation; "Communicator" handles information relay | Responsibilities must be clear and not overly overlapping; avoid strong role coupling; capabilities and resource allocation must match                              |
|               Hierarchy                | Superior-subordinate relationships among roles/agents, directing control, supervision, and command flow                                               | Manager/Worker architecture: high-level agents make strategic decisions, low-level agents execute; multi-level nesting (macro → meso → micro)  | Hierarchy helps manage complexity and maintain clear command flow; but too many levels can cause communication bottlenecks, delays, and single points of failure    |
|        Norms / Normative Rules         | Conventions or hard rules that constrain agent behavior, coordinate conflicts, and ensure safety                                                      | E.g., "cannot access the same resource simultaneously," "respond to urgent tasks first," "cannot act beyond assigned roles"                    | Too loose leads to chaos; too strict reduces flexibility; penalty mechanisms / compliance checks must be designed                                                   |
|   Protocols / Interaction Protocols    | Mechanisms and conventions for how agents communicate, negotiate, trade, synchronize, and deliberate                                                  | Auction, Contract Net, Negotiation Protocol, Consensus                                                                                         | Must consider performance (communication cost, latency), robustness (error handling, failure recovery), expressiveness (whether semantic interaction is sufficient) |
| Team Structure / Coalitions / Grouping | How agents are organized into sub-teams or collaborative groups, and how these groups cooperate                                                       | Static teams (fixed groupings), dynamic teams (task-triggered groupings), cross-team coalitions                                                | Must adapt to task requirements and capability distribution; dynamic structures increase flexibility but incur reorganization costs and coordination overhead       |

### 3.5 Goals/Utility

Individual goals and global social welfare may be aligned or conflicting, involving mechanism design. The ultimate aim should be toward task completion and utility maximization.

## 4. System Composition and Typical Architectures

### 4.1 Agent Internal Architecture

**Reactive/Behavior-based**: e.g., subsumption architecture (layered behaviors) — fast response but weak planning.

**BDI (Belief–Desire–Intention)**: models rational decision-making through beliefs/desires/intentions, suitable for interpretable planning scenarios.

**Learning-based**: based on RL/supervised/self-supervised learning; in MARL, policies can be shared or trained independently.

**LLM-Agent**: uses a large language model as the core, combined with tool calling, memory, retrieval, reflection, and actuators; excels at complex reasoning and open-environment tasks.

### 4.2 Multi-Agent Architectures

**Centralized Orchestration (Orchestrator)**: central scheduling (e.g., Planner/Router) assigns tasks; provides a strong global view but has a single point of failure.

**Distributed Cooperation (Peer-to-Peer)**: agents interact as equals; high elasticity but complex protocols.

**Hierarchical/Hybrid**: upper-level planning, lower-level execution; balances global and local efficiency.

**Blackboard / Shared Memory**: agents exchange hypotheses and partial solutions through a shared workspace.

### 4.3 Communication and Coordination Mechanisms

Communication languages/protocols: early examples include KQML, FIPA-ACL; in engineering practice, MQ/HTTP/gRPC and structured messages (JSON/Proto) are commonly used.

### 4.4 Coordination Methods

**Contract Net and Auction/Bidding**: suitable for task assignment and resource competition.

**Negotiation/Voting/Consensus**: e.g., Paxos/Raft or multi-party voting strategies.

**Formation/Grouping and Role Switching**: formation control, dynamic role assignment.

**Mechanism Design**: uses incentive-compatible rules to guide individual rational behavior toward desired collective outcomes.

**Organizational Structures**: Hierarchy, Holarchy, Team/Coalition, and Roles & Norms-based social organization.

### 4.5 Key Points in Multi-Agent Reinforcement Learning (MARL)

**Non-stationarity**: changes in others' policies cause the environment to appear non-static to any individual agent, making training harder.

**Training-execution paradigm**: Centralized Training, Decentralized Execution (CTDE) is the dominant approach.

### 4.6 Method Families (Examples)

**Value decomposition**: VDN, QMIX decompose global value into individual values.

**Actor-Critic**: e.g., MADDPG (centralized Critic, decentralized Actor).

**Opponent modeling / Game learning**: Nash equilibrium, transferable policies, meta-learning.

Key challenges: credit assignment, scalability, partial observability, exploration-exploitation balance, communication bandwidth and latency.

## 5. LLM-Driven Multi-Agent Paradigm (Main Focus)

### 5.1 Role Division

- Planner
- Researcher (retrieval/analysis)
- Coder/Executor (tool execution)
- Critic/Verifier (review and validation)
- Refiner (repair)

### 5.2 Collaboration Patterns

**Debate/Deliberation**: mutual evaluation to improve reasoning robustness.

**Reflection/Memory**: experience summarization, long-term memory stores, external knowledge retrieval.

**Graph-of-Agents**: explicitly represents task workflow as a DAG/state machine.

### 5.3 Engineering Considerations

- Prompt templating
- Tool/database/code executor integration
- Message routing and caching
- Cost and latency control
- Security (privilege escalation / data leakage / injection)

## 6. Recommended Classic Papers / Works

- AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation
- CAMEL: Communicative Agents for "Mind" Exploration of LLM Society
- Improving Factuality and Reasoning in Language Models through Multi-Agent Debate
- Should We Be Going MAD? A Look at Multi-Agent Debate
- Reflexion: Language Agents with Verbal Reinforcement Learning
- Self-Refine: Iterative Refinement with Self-Feedback
- Language Agents as Optimizable Graphs (GPTSwarm)
- Graph of Thoughts: Solving Elaborate Problems with LLMs
