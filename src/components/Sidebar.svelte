<script>
  import { createEventDispatcher, onMount } from "svelte";

  export let showDebug = false;
  export let showBlocked = false;
  export let moves = [];
  export let startTime = 0;
  export let stopped = false;
  let currentTime = Date.now();
  let scrollSection;
  let count;
  $: {
    count = moves.length;
    if(scrollSection){
      setTimeout(() => {
        count;
        scrollSection.scrollTo(0, scrollSection.scrollHeight)
      }, 1);
    }
  }

  const dispatch = createEventDispatcher();

  onMount(() => {
    setInterval(() => {
      if (!stopped) {
        currentTime = Date.now();
      }
    }, 10)
  })

  function handleReset() {
    dispatch('reset', {})
  }

  function millisecondsToTime(milli){
    var milliseconds = milli % 1000;
    var seconds = Math.floor((milli / 1000) % 60);
    var minutes = Math.floor((milli / (60 * 1000)) % 60);
    return `${minutes}m ${seconds}s `;
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
      Show blocked squares
    </label>
  </div>

  <button on:click={handleReset}>Reset</button>

  <p>
    <b>Time taken:</b>  {millisecondsToTime(currentTime - startTime)}
  </p>
  <p>
    <b>Moves ({count}): </b>
  </p>

  <table>
    <thead>
      <th class="id"><div>id</div></th>
      <th class="to"><div>to</div></th>
    </thead>
    <tbody bind:this={scrollSection}>
    {#each moves as m, i}
      <tr>
        <td>{i}</td>
        <td>{m}</td>
      </tr>
      {:else}
      <p>
        Make a move!
      </p>
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
th {
  background-color: lightgrey;
  width: 125px;
}
td {
  width: 125px;
}
table tbody {
  max-height: 400px;
  overflow-y: scroll;
  display:block;
  width: 250px;

  -ms-overflow-style: none;
  scrollbar-width: none;
}
table thead {
  display:block;  background-color: blue;
}
</style>