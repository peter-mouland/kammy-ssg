# Contributing with AI

This project welcomes contributions from non-engineers using an AI assistant. This guide explains how to work effectively so your changes are safe to merge and easy for others to understand.

---

## Before you start: one goal, one done condition

Write two things before opening an AI session:

1. **The goal** — what you want to exist or change, in plain language.
2. **Done looks like** — how you will know it worked. A screen you can see, a value that changes, a button that does something.

Example:
> "Add a 'on loan' badge to the player card on the team page. Done when I can see the badge on loaned players when I view my team."

If you cannot write a done condition, the task is not scoped enough. Break it down first.

---

## One task at a time

Finish and review one task fully before starting the next. Do not ask the AI to fix something it notices *while* doing your task — raise it separately afterwards.

If you catch yourself saying "and while you're there..." — stop. That is a separate task.

---

## Understanding AI suggestions

While working on your task, the AI may notice other things and will label them. Use the label to decide what to do — you do not need engineering knowledge to act on these:

| Label | What it means | What to do |
|---|---|---|
| **[Required for your goal]** | Without this, the thing you asked for will not work correctly. | Include it — it is part of the current task. |
| **[Separate problem found]** | Something else is broken or risky, unrelated to what you asked for. Your task will work without it. | Note it down. Finish your task first. Raise it as a new task afterwards. |
| **[Will slow down future work]** | Nothing breaks now, but this will make the next related change harder. | Add it to a backlog. Do not do it in this session. |
| **[Polish]** | Code quality improvement with no functional impact. | Ignore it unless you have spare time and an engineer has reviewed the rest. |

If the AI suggests something without a label, ask: *"Is this required for my goal, or is it something separate?"*

---

## If something feels wrong

- If the AI's response is long and seems to be doing more than you asked, say: *"What is the minimum change needed for my goal, and nothing else?"*
- If you are not sure whether a change is safe to make, ask an engineer before proceeding.
- If the AI says it needs to change something you did not expect — ask it to label why before it does anything.
