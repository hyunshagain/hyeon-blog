---
title: Judgment Disappears Faster Than Code
description: What survived and what vanished when I reopened a project from six months ago — and why the archive got a checker before it got posts.
pubDate: 2026-08-03
tags: [archive, automation, CI]
draft: false
evidence:
  - type: code
    ref: scripts/quality-gate.mjs
    note: The actual implementation of the eight checks described here, running in this repository right now.
  - type: code
    ref: src/content.config.ts
    note: The schema that makes the build fail outright when a post carries no first-hand artifact.
sources:
  - https://docs.astro.build/en/guides/content-collections/
  - https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets
---

I reopened a project I built six months ago. The code was all there — commit messages, folder structure, even the comments.

Something else was gone. Why I picked that approach, what I tried first and abandoned, what problem that one strange condition at the end was guarding against. Code records outcomes. It does not record judgment.

So I decided to keep judgment somewhere separate. This repository is that place.

## Why the checker came before the writing

Normally you start with a post. I started with the checker.

A resolution to document things lasts about three weeks. The first few entries get real effort, and after that it becomes "ship it now, polish it later." Later never arrives. Rules that depend on resolve break first during busy stretches — and busy stretches are exactly when there is most worth recording.

That is also where automation gets tempting. Hand the draft to a model and the entry count climbs fast. The problem shows up six months later. If I cannot tell whether the judgment written there is mine or the model's, the archive is worthless no matter how full it is. **Volume goes up and trust goes down.**

So I converted resolve into plumbing. This repository has no automated path to production. The `main` branch is protected, posts arrive only through pull requests, and a pull request cannot merge until eight checks pass.

## The eight checks

| Check | On failure |
| --- | --- |
| At least one artifact, with a path that resolves | Block |
| At least one source link, verified over HTTP | Block |
| First-person analysis block of 400+ characters | Block |
| H2 skeleton overlaps the previous 5 posts by more than 70% | Block |
| A phrase from the cliché list appears | Block |
| An English post has a Korean original | Block |
| An image is missing alt text | Block |
| More than 2 posts in 7 days | Warn |

The fourth stops me most often. Ask a model for a draft and the title changes while the skeleton never does: background, problem, solution, wrap-up. It is hard to notice by eye, but treat the H2 headings as a set, compute Jaccard similarity, and the repetition becomes a number. Entries stamped from one template stop being distinguishable from each other later.

The first check is a different kind of thing. It only verifies that a file exists, so evading it is trivial — point at anything and it passes. I kept it because filling in the `evidence` field forces the question "what did I actually build here?" every single time. If the answer is thin, the work is not ready to be recorded yet.

## The analysis block

Every post has to contain a region like this:

```markdown
<!-- analysis:start -->
Not what I researched. What I concluded.
<!-- analysis:end -->
```

If the substantive character count inside falls below 400, the post does not ship.

Drawing the boundary explicitly is the whole point. When facts and interpretation are interleaved, thin interpretation hides behind the length of the surrounding text. Separating them turns "how little did I actually think about this" into a number. And six months later, this is usually the region I am digging for.

<!-- analysis:start -->
After finishing all eight, what struck me is that these devices exist for a future version of me. Present me knows the full context and finds the checks nothing but friction. The person who needs them is whoever opens this repository six months from now.

From that angle the selection criterion becomes obvious. Not "what makes a good post" but "what makes a record recoverable later." An artifact lets me confirm what I built, a separated judgment section lets me find why I did it that way, and a skeleton that changes each time keeps entries distinguishable from one another. All three came from the future-tense question.

There is a side effect. Posts that clear those three also read well to an actual reader — they contain real cases, they expose the reasoning, they are not stamped from a template. Good conditions for a record and good conditions for something worth reading overlap substantially. That was the surprise while building it: the two did not need separate optimization.

One more decision worth recording. The cadence check warns instead of blocking, deliberately. I set myself a target of one post per week, but some weeks genuinely contain two things worth keeping. A rule that loses to reality teaches you to route around it, and once you route around one rule the other seven lose their authority too. Separating what must block from what only needs to inform was the hardest judgment call in the whole system.
<!-- analysis:end -->

## What this does not solve

To be honest about the limits: any valid path written into `evidence` clears the first check. The cliché list is finite, and a fresh cliché sails through. The analysis block counts characters, not quality.

I think that is acceptable. These checks are not defending against a determined adversary — they are defending against **me, on a day when I cannot be bothered.** Routing around them is possible. But if routing around costs more effort than doing the work properly, then on most days I will do the work properly.
