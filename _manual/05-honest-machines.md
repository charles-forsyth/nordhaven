---
title: "Keeping the Machines Honest"
short: "Honest machines"
subtitle: "Sensors, records and helpers that tell the truth"
permalink: /manual/honest-machines/
order: 5
icon: "fa-solid fa-microchip"
description: "How the lodge runs its sensors, its records and its machine helpers so that what they report can be trusted: measure first, say where your sight ends, and never let a report lie."
updated: 2026-10-04
---

The lodge runs a fair amount of machinery that is not tractors: a mesh of small sensors on the ridge, a little computer that listens to them, a notebook of a thousand notes, and a machine helper that can read and write in it. The steward's day job is large-scale research computing, and the same habits keep both houses in order. This chapter is those habits.

## Measure first

Before fixing anything, find out what is actually happening. A slow answer turned out to be a cache, not the machine behind it. A "failed" job turned out to be a node the cloud took back. A sensor gone quiet turned out to be the radio in the listening computer, not the sensor. The fix is different in every case, and guessing would have been wrong in every case.

## Say where your sight ends

A camera that sees half the yard should say "half the yard", not "the yard is clear". A gauge with no reading should show a blank, not a zero and certainly not yesterday's number. The lodge's rule for every display and report: **an honest blank beats a confident guess.** If a sensor is stale, the screen says so and how long. If a source cannot be reached, the screen says "unreachable" rather than showing an old value.

## The listening house

The ridge sensors (temperature, damp, pressure, the coop) talk by radio to one small computer. Lessons from keeping it:

- **Watch the watchers.** A sensor that falls silent is either broken or unheard. Check the receiver before the sensor.
- **Two failures in a row is a pattern.** A radio that needed waking two days running pointed at a tired power supply, which went to the top of the list.
- **Keep the readings at home.** The data stays on the home network; nothing about the house needs to be in anyone else's cloud.

## The notebook

The household keeps its memory in plain text notes: one file per day, one place for each kind of record, dates first in every file name, and every change saved with a plain description. Rules that matter:

- **One place for each kind of thing.** If you have to wonder where a note goes, the layout is wrong.
- **The notes are the record.** Any search index or database built from them is a cache that can be thrown away and rebuilt.
- **Closed is not done.** A task abandoned is marked closed and why, not ticked as finished.

## The helper with the keys

A machine helper that can read and write in the house's records needs rules, and the lodge's are written down:

1. **It may add, never erase.** Every write appends or creates. Nothing existing is deleted or rewritten, except ticking a task done.
2. **Every write is signed** with whose hand made it, and saved on its own.
3. **It stops if the note changed** since it last read it, rather than writing over someone else's edit.
4. **Some doors stay shut.** Work records are never opened from the home side, and home records are never opened from the work side. That boundary is tested, not assumed: when it leaked once, it was found and closed the same evening.
5. **It proposes, the steward approves,** for anything that spends money, speaks for the household, or cannot be undone.
6. **Uncertain is not success.** If the helper cannot tell whether a write went through, it says so and lets a person check. It never sends it again blindly.

## Renew what is trusted

Keys, certificates and accounts that are known and working should be renewed before they run out, not thrown away and replaced. A new key has to earn trust again, and the gap while it does is when things break.

## When something goes wrong

Write it down plainly: what happened, what it cost, what was changed so it cannot happen the same way again. The dispatches do this on purpose, mistakes and all. A record with only victories in it is a report that lies.
