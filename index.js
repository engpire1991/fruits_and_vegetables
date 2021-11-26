/** @type {GameField} the game field object */
var gameField;
(() => {
  gameField = new GameField();

  window.onresize = () => gameField.updateBlockSize();

  gameField.updateBlockSize();
})()

function onShowCombinationClick() {
  gameField.showPossibleCombination();
}

function onPauseClick() {
  gameField.togglePause();
}

function onStartOverClick() {
  gameField.restart();
}