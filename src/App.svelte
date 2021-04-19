<script>
	import Board from './Board.svelte';
	import Draggable from './Draggable.svelte';
	import Piece from './Piece.svelte'
</script>


<main>
	<h1>Hello</h1>
	<br>
	<Board />
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