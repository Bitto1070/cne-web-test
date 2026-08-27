---
author: ItsLJcool
desc: Basic tutorial on how to setup and initalize your own mod!.
lastUpdated: 2025-11-15T05:32:50.298Z
title: Modding The Engine
---

# Modding The Engine

Certain modding features will be documented here to help you immediately start making a mod.
<br/>This won't cover source coding so if you want to do that instead go to [insert link here]

This is what a maxed out Mod Folder will contain. We will go over some folders that require more explanation later.

<!--for some reason yaml makes the comments actually show up as comments-->
<details>
<summary>Click to expand</summary>

```yaml
└─ 📂 My Mod/                                
   ├─ 📂 data/                                # Usually contains configuration, or information you want to store.
   │  ├─ 📂 characters/                       # Contains your Character's XML data.
   │  ├─ 📂 config/                           # Configuration stuff.
   │  │  └─ 📄 modpack.ini                   
   │  ├─ 📂 dialogue/                        
   │  │  ├─ 📂 boxes/                        
   │  │  └─ 📂 characters/                   
   │  ├─ 📂 events/                           # Contains your Custom Events.
   │  │  ├─ 📄 Example Event.hx              
   │  │  ├─ 📄 Example Event.json            
   │  │  └─ 📄 Example Event.ui.hx           
   │  ├─ 📂 library/                          # This is where you put Scripts for ScriptedAssetLibrary! We Will go over this later.
   │  ├─ 📂 notes/                            # Custom NoteType Scripts (And adds them in the Charter!)
   │  │  └─ 📄 Example Note.hx               
   │  ├─ 📂 splashes/                        
   │  ├─ 📂 stages/                           # Where your Stage `.xml` and/or `.hx` file for your stage is located.
   │  ├─ 📂 states/                           # Scripts that run when States are switched to, or when loading a ModState!
   │  ├─ 📂 titlescreen/                     
   │  ├─ 📂 weeks/                           
   │  │  ├─ 📂 weeks/                        
   │  │  │  ├─ 📄 Example Week.xml           
   │  │  │  └─ 📂 characters/                
   │  │  ├─ 📂 characters/                   
   │  │  │  └─ 📄 Example Character.xml      
   │  │  └─ 📄 weeks.txt                     
   │  └─ 📄 global.hx                         # This script runs all the time, above any state switching, and never deloads (unless you switch mods).
   ├─ 📂 fonts/                              
   ├─ 📂 images/                             
   │  ├─ 📂 characters/                       # Contains your Character Spritesheet `.png` and `.xml` Animation.
   │  ├─ 📂 game/                             # Stuff usually found for global PlayState graphics.
   │  ├─ 📂 icons/                            # Where your Character's icons will be located.
   │  └─ 📂 stages/                           # Images of your stage can go here, but it's not required.
   ├─ 📂 languages/                           # Custom Languages support for your mod!
   │  └─ 📂 en/                               # The language you want to edit / create
   │     ├─ 📄 config.ini                    
   │     ├─ 📄 Editors.xml                   
   │     ├─ 📄 Main.xml                      
   │     └─ 📄 Options.xml                   
   ├─ 📂 music/                              
   ├─ 📂 shaders/                            
   ├─ 📂 songs/                               # Where songs are located, along with charts, events, scripts, audio, meta, etc.
   │  ├─ 📄 Example Global Song Script.hx     # Scripts inside the `songs/` folder will load for every song.
   │  └─ 📂 example-song-here/               
   │     ├─ 📂 charts/                       
   │     │  └─ 📄 hard.json                  
   │     ├─ 📂 song/                          # Supports `Inst.ogg` / `Voices.ogg` and suffixes like `-bf`. Also supports difficulties.
   │     │  ├─ 📄 Inst.ogg                   
   │     │  ├─ 📄 Inst-hard.ogg              
   │     │  ├─ 📄 Voices-bf.ogg              
   │     │  ├─ 📄 Voices-bf-hard.ogg         
   │     │  ├─ 📄 Voices-dad.ogg             
   │     │  └─ 📄 Voices-dad-hard.ogg        
   │     ├─ 📂 scripts/                       # Scripts loaded for this specific song.
   │     ├─ 📄 events.json                   
   │     └─ 📄 meta.json                     
   ├─ 📂 sounds/                             
   ├─ 📂 source/                              # Custom Classes go here.
   └─ 📂 videos/                             
```
</details>

#### NOTE!
This might not be EVERYTHING, but it's a good chunk of the folders Codename Engine interacts with.
</details>

Don't be scared by the amount of folders, usually you only mess with the `songs/`, `data/`, and `images/` folders most of the time.
<br/>It's good to have a reference of what you can do at least, so this will be updated from time to time with new updates.

## Sections
These areas will split up into their own sub-pages, and they will explain to you what each folder is for, what files you can add, and how to effectively use them.
- <a href="./modding/config/">Configuration</a>
- <a href="./modding/libraries/">What is a "AssetLibrary"?</a>
- <a href="./modding/scripting/">Scripting</a>
    - <a href="./modding/scripting/features/">Scripting Features</a>
    - <a href="./modding/scripting/style/">Code Formatting / Style</a>
    - <a href="./modding/scripting/cancellables/">Event Callbacks</a>
    - <a href="./modding/scripting/playstate/">PlayState Scripting</a>
    - <a href="./modding/scripting/states/">Custom States / SubStates</a>
    - <a href="./modding/scripting/events/">Custom Events / Notetypes</a>
    - <a href="./modding/scripting/global/">Global Script(s)</a>
    - <a href="./modding/scripting/classes/">Custom Classes</a>
- <a href="./modding/editors/">Editors Introduction</a>
    - <a href="./editors/chart/">Chart Editor</a>
    - <a href="./editors/character/">Character Editor</a>
    - <a href="./editors/stage/">Stage Editor</a>
    - <a href="./editors/alphabet/">Alphabet Editor...?</a>
    - <a href="./editors/character/">Custom Editors</a>
- <a href="./modding/videos/">Using hxvlc for Videos</a>
- <a href="./modding/advanced/">Intro to Advanced Topics</a>

All of those above are for Softcoding, if you want to learn how to mod Source, you can check out the Introduction here
- <a href="/wiki/source/">Modding The Engine - Source</a>