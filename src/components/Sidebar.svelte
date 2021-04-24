<script>
  import { createEventDispatcher } from "svelte";

  export let showDebug = false;
  export let showBlocked = false;
  export let moves = [];
  $: count = moves.length;

  const dispatch = createEventDispatcher();

  function handleReset() {
    dispatch('reset', {})
  }

</script>

<div class="container">
  <div>
    <label>
      <input type=checkbox bind:checked={showDebug}>
      Show debug
    </label>
  </div>
  <div>
    <label>
      <input type=checkbox bind:checked={showBlocked}>
      Show blocked tiles
    </label>
  </div>

  <p>
    <b>Moves ({count}) </b>
    <button on:click={handleReset}>Reset</button>
  </p>

  <table>
    <thead>
      <th class="id"><div>id</div></th>
      <th class="to"><div>to</div></th>
    </thead>
    <tbody>
    {#each moves as m, i}
      <tr>
        <td>{i}</td>
        <td>{m}</td>
      </tr>
      {/each}
    </tbody>
  </table>

</div>


<style>
.container {
  text-align: left;
  user-select: none;
}
table, td, th {
  border: 1px solid grey;
}
table {
  text-align: center;
  border-collapse: collapse;
  width: 100%;
}
tbody {
  overflow: scroll;    /* Trigger vertical scroll    */
}
th {
  background-color: lightgrey;
}
</style>