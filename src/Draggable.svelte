<script>
  let startX = 0;
  let startY = 0;
  let deltaX = 0;
  let deltaY = 0;

  let moving = false;

  export let onDrop;
  // export let onPick

  function start(e) {
    startX = e.clientX;
    startY = e.clientY;
    moving = true;
  }

  function drop() {
    deltaX = 0;
    deltaY = 0;
    if (onDrop && moving) {
      onDrop();
    }
    moving = false;
  }

  function move(e) {
    if (moving) {
      deltaX = e.clientX - startX;
      deltaY = e.clientY - startY;
    }
  }
</script>

<div
  class="draggable"
  style="transform: translate({deltaX}px, {deltaY}px);"
  on:mousedown={start}
>
  <slot></slot>
</div>

<svelte:window on:mouseup={drop} on:mousemove={move}/>

<style>
  .draggable {
    user-select: none;
    position: absolute;
    cursor: pointer;
  }
  .draggable:active {
    cursor: grab;
    border: solid 5px yellow;
    pointer-events: none;
    z-index: 10;
  }

</style>