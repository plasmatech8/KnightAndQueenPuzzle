<script>
	import { onMount } from 'svelte';
	import Board from './components/Board.svelte';

  let width = 8;
  let height = 8;
  let tiles = Array(width * height).fill().map(() => ({ blocked: false, highlight: false, visited: false, piece: undefined }));
	let debug = false
	let target = 61;

	const knightMoveDeltas = [-15, 15, -17, 17, -10, 10, -6, 6]

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
		tiles[61].highlight = true;
		tiles[63].visited = true;
		tiles[62].visited = true;
  });

	function handlePick(e){
		//console.log('pick', e.detail.from)
	}

	function handleDrop(e){
		//console.log('drop', e.detail.from, e.detail.to)
		const piece = tiles[e.detail.from].piece;
		const blocked = tiles[e.detail.to].blocked;

		// Idle
		if (e.detail.from === e.detail.to){
			return
		}

		// Blocked
		if (blocked) {
			console.error('blocked!');
			return;
		}

		// Valid move
		if (knightMoveDeltas.includes(e.detail.from - e.detail.to)) {
			tiles[e.detail.from].piece = undefined;
			tiles[e.detail.to].piece = piece;
			// Update the target if we landed on the current target square
			if (e.detail.to === target) {
				tiles[e.detail.to].highlight = false;
				tiles[target].visited = true;
				target -= 1;
				while (tiles[target].blocked) {
					tiles[target].visited = true;
					target -= 1;
				}
				tiles[target].highlight = true;
				console.log(`New target square is ${target}`)
			}
			return;
		}

		// Invalid move
		console.error('invalid move');
	}

	function handleHover(e){
		//console.log('hover', e.detail.over)
	}

</script>

<main>
	<h1>♘ Knight and Queen Puzzle ♕</h1>
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