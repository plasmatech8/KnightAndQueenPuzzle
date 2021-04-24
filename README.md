# KnightAndQueenPuzzle

TODO:

* ~~Should use context for the handleMove function.~~ using events
* ~~Debug mode.~~
* ~~Move board into folder (components) and rename to map (maybe).~~
* ~~Look into using events.~~
* ~~Maybe move assets to src.~~
* ~~Better names for the functions.~~
* Sidebar
* Move tracker
* Timer
* Blocked marker toggle
* Center
* Finish
* arrows
* Favicon
* Raycast for blocks
* Change queen position
* Error marker
* Togglable blocked tiles highlight color


## Improvements

Use context + store for tiles instead of passing props
```js
{
    tiles: [{ id, blocked, overlay, color, piece, flashing, annotation, arrow }, {}]
    debug: true,
    width: 8,
    height: 8,
    hovering: 42,
    selected: 42,

    util: {
        /* coordsToIndex: (x, y) => {},
        indexToCoords: (id) => {},
        getTileByCoords: (x, y) => {},
        getTileByIndex: (id) => {},*/
        getTile: (id) => {},
        raycast: (dx, dy, distance) => {},
    }

    logic: {
        handlePick: (id) => {},
        handleDrop: (id) => {},
        handleHover: (id) => {},
    }

}
```

This global store can be used to more easily send influence tiles graphics (i.e. highlight,
flashing, colors, sizes) without passing dozens of props.

## Assets

Sound effects (OGG): https://github.com/ornicar/lila/tree/master/public/sound

Piece sprites (SVG): https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces