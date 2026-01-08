Table of Contents
Black Glass: AI-Powered Trading and Treasury Business Automation Platform	2
Client Business Overview and Initial User Stories	2
Standard Bank Group	2
Client Context	2
Black Glass Use Case	2
Benefits	2
User Stories	3
Navigate (NAV)	6
Client Context	6
Black Glass Use Case	6
Benefits	6
User Stories	7
Momentum Group	11
Client Context	11
Black Glass Use Case	11
Benefits	12
User Stories	12
Sanlam Financial Markets	16
Client Context	16
Black Glass Use Case	16
Benefits	16
User Stories	16

 
Black Glass: AI-Powered Trading and Treasury Business Automation Platform
Client Business Overview and Initial User Stories
Date: November 30, 2025
Version: 1.1
Standard Bank Group
Client Context
•	SBSA (Standard Bank of South Africa) is the largest financial institution in Africa. 
•	They operate multiple instances of trading systems: 
o	Murex serves as the primary flow trading system for the South Africa business. 
o	Calypso is used for the broader Africa business. 
o	Alchemy is utilized for structuring activities that often span across several applications. 
•	Multiple integration touchpoints exist between these systems depending on which desk is using the application. 
Black Glass Use Case
•	The Black Glass solution would provide front office personnel with natural language input capabilities. 
•	Instead of manually navigating through various front office applications, users could input instructions in natural language. 
•	Black Glass would autonomously process these instructions and execute transactions across different applications including: 
o	Alchemy
o	Various Murex instances (e.g.: EQD and MXCORE)
o	Other required systems
Benefits
•	Streamlines workflow for front office users by eliminating the need to navigate multiple systems. 
•	Automates cross-system transaction entry based on natural language inputs. 
•	Improves efficiency in trade processing and settlement across SBSA's complex trading infrastructure. 
User Stories
 
User Story 1: Natural Language Trade Input
As a front office trader at SBSA
I want to input trade instructions using natural language
So that I can quickly specify what I need without having to remember system-specific syntax, navigation paths or booking systems.
Acceptance Criteria:
•	User can enter trade instructions in plain English
•	System accepts instructions that reference multiple products, counterparties, and booking requirements
•	System provides confirmation that the instruction has been received and understood
•	User receives immediate feedback if the instruction cannot be parsed
 
User Story 2: Autonomous Cross-System Transaction Execution
As a front office trader at SBSA
I want to Black Glass to automatically execute my trade instructions across Alchemy, Murex EQD, Murex MXCORE and other applications as needed.
So that I don't have to manually navigate and enter data into multiple applications
Acceptance Criteria:
•	Black Glass routes trade components to the appropriate system (Alchemy, Murex EQD, Murex MXCORE)
•	Transactions are created in all required systems based on a single natural language input
•	System handles dependencies between applications (e.g., structuring in Alchemy before settlement in Murex)
•	User receives confirmation when all transactions have been successfully executed across systems
 
User Story 3: Structured Product Booking Across Applications
As a structured products trader at SBSA
I want to book components of a structured trade in both Alchemy and the appropriate Murex instance through a single instruction
So that I can complete complex multi-system bookings efficiently without switching between applications
Acceptance Criteria:
•	System identifies which trade components belong in Alchemy (structuring) vs Murex (settlement/processing)
•	Structural components are captured in Alchemy first
•	Related trade processing and settlement entries are created in the correct Murex instance (EQD or MXCORE)
•	System maintains referential integrity between related transactions across systems
 
User Story 4: Multi-Instance Murex Routing
As a front office trader at SBSA
I want to Black Glass to automatically determine whether my trade should go to Murex EQD, Murex MXCORE, or both or other applications
So that I don't have to manually decide which Murex instance to use for each transaction
Acceptance Criteria:
•	System analyses trade characteristics to determine appropriate Murex instance(s)
•	Trades are routed to the correct Murex instance based on product type, desk, and business rules
•	User is notified which instance(s) the trade was booked in
•	System handles scenarios where a trade requires booking in multiple Murex instances
 
User Story 5: Transaction Status and Error Handling
As a front office trader at SBSA
I want to receive clear status updates and error messages when Black Glass processes my instruction
So that I can quickly identify and resolve any issues with my trade booking
Acceptance Criteria:
•	User receives real-time status updates as the instruction is processed across systems
•	Clear error messages are provided if booking fails in any system
•	User can see which systems successfully processed the transaction and which failed
•	Partial failures are clearly indicated with rollback options where appropriate
 
User Story 6: Alchemy-Murex Integration Flow
As a front office trader working on structured products at SBSA
I want to initiate a structuring activity in Alchemy that automatically flows through to Murex for settlement
So that I can ensure seamless handoff between structuring and processing without manual data re-entry
Acceptance Criteria:
•	Structured product details entered via natural language are captured in Alchemy
•	Relevant settlement and processing data automatically flows to the appropriate Murex instance
•	Integration touchpoints between Alchemy and Murex are handled transparently
•	User can track the full lifecycle of the trade across both systems
 

Navigate (NAV)
Client Context
•	NAV is a fintech initiative of RMB with a base in the Republic of Ireland
•	They aim to leverage existing bank technologies to offer services to external third parties, this for the purposes of capital light non-banking initiatives
•	Their first initiative is implementing the Murex application for their broader Africa region
•	NAV plans to fully support and manage this business activity through their entity
Black Glass Use Case
•	Local regulations in African countries require infrastructure to be hosted in-country
•	This creates complications with multiple Murex instances across different regions
•	Challenges include: 
o	Complex software release processes
o	Complicated version upgrades
o	Increased support team requirements
o	Complicated business interaction with the application
•	Current license costs for Murex would result in very high costs for NAV's target clients
Benefits
•	Black Glass could abstract the underlying cost of Murex to end-users/clients
•	Enables centralized management of configurations
•	Allows central management of transaction data, trade data, and static data (both financial and non-financial)
•	When changes are deployed, having one centralized source enables: 
o	Single regression exercise across different geographies
o	Single version upgrades
o	Dramatically reduced cost and risk for version upgrades across instances
•	Can abstract the need for named user licenses inside Murex
•	Business areas can provide instructions to the Black Glass agent for execution on Murex
User Stories
 
User Story 1: Centralized Configuration Management
As a NAV platform administrator
I want to manage Murex configurations from a single centralized location through Black Glass
So that I can deploy consistent configurations across all geographic instances without managing each instance separately
Acceptance Criteria:
•	Configuration changes can be made once in Black Glass and propagated to all instances
•	Configuration versioning is maintained centrally
•	Changes can be deployed to selected instances or all instances
•	An audit trail of configuration changes is available
 
User Story 2: Single Regression Testing Across Instances
As a NAV quality assurance manager
I want to execute a single regression test suite that validates functionality across all geographic Murex instances
So that I can reduce testing time and cost while ensuring consistent quality across all deployments
Acceptance Criteria:
•	Regression tests can be defined once and executed across multiple instances
•	Test results are aggregated and reported centrally
•	Failed tests clearly identify which geographic instance(s) are affected
•	Testing cycle time is reduced compared to per-instance testing
 
User Story 3: Coordinated Version Upgrades
As a NAV operations manager
I want to upgrade all Murex instances to a new version through a single coordinated process
So that I can minimize upgrade costs, reduce risk, and maintain version consistency across geographies
Acceptance Criteria:
•	Version upgrades can be planned and orchestrated from Black Glass
•	Pre-upgrade validation can be performed centrally
•	Rollback procedures are available if needed
•	All instances can be upgraded in a coordinated manner while respecting in-country hosting requirements
 
User Story 4: License Cost Abstraction
As a NAV commercial manager
I want to abstract Murex named user license costs from end clients
So that I can offer competitive pricing to mid-market African banks that would otherwise find Murex prohibitively expensive
Acceptance Criteria:
•	End users can interact with Murex functionality without requiring individual named licenses
•	Black Glass tracks and manages the pool of underlying Murex licenses
•	Client billing is decoupled from Murex licensing costs
•	Usage analytics are available to optimize license allocation
 
User Story 5: Agent-Based Instruction Execution
As a client business user
I want to provide instructions to the Black Glass agent in natural language
So that I can execute Murex operations without needing direct access to the Murex application or specialized training
Acceptance Criteria:
•	Users can submit instructions through Black Glass interface
•	Instructions are validated before execution
•	Actions are executed on the appropriate Murex instance
•	Execution results and confirmations are provided to the user
•	Audit trail of all agent-executed actions is maintained
 
User Story 6: Centralized Financial Static Data
As a NAV data governance manager
I want to maintain financial static data (counterparties, portfolios, instruments) in a central repository
So that I can ensure data consistency across all geographic instances and simplify data maintenance
Acceptance Criteria:
•	Financial static data can be created and updated centrally
•	Changes to static data are synchronized to all relevant geographic instances
•	Data validation rules are enforced centrally
•	Data lineage and audit trail are maintained
 
User Story 7: Centralized Non-Financial Static Data
As a NAV data governance manager
I want to maintain non-financial static data (e.g. generators, instruments, curve configurations) centrally
So that I can enforce consistent business rules and organizational structures across all deployments
Acceptance Criteria:
•	Non-financial configuration data is managed from a single source
•	Changes are distributed to geographic instances as appropriate
•	Instance-specific overrides are supported where required by local regulations
•	Change history is tracked and auditable
 
User Story 8: Centralized Trade Data Repository
As a NAV risk manager
I want to consolidate trade data from all geographic instances into a central repository
So that I can perform full regression testing in one application
Acceptance Criteria:
•	Trade data from multiple instances can be aggregated centrally
•	Data sovereignty and regulatory requirements are respected
•	Trade data remains synchronized with source instances
 
User Story 9: Multi-Instance Monitoring and Support
As a NAV support team member
I want to monitor and support all geographic Murex instances from a unified interface
So that I can efficiently manage the health and performance of the entire platform
Acceptance Criteria:
•	Dashboard provides real-time status of all geographic instances
•	Alerts and incidents are aggregated centrally
•	Support actions can be initiated through Black Glass
•	Performance metrics are available per instance and in aggregate
•	Support team can diagnose issues without direct Murex access
 
Momentum Group
Client Context
•	Momentum is a buy-side player using the Murex application for balance sheet management and LDI (Liability-Driven Investment) activities 
•	They have dedicated teams for various business areas: front office, back office, middle office, collateral, market risk, and credit risk
Black Glass Use Case
•	Scaling and improving middle office team efficiency through end-to-end autonomous processes 
o	Black Glass will be implemented for several business processes including: 
	Creating bonds using pricing supplements 
	The system will process the pricing supplement, compare with JSE price if listed, extract and validate flows against Murex data 
	Upon successful validation, it will confirm bond creation 
	Managing the counterparty creation process 
	Current process involves multiple departments: credit committee approval, middle office setup, Murex support team synchronization, and limit loading 
	Portfolio creation 
	Currently requires front office instructions, manual form completion by middle office, and technical configuration by Murex support
	Black Glass aims to convert these manual steps into one end-to-end autonomous process 
•	Accelerating and improving regression testing efficiency
o	Current challenges with existing MXTEST vendor solution:
	Orchestration issues when testing the application within the client's ecosystem
	Manual handling of batch runs and market data imports
	Non-intelligent comparisons making issue identification difficult
o	Black Glass aims to:
	Orchestrate end-to-end testing processes
	Identify root causes of issues rather than symptoms
	Intelligently propagate root cause information across different areas to prevent multiple teams investigating the same issue

Benefits
•	Scale middle office capacity without headcount by automating end-to-end processes for bond creation, counterparty setup, and portfolio configuration that currently require coordination across multiple teams
•	Eliminate cross-team coordination overhead by replacing manual handoffs between middle office, Murex support, and credit teams with fully autonomous workflows
•	Accelerate regression testing through automated orchestration of batch runs and market data imports, addressing the limitations of the current MXTEST vendor solution
•	Reduce duplicate investigation effort by intelligently identifying root causes of issues and mapping how they manifest across front office, back office, market risk, and credit risk areas
•	Lower operational risk and improve accuracy through automated validation (JSE price comparison, cash flow validation, 4-eye validation) with complete audit trails
User Stories
 
User Story 1: Automated Bond Creation from Pricing Supplement (Listed and OTC)
As a middle office analyst at Momentum
I want to create bonds automatically by providing a pricing supplement to Black Glass
So that I can reduce manual data entry, minimize errors, and accelerate bond setup
Acceptance Criteria:
•	System accepts pricing supplement documents (listed or OTC bonds)
•	For listed bonds, automatically compares pricing supplement data against JSE prices
•	Extracts cash flows from pricing supplement and validates against Murex calculation logic
•	Performs validation checks before bond creation
•	Confirms successful bond creation or provides detailed error messages
•	Audit trail of all automated bond creations is maintained
 
User Story 2: End-to-End Counterparty Creation Process
As a middle office team member
I want to initiate and complete the entire counterparty setup process through Black Glass after credit committee approval
So that the manual coordination between middle office, Murex support, and credit teams is eliminated
Acceptance Criteria:
•	Process initiates after credit committee approval and limit determination
•	Black Glass automatically creates counterparty in Murex
•	System executes technical synchronization scripts between main Murex application and MLC (Murex Limits Controller)
•	4-eye validation process is triggered and completed automatically
•	Credit limits are loaded into the application automatically
•	Counterparty is confirmed as ready for trading
•	All process steps are logged with timestamps and responsible parties
•	Error handling at each stage with clear notifications
 
User Story 3: Automated Portfolio Creation and Configuration
As a middle office analyst
I want to create portfolios through Black Glass based on front office instructions
So that I can eliminate manual form completion and technical configuration coordination with Murex support
Acceptance Criteria:
•	System accepts portfolio creation instructions from front office
•	Portfolio details and position in portfolio tree structure are captured
•	Black Glass creates portfolio in Murex automatically
•	Technical rules (mirroring rules, etc.) are configured automatically by Black Glass
•	Portfolio is validated and confirmed as fully operational
•	Entire end-to-end process completes without manual intervention
•	Audit trail captures front office request through to completion
 
User Story 4: End-to-End Regression Test Orchestration
As a Murex support team member
I want to orchestrate the complete regression testing process through Black Glass
So that manual orchestration steps for batch runs and market data imports are eliminated
Acceptance Criteria:
•	Black Glass orchestrates all prerequisite steps before testing (batch runs, market data imports)
•	Tests are executed across the entire client ecosystem, not just Murex application
•	Test execution sequence is automated end-to-end
•	Test progress and status are visible in real-time
•	Results are captured systematically for analysis
 
User Story 5: Root Cause Analysis and Issue Identification
As a testing and validation lead
I want to Black Glass to identify root causes of test failures rather than just symptoms
So that testing teams can focus on unique issues instead of investigating the same problem across multiple areas
Acceptance Criteria:
•	System performs intelligent comparison of test results vs. expected outcomes
•	Root causes of failures are identified (e.g., fixings issue, data quality issue)
•	Same root cause is not reported multiple times across different business areas
•	Results clearly distinguish between root cause and symptom manifestations
•	Issue categorization by business impact and severity
 
User Story 6: Intelligent Root Cause Propagation Across Business Areas
As a cross-functional testing coordinator
I want to see how a single root cause manifests across different business areas (front office, back office, market risk, credit risk)
So that multiple teams don't investigate the same underlying issue independently
Acceptance Criteria:
•	System maps identified root causes to their manifestations across all affected areas
•	Front office, back office, middle office, market risk, and credit risk impacts are shown
•	Single consolidated view links all symptoms back to the root cause
•	Teams can see which issues are already being investigated by other teams
•	Effort duplication is eliminated through intelligent issue assignment
•	Historical patterns of how root causes manifest are captured for future reference
 
User Story 7: Workload Visibility and Metrics
As a test manager
I want to track efficiency gains and workload metrics from Black Glass automation
So that I can measure the impact of automation on team capacity and identify further optimization opportunities
Acceptance Criteria:
•	Dashboard shows before/after metrics for automated processes
•	Time saved per process type (bond creation, counterparty setup, portfolio creation) is measured
•	Volume of automated transactions vs. manual transactions is tracked
•	Error rates for automated vs. manual processes are compared
•	Team capacity freed up by automation is quantified
 
Sanlam Financial Markets
Client Context
•	SFM (Sanlam Financial Markets) is a subsidiary of Sanlam, the largest insurer in Africa. 
•	SFM uses Murex to manage their Asset Liability Management (ALM) and credit activities, they are the specialised Insurance and ALM Manager for the wider Sanlam group.
Black Glass Use Case
•	Black Glass is being implemented for two key purposes: 
o	To make Murex version upgrades more efficient 
o	To provide testing capabilities since SFM doesn't subscribe to Murex's MXTEST application
•	The solution will be used for automating testing in the Murex application
Benefits
•	Accelerate Murex version upgrades by automating testing processes, making upgrades more efficient without relying on Murex's proprietary MXTEST application
•	Rapidly build test packs using multi-modal capture technology to record user activity and automatically convert it into reusable automated tests
•	Reduce manual test creation effort by capturing actual business workflows (ALM operations, credit processes) and transforming them into regression tests in an accelerated manner
•	Ensure system stability with comprehensive automated testing that validates critical ALM and credit workflows after each version upgrade
User Stories
 
User Story 1: Accelerated Version Upgrades
•	As a Murex system administrator at SFM
•	I want to use Black Glass to automate testing during version upgrades
•	So that I can complete Murex version upgrades more efficiently
Acceptance Criteria:
•	Black Glass can execute automated tests against new Murex versions
•	Version upgrade testing time is reduced compared to manual testing
•	Test results are comprehensive and reliable
•	The solution works independently of Murex's MXTEST application
 
User Story 2: Alternative to MXTEST Subscription
•	As a finance technology manager at SFM
•	I want to implement Black Glass as a testing solution for Murex
•	So that I do not need to subscribe to Murex's MXTEST since this application is not being offered on a standalone basis, while still maintaining robust testing capabilities
Acceptance Criteria:
•	Black Glass provides testing functionality comparable to MXTEST
•	Testing can be performed on ALM and credit activity workflows
•	The solution integrates seamlessly with our existing Murex environment
 
User Story 3: Capture User Activity for Test Creation
•	As a QA analyst at SFM
•	I want to use Black Glass's multi-modal capability to capture and record user activity in Murex
•	So that I can create a comprehensive test pack in an accelerated manner
Acceptance Criteria:
•	Black Glass can capture user interactions across the Murex application
•	Multi-modal inputs (screen, audio, keyboard, mouse) are recorded accurately
•	Captured activities can be converted into reusable automated tests
•	Test pack creation time is significantly reduced compared to manual test script writing
 
User Story 4: Automated Test Pack for ALM Operations
•	As a business user managing ALM activities
•	I want to have my typical Murex workflows automatically captured and converted into tests
•	So that future system changes don't break my critical ALM processes
Acceptance Criteria:
•	Common ALM workflows are captured and converted to automated tests
•	Tests cover key scenarios for asset-liability management
•	Tests can be re-run on demand to validate system behaviour
•	Test failures clearly indicate which ALM processes are affected
 
User Story 5: Automated Test Pack for Credit Operations
•	As a business user managing credit activities
•	I want to have my typical Murex credit workflows automatically captured and converted into tests
•	So that I can ensure credit processing remains accurate after system upgrades
Acceptance Criteria:
•	Common credit workflows are captured and converted to automated tests
•	Tests cover key scenarios for credit activity management
•	Tests validate data integrity throughout credit processes
•	Regression testing can be performed quickly before production releases





