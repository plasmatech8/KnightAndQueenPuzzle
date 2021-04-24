# KnightAndQueenPuzzle

This is an exercise to challenge your knight maneuvering in Chess.

Rules:
* Touch every possible square with the white knight (♘)
* Without moving into an attacked square (☠)
* Without capturing the black queen (♛)
* Starting from right to left (⬅️), top to bottom (⬇️)

Built by [Mark Connelly](https://github.com/plasmatech8/) using:
* [Svelte](https://github.com/sveltejs/svelte)

Inspired by [Ben Finegold](https://www.youtube.com/watch?v=SrQlpY_eGYU) on YouTube:
* [Ben Finegold: Master The Knight Moves Like Bob Seger with this Chess Puzzle](https://www.youtube.com/watch?v=SrQlpY_eGYU)


## Assets

Sound effects (OGG): https://github.com/ornicar/lila/tree/master/public/sound

Piece sprites (SVG): https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces

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

## Potential TODOs

* ~~Should use context for the handleMove function.~~ using events
* ~~Debug mode.~~
* ~~Move board into folder (components) and rename to map (maybe).~~
* ~~Look into using events.~~
* ~~Maybe move assets to src.~~
* ~~Better names for the functions.~~
* ~~Sidebar~~
* ~~Move tracker~~
* ~~Timer~~
* ~~Blocked marker toggle~~
* ~~Center~~
* ~~Finish~~
* arrows
* Favicon
* Raycast for blocks
* Change queen position
* Error marker
* ~~Togglable blocked tiles highlight color~~

