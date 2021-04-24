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
			new Audio('./sounds/Error.ogg').play();
			console.info('%cblocked!', "font-weight: bold;");
			return;
		}

		// Valid move
		if (knightMoveDeltas.includes(e.detail.from - e.detail.to)) {
			new Audio('./sounds/Move.ogg').play();
			tiles[e.detail.from].piece = undefined;
			tiles[e.detail.to].piece = piece;
			// On target square
			if (e.detail.to === target) {
				tiles[e.detail.to].highlight = false;
				tiles[target].visited = true;
				while (target > 0) {
					target -= 1;
					if (tiles[target].blocked) {
						// Blocked - continue to next square
						tiles[target].visited = true;
					} else {
						// Target - found next valid target square
						tiles[target].highlight = true;
						console.info(`%cnext target is ${target}!`, "font-weight: bold;");
						return;
					}
				}
				// Victory - no more targets
				new Audio('./sounds/Victory.ogg').play();
			}
			return;
		}

		// Invalid move
		console.info('%cinvalid move', "font-weight: bold;");
	}

	function handleHover(e){
		//console.log('hover', e.detail.over)
	}

</script>

<main>
	<h1>♘ Knight and Queen Puzzle ♕</h1>
	<br>
		<div class="container">
			<Board
			{tiles}
			{width}
		{height}
		on:pick={handlePick}
		on:drop={handleDrop}
		on:hover={handleHover}
		{debug}
		/>
	</div>
</main>

<style>

	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	.container {
		display: flex;
  	justify-content: center;
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