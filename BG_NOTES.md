- Deployment of Black Glass framework on client site
  - EC2 machines where one can launch a Murex instance

- Deployment of Black Glass framework on client site with Azure OpenAI endpoint

## Infrastructure Setup
- 2 EC2 machines
  - 1 EC2 machine to launch Murex in (Kubernetes ARC), houses the Java AI RPA SDK
  - 1 EC2 machine to house the Next.js app
- OpenAI account with access to GPT-5
- Private OpenAI access through GPT

## Development Work
- Development and testing for BG SDK to support access with Windows Accessibility API (to support other non-Java desktop applications, i.e., Alchemy)
- Kubernetes development to deploy multiple agents - Currently we only have one agent working at a time
- Development to extend and enable browser use case for BG SDK level
- Development to test BG with Azure OpenAI endpoint
- Development to test BG with Bedrock models
- Development of full application for testing using BG: assertion rules, test case configuration, test case migration from Onyx, test case library, test case management, test execution and reporting

## Overview
Black Glass is a computer vision application for desktop applications developed by Elenjical Solutions. It combines AI (OpenAI for multimodal natural language processing to understand images), RPA (Robotic Process Automation), and natural language processing to automate desktop application interactions.

### Architecture
Black Glass currently works on Murex, which uses a Java Swing front-end. The framework operates through the following process:

1. **Natural Language Instructions**: Users provide natural language instructions that are stored in YAML files.

2. **AI Translation**: The AI translates YAML files into executable actions and coordinates the sequence of actions.

3. **Computer Vision Analysis**: The AI analyzes screenshots using OpenAI's multimodal capabilities to understand what it's looking at on the screen.

4. **UI Tree Inspection**: RPA libraries use the OpenUI library to attach to the Java process and dump the UI tree structure (similar to a webpage's DOM structure). This allows the system to identify where elements are located and what actions can be performed on them.

5. **Action Execution**: The RPA libraries execute the coordinated actions by navigating the screen step-by-step, using the UI tree information to locate and interact with elements.

### Use Cases
- Test execution assistance
- Configuring desktop applications
