<script>
  import Piece from "./Piece.svelte";
  import Draggable from "./Draggable.svelte";

  export let debug = false;
  export let id;
  export let x;
  export let y;
  export let piece;

  export let visited = false;
  export let highlight = false;
  export let blocked = false;

  function coordsToAnno(x, y) {
    const xChar = String.fromCharCode(97 + (x % 26));
    const xCharCount = Math.floor(1 + x / 26);
    return xChar.repeat(xCharCount) + (y + 1);
  }
</script>

<div class="cell" style="background: {x % 2 === y % 2 ? '#b58a59' : '#fff1de'}">
  {#if x === 0 || y === 0}
    <div class="anno" style="color: {x % 2 === y % 2 ? '#fff1de' : '#b58a59'}">
      {coordsToAnno(x, y)}
    </div>
  {/if}

  {#if debug}
    <div class="debug">{id}</div>
  {/if}

  {#if highlight}
    <div class="overlay highlight"/>
  {/if}

  {#if blocked}
    <div class="overlay blocked"/>
  {/if}

  {#if visited}
    <div class="overlay visited"/>
  {/if}

  {#if piece && piece.player}
    <Draggable on:pick on:drop>
      <Piece {...piece} />
    </Draggable>
  {:else if piece}
    <Piece {...piece} />
  {/if}
</div>

<style>
  .cell {
    user-select: none;
    position: relative;
    width: 80px;
    height: 80px;
    /* border: 2px solid green; */
    display: grid;
    place-items: center;
  }
  .overlay {
    position: absolute;
    user-select: none;
    width: 80px;
    height: 80px;
  }

  .highlight {
    background-color: rgba(0, 255, 0, 0.3);
  }

  .visited {
    box-shadow: inset 0 0 5px 5px rgba(0, 255, 0, 0.3);
  }

  .blocked {
    /* background-color: rgba(255, 0, 0, 0.4); */
  }

  .anno {
    user-select: none;
    position: absolute;
    left: 3px;
    bottom: 0;
    font-weight: bold;
    font-size: small;
  }

  .debug {
    user-select: none;
    position: absolute;
    left: 3px;
    top: 0;
    font-size: small;
  }
</style>