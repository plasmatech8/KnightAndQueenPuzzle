<script>
  import { onMount, setContext } from "svelte";

  import Cell from './Cell.svelte'
  export let width = 15;
  export let height = 8;
  export let tiles = Array(width * height).fill().map(() => ({ /* blocked: false, highlight: false, */ piece: undefined }));

  let hoveringOver;

  onMount(() => {
    tiles[4].piece = {id: 1, color: 'black', type: 'queen'};
    tiles[5].piece = {id: 2, color: 'white', type: 'knight'};
  })

  function coordsToIndex(x, y){
    return x + y*width;
  }

  function handleMove(fromTile) {
    console.log("!!", hoveringOver)
    if (hoveringOver && fromTile !== hoveringOver) {
      tiles[hoveringOver] = tiles[fromTile];
      tiles[fromTile] = undefined;
    }
  }

  function handleHover(index) {
    hoveringOver = index;
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
      <Cell {...tiles[coordsToIndex(x, y)]} {x} {y} handleMove={() => handleMove(coordsToIndex(x, y))}/>
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
