# Product Guide

## Initial Concept

SparksApp is a modular application platform for "sparks"—interactive micro-experiences. While it has a rich set of existing sparks, the core focus is now on radically accelerating and improving the process of third-party contribution.

## Vision: The "Sparksmith" Agent

To achieve a step-change in developer velocity and contribution quality, the next phase of development will focus on creating the **Sparksmith Agent**. This will be a specialized AI sub-agent, powered by the Gemini CLI, designed to be an expert assistant for building new sparks. The goal is to make creating a spark as simple as having a conversation with an expert pair programmer who knows the SparksApp architecture inside and out.

## Target Audience

The primary users are external developers and contributors who want to build and submit their own sparks to the platform with minimal friction.

## Key Deliverables & Agent Capabilities

The Sparksmith Agent will be the primary deliverable. Its core capabilities will include:

### 1. Interactive Scaffolding

- **Conversational Setup:** Instead of a static CLI tool, the agent will engage the developer in a dialogue to understand the new spark's requirements (e.g., "Does your spark need to store data?", "Will it need to access the camera?").
- **Intelligent File Generation:** Based on the conversation, the agent will generate all necessary boilerplate files (`.tsx`, `settings.ts`, etc.), automatically including the correct "Spark-way" imports and setup for storage, settings, image selection, and haptics, directly following project conventions.

### 2. Guided Development & Convention Enforcement

- **Best Practice Injection:** The agent will proactively provide code snippets and guidance that adhere to SparksApp's architectural patterns. For example, when a developer wants to add a button, the agent will provide the code for the project's custom `StyledButton` component.
- **Real-time Validation:** The agent will offer commands to run linters, type-checkers, and tests within the development loop, ensuring contributions are high-quality before a pull request is even created.

### 3. Streamlined Submission

- **Automated PR Generation:** Once development is complete, the agent will automate the creation of a pull request, ensuring it follows the repository's contribution guidelines and templates.

## Performance and Stability

- As a secondary goal, overall app performance and stability will be monitored and improved, ensuring the platform remains robust as new sparks are added. The Sparksmith Agent itself will contribute to this by enforcing code quality and consistency.