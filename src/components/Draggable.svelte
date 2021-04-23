<script>
  import { createEventDispatcher } from "svelte";

  let startX = 0;
  let startY = 0;
  let deltaX = 0;
  let deltaY = 0;
  let dragging = false;
  const dispatch = createEventDispatcher();

  function handlePick(e) {
    startX = e.clientX;
    startY = e.clientY;
    dragging = true;
    dispatch('pick', {});
  }

  function handleDrop() {
    deltaX = 0;
    deltaY = 0;
    if (dragging) {
      dispatch('drop', {});
    }
    dragging = false;
  }

  function handleDrag(e) {
    if (dragging) {
      deltaX = e.clientX - startX;
      deltaY = e.clientY - startY;
    }
  }
</script>

<div
  class="draggable"
  style="transform: translate({deltaX}px, {deltaY}px);"
  on:mousedown={handlePick}
>
  <slot></slot>
</div>

<svelte:window on:mouseup={handleDrop} on:mousemove={handleDrag}/>

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