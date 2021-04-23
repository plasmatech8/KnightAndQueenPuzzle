<script>
	import { onMount } from 'svelte';
	import Board from './components/Board.svelte';

  let width = 15;
  let height = 8;
  let tiles = Array(width * height).fill().map(() => ({ /* blocked: false, highlight: false, */ piece: undefined }));

  onMount(() => {
    tiles[4].piece = {id: 1, color: 'black', type: 'queen'};
    tiles[5].piece = {id: 2, color: 'white', type: 'knight'};
    tiles[6].piece = {id: 3, color: 'black', type: 'knight'};
    tiles[7].piece = {id: 4, color: 'white', type: 'queen'};
  })


	function handlePick(e){
		console.log('pick', e.detail.from)
	}

	function handleDrop(e){
		console.log('drop', e.detail.from, e.detail.to)
		const piece = tiles[e.detail.from].piece;
		tiles[e.detail.from].piece = undefined;
		tiles[e.detail.to].piece = piece;
	}

	function handleHover(e){
		//console.log('hover', e.detail.over)
	}

</script>

<main>
	<h1>Hello</h1>
	<br>
	<Board
		{tiles}
		{width}
		{height}
		on:pick={handlePick}
		on:drop={handleDrop}
		on:hover={handleHover}
	/>
</main>

<style>

	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>