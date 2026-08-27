---
author: \[LOSER\] & Frakits & Nex_isDumb & lunarcleint
desc: This page explains the most commonly asked questions about the engine.
lastUpdated: 2024-10-12T17:38:10.934Z
title: FAQ
---
# Frequently Asked Questions

## <h2 id="why-should-i-use-the-engine">Why should I use the engine?</h2>

i dont fucking know

## <h2 id="this-vs-vslice" sidebar="Should i use V-Slice (Base Game)">I'm unsure whether to use this engine or V-Slice (Base Game)</h2>

This is a really tough one, since both have pros and cons, but to help you make your decision here's a list of them.

**V-Slice is the official solution to modding the game**, developed by Funkin Crew themselves, which may sound more appealing to you. It also offers a tough, battle-tested modding system called Polymod, that... actually has working Custom Classes! Other things include advanced editors, song variations, character mixes, official mobile support *(no sideloading needed)* and probably much more. What V-Slice pales in comparison is the restrictions applied to the scripting, some imports are blocked due to security reasons, and scripting overall is just more complicated *(since every script is cached and ran as soon as you load the mod, and each script works as an individual instance instead of being a child of the state it runs for)*.

Our engine on the other hand doesn't have any restrictions and even gives you easy access to NDLLs *(whether that's a good thing or not you decide)*, scripts will inherit variables from the state it runs on (so you don't have to type out `PlayState.instance` every single time), and we don't block mods from loading when a new API Version releases *(though we still break mods lol sorry about that)*.

## <h2 id="this-vs-psych" sidebar="Should i use Psych Engine">I'm unsure whether to use this engine or Psych Engine</h2>

This is really up to you, but there's some things to note, such as Psych Engine no longer receives updates and the creator moved on from FNF. But despite that it's still being used, so you can stay if you want.

Though, if you decide to switch, this engine offers more flexibility and features, such as being able to make scripts that go beyond PlayState, which might provide more options depending on your needs, but it also proves to be harder to learn *(and this wiki will attempt to make it easier)*.
This engine also treats mods as separate instances instead of letting you stack them onto eachother, so it might be a little more inconvenient *(or not)*.

Theres no need to hardcode in this engine, meanwhile in Psych Engine, to add custom states and other features outside of gameplay you have to edit the source code.

## <h2 id="this-vs-yoshi" sidebar="Should i use Yoshi Engine">I'm unsure whether to use this engine or Yoshi Engine</h2>

just give it up bruh

## <h2 id="this-vs-forever-engine-fps-plus-kade" sidebar="Should i use Other Engines">I'm unsure whether to use this engine or Nightmare Vision, Forever Engine, FPS Plus or Kade Engine</h2>

To understand, Forever Engine, FPS Plus and Kade Engine are engines that rely purely on source code, while Codename relies heavily on soft coding. So if you prefer to keep using source code use one of those 3 engines. Forever Engine has a cleaner base and doesn't add too much onto the gameplay, FPS Plus also offers clean source code but also includes fun new additions to the base, and Kade Engine is a more hardcore-rhythm focused engine with a lot of features to enhance gameplay and stuff, also includes a basic LUA system.


## <h2 id="yoshman29-left">Where did Yoshman29 go?</h2>

> I left cause i was quickly losing interest in FNF and tbh the expectations were getting high and it was weighting on me
>
> I still check the progress on the engine from times to times and even tho sometimes i help with tiny issues, i don't work on the engine itself anymore, i'm just a spectator now in the team in a way
>
> \- Yoshman29

Above is a direct quoted response from Yoshman29.

## <h2 id="main-owners" sidebar="Main Owners">Who are the main owners of the engine?</h2>

The main owners consists of:
- [Lunarcleint](https://github.com/Lunarcleint)
- [WizardMantis441](https://github.com/WizardMantis441)
- [Frakits](https://github.com/Frakits)
- [Nex_isDumb](https://github.com/NexIsDumb)

<small>(You can click on the names to go to their GitHub profile)</small>

Our organization consists of having multiple owners cuz why separate people into categories.

## <h2 id="something-not-working-bug" sidebar="I found a bug">Something is not working or I found a bug!</h2>

If you found a bug, please report it on the [GitHub repository](https://github.com/CodenameCrew/CodenameEngine/issues) or on [Discord](https://discord.gg/codename-crew).

## <h2 id="suggest-feature-change" sidebar="Feature Suggestion">I want to suggest a feature or change something!</h2>

Please suggest it on [Discord](https://discord.gg/codename-crew).

## <h2 id="unanswered-question" sidebar="Unanswered Question">I have a question that isn't answered here!</h2>

Please ask the question on [Discord](https://discord.gg/codename-crew).
Or leave it in the discussions below.
