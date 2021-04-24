<script>
	import { onMount } from 'svelte';
	import Board from './components/Board.svelte';
	import Sidebar from './components/Sidebar.svelte';

  let width = 8;
  let height = 8;
	let tiles = Array(width * height).fill().map(() => ({ blocked: false, highlight: false, visited: false, piece: undefined }));
	let target = 61;
	let moves = [];
	let startTime = Date.now();
	let stopped = true;

	let showBlocked = false;
	let showDebug = false;

	const knightMoveDeltas = [-15, 15, -17, 17, -10, 10, -6, 6]

	onMount(initBoard);

	function initBoard() {
		// Initialise tiles, moves, and play sound effect
		tiles = Array(width * height).fill().map(() => ({ blocked: false, highlight: false, visited: false, piece: undefined }));
		target = 61;
		moves = [];
		startTime = Date.now();
		stopped = true;

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
	}

	function handleReset(e) {
		new Audio('./sounds/Select.ogg').play();
		initBoard();
	}

	function indexToAnno(id) {
		const y = Math.floor(id/width);
		const x = id % width;
    const xChar = String.fromCharCode(97 + (x % 26));
    const xCharCount = Math.floor(1 + x / 26);
    return xChar.repeat(xCharCount) + (y + 1);
  }

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

			// Start timer
			if (moves.length === 0) {
				startTime = Date.now();
				stopped = false;
			}

			// Relocate the piece
			new Audio('./sounds/Move.ogg').play();
			tiles[e.detail.from].piece = undefined;
			tiles[e.detail.to].piece = piece;
			moves = [...moves, indexToAnno(e.detail.to)]

			// On target square
			if (e.detail.to === target) {
				moves[moves.length - 1] += " ✔️";
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
				moves[moves.length - 1] += " 🏆"
				stopped = true;
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
	<div class="content">

		<div class="container">
			<Board
			{tiles}
			{width}
			{height}
			{showBlocked}
			{showDebug}
			on:pick={handlePick}
			on:drop={handleDrop}
			on:hover={handleHover}
			/>
		</div>
		<div class="sidebar">
			<Sidebar {startTime} {stopped} {moves} bind:showDebug bind:showBlocked on:reset={handleReset}></Sidebar>
		</div>
	</div>

</main>
<footer>
	<div class="footbox">
		<p>
			This is an exercise to challenge your knight maneuvering skills in Chess!
		</p>
		Rules:
		<ul>
			<li>Touch every possible square with the white knight (♘)</li>
			<li>Without moving into an attacked square (☠)</li>
			<li>Without capturing the black queen (♛)</li>
			<li>Starting from right to left (⬅️), top to bottom (⬇️)</li>
		</ul>
		<p>
			Built by	<a href="https://github.com/plasmatech8/KnightAndQueenPuzzle">Mark Connelly</a>
			inspired by <a href="https://www.youtube.com/watch?v=SrQlpY_eGYU">Ben Finegold</a>
			on YouTube.
		</p>
	</div>
	<br>
</footer>

<style>

	main {
		text-align: center;
		padding: 1em;
		margin: 0 auto;
	}
	.content {
		height: 670px;
	}

	.footbox {
		margin: auto;
		max-width: 600px;
	}

	.container {
		display: flex;
		justify-content: center;
	}

	.sidebar {
		float: right;
		border: 5px solid black;
		padding: 10px;
		width: 250px;
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