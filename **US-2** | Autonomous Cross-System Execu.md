**US-2** | Autonomous Cross-System Execution | Automatically execute trades across Alchemy, Murex EQD, Murex MXCORE

For this use case, there are a couple of items we need to do for use case 2:
1. We need to extend the Black Glass SDK to support Windows Accessibility API. We are hoping since Alchemy is built using C#, it should be accessible through the Windows Accessibility API. Alternatively, we have to create a custom process to attach into the Alchemy launch screen to traverse the UI screen.
2. The SDK now needs to support Windows accessibility API or a custom UI tree for Alchemy. This needs to be integrated into the existing SDK.
3. We need to build a frontend to be able to capture a set of scope of trades.
4. As well as doing some context engineering and knowledge capacity building and automate rules so that the system knows how to make the right decision in picking the right product once it does orchestration.
5. Being able to execute in the relevant system will also need to build the feedback mechanism to show the aggregated results.It will also require an infrastructure setup similarly to all other use cases.

US-3	Structured Product Booking 

Use case three and use case two are exactly the same actually. Use case two is just only Mirac systems, but use case three is it includes Alchemy. So for use case two, you can say, "We just still need to build the front end to be able to capture a set of selected scope products. We have to build the context engineering, define the right roles for the system to identify and execute these. We need to build the wizard to be able to capture these in the front end so that the system can do a deterministic split of the trades and start acting on them."

Case 3 requires the SDK expansion, so it's quite complex.

Use case 4 is a fairly simple, straightforward product. I think this is just a front-end application. I can call it a MIRIX decision maker. It will be able to run the next GS app. More than that, the system also should effectively have rules and compliance information embedded in it. Where users can specify their own products and then the system can decide which is the right place to do it. We can maybe dump in emails in there potentially upload pre-trade confers or the user can describe the trade and then we should be able to have a list of selected pre-selection of things that the system can use and then we can decide which system should be able to execute them on this request. Just a front-end application was OpenAI or any sort of AI access and large context window to explain the rules.

Use Case 5 is a subset of Use Cases 3 and 2, where it's just functionalities to effectively monitor and indicate about execution and rollbacks. Let's just indicate that we should actually consolidate Use Case 5 into Use Case 2 and 3.

Use case 6 has got the same exact same requirement as use case 3.