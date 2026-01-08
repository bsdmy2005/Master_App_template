# Building a Smart Project Timeline: How We Solved the Resource-Constrained Scheduling Problem

**TL;DR:** I built a project planning tool that automatically calculates realistic timelines when developers work on multiple tasks simultaneously. Here's the computer science behind it.

---

## The Problem Every Engineering Manager Faces

You have 3 developers. You have 5 projects. Each project needs different amounts of work. Some projects share the same developers. Some start at different times.

**The question:** When will each project actually finish?

This sounds simple, but it's not. Here's why:

When Developer Alice works on **one** project, she delivers 1 man-day of work per day. But when she's split across **two** projects? Each project only gets 0.5 man-days per day. And here's the kicker—those two projects might not overlap for their entire duration. One might start earlier, another might end sooner.

**The velocity keeps changing.**

---

## What I Built

A Gantt chart planning tool that handles this complexity automatically. You input:
- Use cases with effort estimates (in man-days)
- Developers with their weekly capacity
- Start dates and assignments

The system calculates realistic end dates, accounting for:
- Overlapping tasks reducing velocity
- Tasks completing and freeing up resources
- Weekend exclusions
- Multiple developers per task

---

## The Computer Science Behind It

This is actually a well-known problem in Operations Research called the **Resource-Constrained Project Scheduling Problem (RCPSP)**. It's NP-hard in its general form, but for our use case, we can solve it elegantly.

### The Key Insight: Segment-Based Scheduling

Instead of assuming constant velocity, we break the timeline into **segments** where concurrency is constant.

```
Timeline:     |----Segment 1----|----Segment 2----|----Segment 3----|
Task A:       |████████████████████████████████████|
Task B:                         |████████████████████████████████████|
Velocity A:        1.0                 0.5              (done)
Velocity B:       (not started)        0.5               1.0
```

### The Algorithm

```
1. IDENTIFY CHANGE POINTS
   → Collect all task start/end dates
   → These are moments when concurrency might change

2. CREATE SEGMENTS
   → Divide timeline between change points
   → Each segment has constant concurrency

3. CALCULATE PER-SEGMENT
   → For each segment:
     - Which tasks are active?
     - How many share each developer?
     - Effective velocity = capacity / concurrent_count

4. ACCUMULATE WORK
   → Work_done = segment_days × effective_velocity
   → Task ends when Σ(work_done) ≥ required_man_days

5. ITERATE TO CONVERGENCE
   → End dates affect other tasks' segments
   → Repeat until all timelines stabilize (≤10 iterations)
```

### The Math

For each developer on a task:
```
daily_capacity = weekly_hours / 5
effective_capacity = daily_capacity / concurrent_tasks
```

For the task's velocity:
```
velocity = Σ(effective_capacity for each assigned dev) / 8 hours
```

For duration:
```
working_days = man_days / velocity
calendar_days ≈ working_days × 1.4  (accounting for weekends)
```

---

## Real Example

**Setup:**
- Task A: 40 man-days, starts Jan 1
- Task B: 40 man-days, starts Jan 15
- Both assigned to the same developer (40 hrs/week)

**Naive calculation:** Both take 40 days each. Task A ends Feb 26, Task B ends Mar 12.

**Reality with our algorithm:**

| Segment | Period | Active | Velocity per Task | Work Done |
|---------|--------|--------|-------------------|-----------|
| 1 | Jan 1-14 | A only | 1.0 | A: 10 man-days |
| 2 | Jan 15 - Mar 26 | A + B | 0.5 each | A: 30 more (60 days), B: 30 |
| 3 | Mar 27+ | B only | 1.0 | B: 10 remaining (10 days) |

**Results:**
- Task A: 10 + 60 = 70 working days → ends ~Mar 26
- Task B: 60 + 10 = 70 working days → ends ~Apr 9

Task A finishes faster because it had a 2-week head start at full velocity!

---

## Why This Matters

Most project management tools treat timelines as static. You enter an end date, and that's it. But reality is dynamic:

- Resources are shared
- Priorities shift
- New work comes in

This tool models reality. When you drag a task to a new start date, everything recalculates. When you add a developer, durations shrink. When tasks complete, remaining work speeds up.

**It's not just a Gantt chart. It's a simulation.**

---

## Technical Stack

- **Frontend:** Next.js 15, React, TypeScript
- **Visualization:** Custom Gantt chart with drag-to-reschedule
- **Algorithm:** Fixed-point iteration with segment-based scheduling
- **Persistence:** Drizzle ORM with PostgreSQL

---

## Try It Yourself

I'm building a demo page where you can:
- Create sample projects and developers
- Adjust assignments and see timelines update in real-time
- Understand the segment-based calculation visually

**Link coming soon!**

---

## Key Takeaways

1. **Project scheduling with shared resources is an NP-hard problem** (RCPSP)
2. **Segment-based scheduling** makes it tractable for practical use cases
3. **Variable velocity** is more realistic than constant velocity assumptions
4. **Iterative convergence** handles the circular dependency of end dates affecting other tasks

---

What tools do you use for project scheduling? Have you encountered the "shared resource" problem? I'd love to hear your experiences in the comments.

#ProjectManagement #SoftwareEngineering #Algorithms #ComputerScience #Gantt #React #NextJS #OperationsResearch

---

*Built with curiosity and too much coffee. If you found this interesting, let's connect!*
