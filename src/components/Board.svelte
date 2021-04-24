<script>
  import { createEventDispatcher } from "svelte";
  import Cell from './Cell.svelte'

  export let showBlocked = false;
  export let showDebug = false;
  export let width = 8;
  export let height = 8;
  export let tiles = Array(width * height).fill().map(() => ({ blocked: false, highlight: false, piece: undefined, highlight: "red" }));
  let hoveringTile;

  const dispatch = createEventDispatcher();

  // ========= Utils

  function coordsToIndex(x, y){
    return x + y*width;
  }

  // ========= Handlers

  function handlePick(onTile) {
    dispatch('pick', { from: onTile });
  }

  function handleDrop(onTile) {
    if (hoveringTile != null) {
      dispatch('drop', { from: onTile, to: hoveringTile });
    }
  }

  function handleHover(onTile) {
    hoveringTile = onTile;
    dispatch('hover', { over: hoveringTile })
  }

</script>

<div  class="base"
      style=" grid-template-columns: repeat({width}, 80px [col-start]);
              grid-template-rows: repeat({height}, 80px [col-start]);  "
      on:mouseleave={() => handleHover(undefined)}
>

  {#each Array.from(Array(height).keys()).reverse() as y}
  {#each Array(width) as _, x}
    <div on:mouseenter={() => handleHover(coordsToIndex(x, y))}>
      <Cell
        {...tiles[coordsToIndex(x, y)]}
        id={coordsToIndex(x, y)}
        {x}
        {y}
        {showBlocked}
        {showDebug}
        on:drop={() => handleDrop(coordsToIndex(x, y))}
        on:pick={() => handlePick(coordsToIndex(x, y))}
      />
    </div>
  {/each}
  {/each}

</div>

<style>
  .base {
    background-color: black;
    padding: 10px;
    display: grid;
    position: absolute;
  }
</style>
