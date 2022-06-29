# Orbital Scanner

Factorio mod that allows launching special satellites that allow you to keep an area of the map always in view, like radars.

## Overview

This mod was created to serve two purposes:
 - Provide an endgame alternative to radar
 - Test using TypeScriptToLua to develop Factorio mods using TypeScript
 
Orbital Scanner is a small mod, that doesn't really deserve to be made via TypeScriptToLua, but it can serve as a starting
point for other developers.


## Building

Since the mod is not written in raw lua, it must be built/compiled before using.
To accomplish this, a build script using Gulp is provided.

**Basic command:**
```
yarn run gulp package
```

This triggers several main tasks:
 - Cleans pre-existing build directory
 - Transpiles Typescript to Lua
 - Copies resource files
 - Names the build directory as appropriate (name_version)
 - Zips all the files
 - Cleans temp files
 
The output file will be in dist/ with the intermediates in build/


A watch task is also provided to assist with development:
```
yarn run gulp watch
```

View `gulpfile.js` for more build tasks.
