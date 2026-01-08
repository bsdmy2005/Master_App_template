# Black Glass: AI-Powered Trading and Treasury Business Automation Platform
## Summary Table of Contents and Use Case Analysis

**Date:** November 30, 2025  
**Version:** 1.1

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Standard Bank Group](#standard-bank-group)
3. [Navigate (NAV)](#navigate-nav)
4. [Momentum Group](#momentum-group)
5. [Sanlam Financial Markets](#sanlam-financial-markets)
6. [Cross-Client Analysis](#cross-client-analysis)
7. [MVP Planning: SDK Gaps, Effort, and Complexity Analysis](#mvp-planning-sdk-gaps-effort-and-complexity-analysis)

---

## Executive Summary

| Client | Primary Use Case Focus | Number of User Stories | Key Systems | Core Benefit |
|--------|------------------------|------------------------|-------------|--------------|
| **Standard Bank Group** | Natural language trade input & cross-system execution | 6 | Alchemy, Murex EQD, Murex MXCORE | Streamline workflow by eliminating manual navigation across multiple systems |
| **Navigate (NAV)** | Centralized management of multi-instance Murex deployments | 9 | Murex (multiple instances) | Reduce costs, simplify version upgrades, abstract license requirements |
| **Momentum Group** | Middle office automation & intelligent testing | 7 | Murex | Scale capacity without headcount, eliminate cross-team coordination overhead |
| **Sanlam Financial Markets** | Version upgrade efficiency & testing automation | 5 | Murex | Accelerate upgrades without MXTEST subscription, rapid test pack creation |

---

## Standard Bank Group

### Client Overview

| Aspect | Details |
|--------|---------|
| **Organization** | Standard Bank of South Africa (SBSA) - Largest financial institution in Africa |
| **Systems** | Murex (flow trading - SA), Calypso (Africa), Alchemy (structuring) |
| **Challenge** | Multiple integration touchpoints, complex cross-system workflows |
| **Black Glass Solution** | Natural language input for front office, autonomous cross-system transaction execution |

### Use Cases Summary

| Use Case ID | Title | Description | Key Acceptance Criteria | SDK Gaps | Effort (Story Points) | Complexity | Man-Days | Required Effort for MVP |
|-------------|-------|-------------|-------------------------|----------|----------------------|------------|----------|------------------------|
| **US-1** | Natural Language Trade Input | Input trade instructions using plain English without system-specific syntax | • Accepts plain English instructions<br>• Handles multiple products/counterparties<br>• Provides immediate feedback on parse errors | • Domain-specific NLP model for trading terminology<br>• Trade instruction parser/validator<br>• Financial product ontology<br>• Real-time feedback mechanism | 13 | High | 27.5 | • Black Glass development infrastructure setup<br>• Context and prompt engineering to understand/describe trading landscape<br>• Generic front-end design (Next.js app) for natural language input capture<br>• Context engineering and build-up<br>• Infrastructure setup (EC2 machines, deployment, Kubernetes) |
| **US-2** | Autonomous Cross-System Execution | Automatically execute trades across Alchemy, Murex EQD, Murex MXCORE | • Routes to appropriate systems<br>• Handles dependencies between applications<br>• Confirms all transactions executed | • Multi-system connector/adapter framework<br>• Cross-system dependency orchestration<br>• Transaction state management across systems<br>• Alchemy-specific integration layer | 21 | High | 37.5 | • Extend Black Glass SDK to support Windows Accessibility API (for Alchemy C# application)<br>• Alternative: Create custom process to attach to Alchemy launch screen to traverse UI tree<br>• Integrate Windows Accessibility API or custom UI tree for Alchemy into existing SDK<br>• Build frontend to capture scope of trades<br>• Context engineering and knowledge capacity building<br>• Automate rules for system decision-making in product selection and orchestration<br>• Build feedback mechanism to show aggregated results<br>• Infrastructure setup (EC2, deployment, Kubernetes)<br>• Note: US-5 functionality (status updates, error handling, rollback) consolidated into this use case |
| **US-3** | Structured Product Booking | Book structured trade components in both Alchemy and appropriate Murex instance | • Identifies which components belong where<br>• Captures in Alchemy first, then Murex<br>• Maintains referential integrity | • Structured product decomposition logic<br>• Component-to-system mapping engine<br>• Cross-system referential integrity manager<br>• Transaction sequencing/ordering | 13 | High | 27.5 | • Same as US-2 (includes Alchemy SDK expansion)<br>• Build frontend wizard to capture selected scope products<br>• Context engineering to define rules for system identification and execution<br>• Build deterministic split logic for trades<br>• Note: US-5 functionality (status updates, error handling, rollback) consolidated into this use case |
| **US-4** | Multi-Instance Murex Routing | Automatically determine correct Murex instance(s) for each trade | • Analyzes trade characteristics<br>• Routes based on product type and business rules<br>• Handles multi-instance bookings | • Trade characteristic analyzer<br>• Business rules engine for routing<br>• Multi-instance coordination logic<br>• Instance discovery/registry | 8 | Medium | 17.5 | • Front-end application (Next.js) - "Murex Decision Maker"<br>• Embed rules and compliance information<br>• Allow users to specify products<br>• Support email uploads and pre-trade confirm uploads<br>• User can describe trade, system provides pre-selection list<br>• AI access with large context window to explain rules |
| **US-5** | Transaction Status & Error Handling | Clear status updates and error messages during processing | • Real-time status updates<br>• Clear error messages<br>• Shows partial failures with rollback options | • Real-time status event system<br>• Cross-system error aggregation<br>• Partial failure detection<br>• Rollback/compensation transaction framework | 8 | Medium | 0 | **Consolidated into US-2 and US-3** - Functionality is a subset of those use cases (status updates, error handling, rollback mechanisms) |
| **US-6** | Alchemy-Murex Integration Flow | Seamless handoff from structuring (Alchemy) to settlement (Murex) | • Captures structured product details in Alchemy<br>• Auto-flows to appropriate Murex instance<br>• Transparent integration handling | • Alchemy-to-Murex data transformation<br>• Workflow orchestration engine<br>• Integration touchpoint handlers<br>• Lifecycle tracking across systems | 13 | High | 27.5 | • Same exact requirements as US-3 |

### Benefits

- Streamlines workflow for front office users
- Automates cross-system transaction entry
- Improves efficiency in trade processing and settlement

---

## Navigate (NAV)

### Client Overview

| Aspect | Details |
|--------|---------|
| **Organization** | Fintech initiative of RMB, based in Republic of Ireland |
| **Business Model** | Leverage existing bank technologies for capital-light non-banking initiatives |
| **Current Initiative** | Implementing Murex for broader Africa region |
| **Challenge** | In-country hosting requirements create multiple Murex instances, high license costs |
| **Black Glass Solution** | Centralized management layer abstracting Murex complexity, license pooling |

### Use Cases Summary

| Use Case ID | Title | Description | Key Acceptance Criteria | SDK Gaps | Effort (Story Points) | Complexity | Man-Days | Required Effort for MVP |
|-------------|-------|-------------|-------------------------|----------|----------------------|------------|----------|------------------------|
| **US-1** | Centralized Configuration Management | Manage Murex configurations from single location | • Changes propagate to all instances<br>• Configuration versioning<br>• Audit trail maintained | • Configuration abstraction layer<br>• Multi-instance propagation engine<br>• Configuration version control system<br>• Configuration diff/merge capabilities | 13 | High | 27.5 | TBD |
| **US-2** | Single Regression Testing | Execute one regression suite across all geographic instances | • Tests defined once, run everywhere<br>• Aggregated results<br>• Reduced cycle time | • Multi-instance test execution framework<br>• Test result aggregation engine<br>• Geographic instance registry<br>• Parallel test orchestration | 13 | High | 27.5 | TBD |
| **US-3** | Coordinated Version Upgrades | Upgrade all instances through single coordinated process | • Centralized upgrade orchestration<br>• Pre-upgrade validation<br>• Rollback procedures available | • Version upgrade orchestration engine<br>• Pre-upgrade validation framework<br>• Rollback automation<br>• Upgrade state management | 21 | High | 37.5 | TBD |
| **US-4** | License Cost Abstraction | Abstract Murex named user license costs from end clients | • End users work without individual licenses<br>• License pool management<br>• Decoupled billing | • License pool manager<br>• Session/connection pooling<br>• License usage tracking<br>• Billing abstraction layer | 8 | Medium | 17.5 | TBD |
| **US-5** | Agent-Based Instruction Execution | Natural language instructions for Murex operations | • Natural language interface<br>• Instruction validation<br>• Execution on appropriate instance | • Domain-specific NLP for Murex operations<br>• Instruction-to-Murex command translator<br>• Instance routing logic<br>• Instruction validation framework | 13 | High | 27.5 | TBD |
| **US-6** | Centralized Financial Static Data | Maintain counterparties, portfolios, instruments centrally | • Central creation/updates<br>• Synchronized across instances<br>• Data validation enforced | • Centralized data repository<br>• Multi-instance synchronization engine<br>• Data validation rules engine<br>• Conflict resolution for concurrent updates | 13 | High | 27.5 | TBD |
| **US-7** | Centralized Non-Financial Static Data | Manage generators, curve configurations centrally | • Single source of truth<br>• Instance-specific overrides supported<br>• Change history tracked | • Configuration hierarchy manager<br>• Override/exception handling<br>• Change tracking/audit system<br>• Configuration inheritance logic | 8 | Medium | 17.5 | TBD |
| **US-8** | Centralized Trade Data Repository | Consolidate trade data from all instances | • Aggregated trade data<br>• Respects data sovereignty<br>• Synchronized with sources | • Trade data aggregation engine<br>• Data sovereignty/compliance filters<br>• Bi-directional synchronization<br>• Trade data deduplication | 13 | High | 27.5 | TBD |
| **US-9** | Multi-Instance Monitoring & Support | Unified interface for all geographic instances | • Real-time dashboard<br>• Aggregated alerts<br>• Performance metrics per instance | • Multi-instance monitoring framework<br>• Real-time metrics aggregation<br>• Alert correlation engine<br>• Dashboard/reporting system | 13 | High | 27.5 | TBD |

### Benefits

- Abstracts underlying Murex costs to end-users
- Enables centralized management of configurations and data
- Single regression exercise and version upgrades across geographies
- Dramatically reduced cost and risk for upgrades
- Abstracts named user license requirements

---

## Momentum Group

### Client Overview

| Aspect | Details |
|--------|---------|
| **Organization** | Buy-side player |
| **Primary Use** | Balance sheet management and LDI (Liability-Driven Investment) activities |
| **Teams** | Front office, back office, middle office, collateral, market risk, credit risk |
| **Challenge** | Manual middle office processes, inefficient regression testing |
| **Black Glass Solution** | End-to-end autonomous processes for middle office + intelligent testing |

### Use Cases Summary

| Use Case ID | Title | Description | Key Acceptance Criteria | SDK Gaps | Effort (Story Points) | Complexity | Man-Days | Required Effort for MVP |
|-------------|-------|-------------|-------------------------|----------|----------------------|------------|----------|------------------------|
| **US-1** | Automated Bond Creation from Pricing Supplement | Create bonds automatically from pricing supplement documents | • Accepts listed/OTC bond supplements<br>• Compares against JSE prices<br>• Validates cash flows against Murex logic<br>• Confirms creation or provides errors | • Document parsing (PDF/structured formats)<br>• Financial document extraction (bond terms, rates)<br>• External API integration (JSE price feeds)<br>• Cash flow validation engine<br>• Murex calculation logic wrapper | 21 | High | 37.5 | • Infrastructure setup<br>• Extend SDK to include browser use case navigation (search web for pricing supplements)<br>• Build mapping logic (similar to BSMT) to pick instrument in generator<br>• Build context window for system to understand existing bonds as references<br>• Build validation window for created instrument<br>• Extend pricing and build validation window (compare JSE vs Murex pricing, highlight errors) |
| **US-2** | End-to-End Counterparty Creation | Complete counterparty setup process autonomously | • Initiates after credit approval<br>• Creates counterparty in Murex<br>• Executes MLC synchronization<br>• Completes 4-eye validation<br>• Loads credit limits automatically | • Workflow orchestration engine<br>• MLC (Murex Limits Controller) integration<br>• 4-eye validation workflow automation<br>• Credit limit loading automation<br>• Approval workflow trigger handling | 21 | High | 37.5 | • Train Murex SDK to learn and understand MLC screen and 2-3 additional screens<br>• Murex infrastructure setup with OpenAI Engine API (external) |
| **US-3** | Automated Portfolio Creation | Create portfolios based on front office instructions | • Accepts front office instructions<br>• Captures portfolio tree structure<br>• Configures technical rules automatically<br>• Validates and confirms operational | • Portfolio hierarchy/tree builder<br>• Technical rule configuration engine<br>• Mirroring rules automation<br>• Portfolio validation framework<br>• Instruction parsing for portfolio creation | 13 | High | 27.5 | • Extend existing technology to set up portfolio across multiple screens<br>• Murex infrastructure setup<br>• Success validation and user confirmation of portfolio creation |
| **US-4** | End-to-End Regression Test Orchestration | Orchestrate complete testing process | • Orchestrates batch runs and market data imports<br>• Executes across entire ecosystem<br>• Real-time progress visibility<br>• Systematic result capture | • Batch job orchestration framework<br>• Market data import automation<br>• Ecosystem-wide test execution<br>• Real-time progress tracking<br>• Test result persistence system | 13 | High | 27.5 | • Extend existing Black Glass functionalities<br>• Full Next.js application with multiple features: assertion comparison, full testing suite functionalities, testing evidence capture and storage, full CRUD application with backend storage, AI-enabled testing<br>• Extend SDK to do screen captures |
| **US-5** | Root Cause Analysis | Identify root causes vs. symptoms | • Intelligent comparison of results<br>• Identifies root causes (fixings, data quality)<br>• Prevents duplicate reporting<br>• Categorizes by impact/severity | • AI/ML-based root cause detection<br>• Intelligent test result comparison<br>• Symptom vs. cause classification<br>• Root cause pattern matching<br>• Impact/severity categorization | 21 | High | 0 | **Out of Scope** - Separate analysis and data dependency project, outside scope of Black Glass AI project |
| **US-6** | Intelligent Root Cause Propagation | Map root causes across business areas | • Maps to all affected areas (FO/BO/MO/risk)<br>• Consolidated view linking symptoms<br>• Prevents duplicate investigations<br>• Historical pattern capture | • Cross-area impact mapping engine<br>• Symptom-to-root-cause linking<br>• Investigation tracking system<br>• Historical pattern database<br>• Knowledge graph for issue relationships | 13 | High | 0 | **Out of Scope** - Outside scope of Black Glass AI project |
| **US-7** | Workload Visibility and Metrics | Track efficiency gains and workload metrics | • Before/after metrics dashboard<br>• Time saved per process type<br>• Volume and error rate tracking<br>• Quantified capacity freed | • Metrics collection framework<br>• Dashboard/reporting system<br>• Before/after comparison engine<br>• Efficiency calculation algorithms<br>• Time tracking and attribution | 8 | Medium | 17.5 | • Subset of US-1, US-2, US-3 performance tracking<br>• Mechanism to track: time taken for system to perform tasks, success criteria (how often it succeeds without failure/issues) |

### Benefits

- Scale middle office capacity without headcount
- Eliminate cross-team coordination overhead
- Accelerate regression testing through automated orchestration
- Reduce duplicate investigation effort through intelligent root cause analysis
- Lower operational risk with automated validation and audit trails

---

## Sanlam Financial Markets

### Client Overview

| Aspect | Details |
|--------|---------|
| **Organization** | Subsidiary of Sanlam (largest insurer in Africa) |
| **Primary Use** | Asset Liability Management (ALM) and credit activities |
| **Role** | Specialized Insurance and ALM Manager for Sanlam group |
| **Challenge** | Need efficient version upgrades and testing without MXTEST subscription |
| **Black Glass Solution** | Automated testing for version upgrades + multi-modal test capture |

### Use Cases Summary

| Use Case ID | Title | Description | Key Acceptance Criteria | SDK Gaps | Effort (Story Points) | Complexity | Man-Days | Required Effort for MVP |
|-------------|-------|-------------|-------------------------|----------|----------------------|------------|----------|------------------------|
| **US-1** | Accelerated Version Upgrades | Automate testing during version upgrades | • Execute tests against new versions<br>• Reduced testing time<br>• Comprehensive, reliable results<br>• Works independently of MXTEST | • Version-specific test execution framework<br>• Test compatibility checker<br>• Automated test result analysis<br>• Version upgrade test orchestration | 13 | High | 27.5 | • Same as Momentum Group US-4 (End-to-End Regression Test Orchestration): Extend existing Black Glass functionalities, Full Next.js application with multiple features (assertion comparison, full testing suite functionalities, testing evidence capture and storage, full CRUD application with backend storage, AI-enabled testing), Extend SDK to do screen captures<br>• **Additional requirement:** Test cases need to be defined from scratch (no existing test cases available) |
| **US-2** | Alternative to MXTEST Subscription | Provide testing solution without MXTEST | • Comparable functionality to MXTEST<br>• Tests ALM and credit workflows<br>• Seamless Murex integration | • Murex testing framework (MXTEST replacement)<br>• ALM workflow test templates<br>• Credit workflow test templates<br>• Test execution engine for Murex | 21 | High | 0 | • Same as US-1 (consolidated with US-1) |
| **US-3** | Capture User Activity for Test Creation | Multi-modal capture of user interactions | • Captures interactions across Murex<br>• Records screen, audio, keyboard, mouse<br>• Converts to reusable automated tests<br>• Significantly reduced creation time | • Multi-modal capture system (screen/audio/keyboard/mouse)<br>• Activity-to-test converter<br>• Test script generation engine<br>• Murex UI element identification/mapping | 21 | High | 37.5 | • Access to Google Gemini for video processing (in addition to OpenAI)<br>• Create new application to consume video, process it, and translate to actionable features<br>• Full requirement development project<br>• Multi-modal video capture and processing capabilities |
| **US-4** | Automated Test Pack for ALM Operations | Capture and convert ALM workflows to tests | • Common ALM workflows captured<br>• Covers key asset-liability scenarios<br>• Re-runnable on demand<br>• Clear failure indicators | • ALM workflow library/templates<br>• Asset-liability scenario test builder<br>• Test pack organizer<br>• Failure analysis and reporting | 13 | High | 27.5 | • Combination of US-2 and US-3 requirements<br>• Define test case scenarios for ALM operations<br>• Define AI contexts for ALM operations<br>• Multi-modal video captures capturing user activity in ALM operation space<br>• All functional prerequisites from US-2 and US-3 |
| **US-5** | Automated Test Pack for Credit Operations | Capture and convert credit workflows to tests | • Common credit workflows captured<br>• Covers key credit activity scenarios<br>• Validates data integrity<br>• Quick regression before releases | • Credit workflow library/templates<br>• Credit activity scenario test builder<br>• Data integrity validation framework<br>• Regression test automation | 13 | High | 27.5 | • Combination of US-2 and US-3 requirements<br>• Same as US-4 but for credit operations<br>• Capture specific flow for credit operations business<br>• Define test case scenarios for credit operations<br>• Define AI contexts for credit operations<br>• Multi-modal video captures capturing user activity in credit operations space<br>• All functional prerequisites from US-2 and US-3 (repeated) |

### Benefits

- Accelerate Murex version upgrades through automated testing
- Rapidly build test packs using multi-modal capture technology
- Reduce manual test creation effort
- Ensure system stability with comprehensive automated testing

---

## Cross-Client Analysis

### Use Case Categories

| Category | Standard Bank | Navigate (NAV) | Momentum | Sanlam | Total |
|----------|---------------|----------------|----------|--------|-------|
| **Natural Language Interface** | 1 | 1 | - | - | 2 |
| **Cross-System Integration** | 3 | - | - | - | 3 |
| **Configuration Management** | - | 2 | - | - | 2 |
| **Testing & QA** | - | 1 | 3 | 5 | 9 |
| **Data Management** | - | 3 | - | - | 3 |
| **Process Automation** | 2 | 1 | 3 | - | 6 |
| **Monitoring & Support** | 1 | 1 | 1 | - | 3 |
| **Total User Stories** | 6 | 9 | 7 | 5 | 27 |

### Common Themes

1. **Testing Automation** - 9 user stories across 3 clients (NAV, Momentum, Sanlam)
2. **Process Automation** - 6 user stories across 3 clients (Standard Bank, NAV, Momentum)
3. **Natural Language Interface** - 2 user stories (Standard Bank, NAV)
4. **Configuration & Data Management** - 5 user stories (primarily NAV)

---

## Summary Statistics

- **Total Clients:** 4
- **Total User Stories:** 27
- **Average User Stories per Client:** 6.75
- **Primary System:** Murex (all clients)
- **Secondary Systems:** Alchemy, Calypso (Standard Bank only)

---

