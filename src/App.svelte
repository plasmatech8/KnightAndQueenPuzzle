<script>
	import { onMount } from 'svelte';
	import Board from './components/Board.svelte';

  let width = 8;
  let height = 8;
  let tiles = Array(width * height).fill().map(() => ({ blocked: false, highlight: false, piece: undefined }));
	let debug = false

  onMount(() => {
		// Queen
		tiles[35].piece = {color: 'black', type: 'queen', player: false};

		// Queen blocked tiles
		for (let i = 0; i < 8; i++) {
			tiles[32 + i].blocked = true;
			tiles[3 + i*8].blocked = true;
		}
		for (let i = 0; i < 7; i++) {
			tiles[8 + i*9].blocked = true;
		}
		for (let i = 0; i < 8; i++) {
			tiles[7 + i*7].blocked = true;
		}

		// Knight
		tiles[63].piece = {color: 'white', type: 'knight', player: true};
		tiles[63].highlight = true;

  })

	function handlePick(e){
		//console.log('pick', e.detail.from)
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
		{debug}
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