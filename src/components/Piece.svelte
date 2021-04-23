<script>
  export let type = "queen";
  export let color = "white";

  import kingLight  from '../assets/Chess_klt45.svg';
  import queenLight  from '../assets/Chess_qlt45.svg';
  import rookLight  from '../assets/Chess_rlt45.svg';
  import bishobLight  from '../assets/Chess_blt45.svg';
  import knightLight from '../assets/Chess_nlt45.svg';
  import pawnLight  from '../assets/Chess_plt45.svg';
  import kingDark from '../assets/Chess_kdt45.svg';
  import queenDark from '../assets/Chess_qdt45.svg';
  import rookDark from '../assets/Chess_rdt45.svg';
  import bishobDark from '../assets/Chess_bdt45.svg';
  import knightDark from '../assets/Chess_ndt45.svg';
  import pawnDark from '../assets/Chess_pdt45.svg';

  let spriteMap = {
    white: {
      king: kingLight,
      queen: queenLight,
      rook: rookLight,
      bishob: bishobLight,
      knight: knightLight,
      pawn: pawnLight,
    },
    black: {
      king: kingDark,
      queen: queenDark,
      rook: rookDark,
      bishob: bishobDark,
      knight: knightDark,
      pawn: pawnDark,
    },
  }

</script>

<div class="container">
  <svg>{@html spriteMap[color]?.[type] || "NA" }</svg>
</div>


<style>
  .container {
    height: 70px;
    width: 70px;
    display: grid;
    place-items: center;
    /* border: 1px solid red; */
  }

  svg {
    /* background-color: red; */
    width: 45px;
    height: 45px;
    cursor: pointer;
    transform: scale(150%);
    pointer-events: none;
  }

</style>

