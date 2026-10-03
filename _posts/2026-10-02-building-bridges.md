---
layout: post
title: "Building Bridges: One Long Friday of Servers, Shared Nodes, and Honest Numbers"
date: 2026-10-02 23:50:00 +0000
categories: [Systems Architecture, Resilience]
tags: [Heimdall, Gebo, Raidho, Servers, Scaling, Caching, Cluster, Benchmarks, Measurement, Honesty, Autumn]
description: "A record of one working Friday in early autumn: two small servers grown from one user to many, a computing cluster taught to share its machines, a core-count sweep on borrowed nodes, and the measurements that showed which of it actually worked."
---

*This one is a working log, not a saga. The charts and the raw numbers are free to take, under [The Files](#the-files) at the end. Two of the projects below are open source; the post describes them without naming them, under the lodge's privacy rule.*

## The Shape of the Day

Some days at the day job are meetings. This one was mostly building. The steward sat down before sunrise with a cup of coffee and a research helper (an AI agent that runs on the house laptop and reads, writes and runs code with him), and by the time the sun went down behind the ridge, the list of things that had shipped was long enough that it needed a chart of its own.

None of it was one big thing. It was a lot of small, careful things that fit together:

- **The ledger:** a small server in front of the database where the work's relationships live (who works with whom, which lab owns which project, which emails were sent). In the morning it served one person. By evening it served many, each with their own sign-in, their own permissions, and a written audit line for every call. It went through ten releases in one day.
- **The bridge:** a sister server that sits in front of the computing cluster and lets people (and their AI helpers) ask the cluster questions and send it jobs in plain words: why did my job fail, what does this cost, which software is installed. It went through six releases, picked up a little read-only dashboard, and got an open-source license.
- **The cluster** itself learned to share. Its machines used to go one job per machine; now most partitions let several small jobs share one node, each paying only for the cores it holds.
- **The front door:** the first written spec for a new web app meant for the researchers themselves, built on top of the other two.

```
         BUILDING BRIDGES  .  THE EVENING MEASURE
  +----------------------------------------------------------+
  |  Sunrise / Sunset ..... about 07:06  /  about 18:47      |
  |  Moon ................. Waning, about 60 percent lit     |
  |  Weather .............. 70 and grey, a trace of rain     |
  |  Releases shipped ..... sixteen, across two servers      |
  |  Largest job .......... 208 cores on 13 borrowed nodes   |
  |  Borrowed-node spend .. about the price of a sandwich    |
  |  Errors in the report . zero, out of 75 live calls       |
  +----------------------------+-----------------------------+
                               |
              +----------------+----------------+
              v                                 v
     GEBO . THE GIFT                  RAIDHO . THE ROAD
     A bridge is built for            Right order makes
     other people's crossing.         the journey safe.
```

---

## Chapter 1: Teaching the Ledger to Meet Strangers

A server that only ever talks to its owner can get away with a lot. It trusts every request. It doesn't need to say who did what. It can be slow, because one person is patient with their own tools.

The moment a second person signs in, all of that changes, and the work of the morning was making the change safely, in small steps, each one shipped and checked before the next:

1. **Sign-in through the institution's own accounts,** restricted to the institution's domain, with the server issuing its own short-lived tokens and sealing them at rest. Nobody shares a password with the server.
2. **Roles.** A plain text file says who is an admin, who can write, and who can only read. Program clients (other tools that call the server on someone's behalf) get a role ceiling: even if the person behind them is an admin, the program can never do more than its ceiling allows.
3. **An audit line for every call:** who, through which client, which tool, and when.
4. **Its own service identity.** It stopped running as the cloud project's generic default account and got a dedicated one, with database rights cut down to exactly what it uses: read, insert, update, and delete only on the link table, so links can be undone.
5. **Provenance on every write.** Every record the server creates or changes now carries a small stamp: who did it, through what (the command line, an agent, the server), and when. Months from now, when someone asks "where did this come from", the answer is in the record itself.
6. **Write tools.** Sixteen of them for staff, plus one admin-only "unlink" that needs a two-step confirmation. Every write runs through the same command-line code the steward uses by hand, as the person who asked, so there is exactly one way to change the ledger, and it is tested.

The steward then sat down with a second AI coding tool and tried to break it. It found three real bugs (an event loop that got crossed between threads, a status filter that wanted different words than it was given, a briefing that fell over when its AI summary failed). Each was fixed and shipped within the hour.

One lesson from the morning is worth writing down for anyone doing this: **ship the boring safety work first.** Sign-in, roles, audit and provenance went out before a single write tool did. When the write tools arrived, every one of them was already accounted for.

---

## Chapter 2: Making It Fast

By late afternoon the ledger was correct, and slow. Six people asking for a full profile at the same moment took ten seconds. A person with thousands of links took more than a second on their own. The bridge had the same smell: every person who asked "what's the state of the cluster" made the server go and ask the cluster again.

The evening's work was speed, and it came from four ideas, none of them new:

- **Measure first.** A small load-test kit and a profiler went in before any change, so every claim below is a before and after on the same machine.
- **Only load what you return.** The slow profile call was loading every link a person had, all 2,800 of them for the busiest record, and then showing the top fifty. Now it asks the database for the top fifty and a count, in one query. Same output, apart from a timestamp.
- **Share what is public.** Answers that are the same for everyone (cluster status, partition lists, software catalogs) are cached for a minute and shared between callers.
- **Single-flight.** If ten people ask the identical question at the same moment, the server does the work once and hands all ten the same answer.

![Bar chart: six profile lookups at once fell from 10 seconds to 1.6; sixteen searches at once from 4.9 seconds to 2.2; one very large profile from 1.15 seconds to 0.19.]({{ site.baseurl }}/assets/books/building-bridges/ledger-before-after.png)

The local load test told the same story at a larger scale: on one core, with twenty callers hammering it, the ledger used to fall behind at about 825 calls a minute. After the changes it kept up with 2,000 a minute at about two hundredths of a second each.

There was one more speed-up, and it lived on the steward's side, not the servers'. The research helper had been sending its calls to the two servers one at a time. One setting later, calls to different servers run side by side. Calls to the same server still queue behind each other inside the helper. The steward looked at that, decided the win was good enough, and left it alone. That counts as engineering judgement, too.

---

## Chapter 3: The Cluster Learns to Share

The cluster at the day job runs on rented cloud machines that appear when work arrives and disappear when it is done. For years the rule was one job per machine. That's simple and safe, but wasteful: a student who asks for one core gets a whole sixteen-core machine and pays for all of it.

At midday the cluster's blueprint changed. The general, high-compute, fast-scratch and borrowed-node partitions now share machines between jobs; the big-memory and GPU partitions stay one job per machine, because their users usually need all of it. A new small partition keeps a few machines warm for an hour after the last job, so short test jobs start in seconds instead of minutes.

Sharing has a price, and it was paid in the same afternoon. Every job now has to say how many cores it wants. The cost estimate now charges for the share of the machine held, not the whole machine. The welcome text, the quick-start guide and the example scripts all had to learn to ask for cores. The research tool that sends jobs to the cluster shipped its fix *before* the change went live, on purpose, so nothing broke in between.

---

## Chapter 4: Two Hundred and Eight Cores on Borrowed Nodes

The cloud rents out spare machines at a deep discount, on one condition: it can take them back at any moment. These are the borrowed nodes. The question for the afternoon was simple. How far can you push them, and where does adding more stop paying?

First a burst: sixty-four small jobs at once, plus tests for memory, disk, network, threads and message passing. Then one job holding thirteen whole borrowed nodes, 208 cores, for four minutes. Then the real experiment, a core-count sweep. Three small programs, each run at every size from one core to 208, best of three runs per point:

- **pi** is pure arithmetic. Each core works alone, and they add up their answers once at the end.
- **Jacobi** is a grid split into pieces, where every piece swaps its edges with its neighbours on every step. This is what most real simulations look like.
- **allreduce** is a thousand tiny sums across every core. It is pure communication, so it shows the floor: the cost of talking.

![Two charts. Left: speedup against cores; pure compute tracks perfect scaling almost to 208 cores, while the simulation-style grid flattens after a few nodes. Right: time for a thousand tiny sums jumps from 2 milliseconds to 71 the moment the job leaves one machine.]({{ site.baseurl }}/assets/books/building-bridges/core-sweep.png)

The first try failed, and the failure was useful: on shared machines, a job step that only uses some of its nodes has to say so exactly, or it waits forever for cores it will never get. A two-node test confirmed the fix, and the full sweep went through.

What it found:

- **Pure compute scales almost perfectly** to about ten nodes and 160 cores, and the cost per run stays flat up to there. At 208 cores it is still 87 percent efficient.
- **The simulation-style grid peaks at two to three nodes.** Past that, every extra node costs more and gives back little or nothing. The fastest *and* cheapest point was three nodes.
- **Talking is expensive.** A thousand tiny sums took 2 milliseconds inside one machine, 71 milliseconds the moment the job spread to three, and most of a second at thirteen.
- **The cloud really does take nodes back.** About seven minutes into the sweep, one borrowed node was reclaimed. The scheduler put the job back in line, found a replacement, and ran it again from the top. It finished. Anyone using borrowed nodes should build for that: short steps, checkpoints, and a job that is happy to start over.

One honest gap: one point (the 32-core allreduce) is missing, lost to a single timeout in the launcher during the multi-node tests. It's left blank in the data rather than guessed.

The total cost of every borrowed-node test that afternoon came to roughly the price of a sandwich.

---

## Chapter 5: The Bridge Gets a Window

The bridge server also grew a face: a small read-only web dashboard. It shows the cluster's pulse, a person's own jobs (each with a plain-English diagnosis), their usage and their wasted hours, their storage, the partitions with a command builder, and a software finder. Staff get four more panels: health, everyone's jobs, and usage and waste by person. It ships with forty-six tests, and it never writes anything.

In the evening the steward asked for some fun tests of the bridge, and it earned its keep:

- Handed a deliberately broken simulation script, it caught three errors before anything ran: a missing library to load first, a software module that doesn't exist, and a request for more cores per task than the machines have.
- Asked why an old job had failed after four seconds, it read the log and answered in one line: the build was calling `python` on machines that only have `python3`. The fix was one word.
- Asked about waste, it found that most of the past week's idle time was the steward's own keep-warm jobs, one of which had held a machine for almost a day at zero percent busy. The tool doesn't spare its owner.

That last one is the part to keep. A tool that tells the truth about its own builder is one you can trust with everyone else.

---

## Chapter 6: Seventy-Five Calls and Zero Errors

At the end of the day the steward asked for one more thing: a long end-of-day report covering every session, every email sent and received, every ledger entry and task, and a lookup of every person he had dealt with. It doubled as the first real test of the ledger server under a realistic load.

Thirty-eight people, each looked up with a search and a full profile: seventy-five live calls, eight in flight at once. All of it came back in under twelve seconds, with no errors.

![Histogram of seventy-five call times: searches mostly between one and two seconds, full profiles mostly under one second.]({{ site.baseurl }}/assets/books/building-bridges/lookup-timing.png)

The test also found things the ledger should know. A handful of records were missing an email or a title. Two pairs of entries looked like duplicates. One person seemed to be "missing", until a second look found him filed under the long form of his first name. The first count had been wrong. The report was corrected before it went into the ledger, and the correction is noted in the report.

Then the report itself went into the ledger, and the ledger pushed back twice. Once because the report was longer than one entry is allowed to be, and once because it asked to link more people in one call than the server allows. So the report went in as two linked parts, with the extra links added afterwards. Both limits are good rules. A server that refuses a too-large request with a clear message is doing its job.

---

## Troth: What the Day Taught

1. **Safety before features.** Sign-in, roles, audit and provenance first; write tools after.
2. **Measure before you optimize,** and publish the before and after on the same machine.
3. **Load only what you return.** Most slow calls fetch things nobody will see.
4. **Share what is public; do identical work once.**
5. **Ship the dependent fix before the breaking change.**
6. **Build for being interrupted.** Borrowed nodes get taken back; a job that can start over will finish.
7. **Keep the gaps visible.** A missing point stays missing. A wrong count gets corrected in public.
8. **Know when to stop.** "Good enough, take the win" is a real engineering answer.

## What Still Sits on the Scale

- Whether to keep the bridge warm all the time, for a small monthly cost, so the first call of the day doesn't wait for a cold start.
- The next scaling phase: more than one copy of each server, and a cap on how much any one caller can have in flight.
- A few routine dependency updates are waiting, all passing their tests. One of them is a major version jump and gets a live test first.
- The front door for researchers is still on paper, but it is good paper.

## The Blessing

**Hail Heimdall**, who keeps the bridge and hears the grass grow, and lets across only those who should cross.

**Hail to the builders**, who leave the road better than they found it, so the next traveler never knows how rough it was.

May every bridge we build carry more than we will ever see cross it.
May every number we publish be one we measured.
May every gap stay honest, and every error be caught before it reaches someone who trusted us.
May the borrowed nodes be returned with thanks, and the work start over cheerfully when they are.
May the servers be quiet tonight, and the builder rest.

**Wes hal.**

ᚷ ᚱ ᛞ

---

### The Files

Everything from this post, free to take:

- **Core sweep:** [chart (PNG)]({{ site.baseurl }}/assets/books/building-bridges/core-sweep.png) . [raw results, best of 3 (CSV)]({{ site.baseurl }}/assets/books/building-bridges/core_sweep.csv) . [same as JSON]({{ site.baseurl }}/assets/books/building-bridges/core_sweep.json)
- **Ledger before and after:** [chart (PNG)]({{ site.baseurl }}/assets/books/building-bridges/ledger-before-after.png)
- **Seventy-five lookups:** [chart (PNG)]({{ site.baseurl }}/assets/books/building-bridges/lookup-timing.png) . [call times (JSON)]({{ site.baseurl }}/assets/books/building-bridges/lookup_timing.json)

A reader's note: every number here was measured that day, by the tools described, and nothing was smoothed. The sweep ran on a busy shared cloud, so expect your own numbers to differ by a few percent. The missing 32-core allreduce point is missing in the data as well. Before-and-after times for the ledger come from live calls and a local load test on one core; they show the shape of the change, not a promise about your hardware.
