const HORIZONTAL_TILES = 14;
const VERTICAL_TILES = 10;

const TIME_PER_COMBINATIONS = 3;
const SCORE_PER_COMBINATION = 10;
const MAX_TIME = 220;
const TIME_PERCENT = 100 / MAX_TIME;

const PAUSE_TEXT = "Spele ir nopauzēta. Nospied šeit, lai pauzi noņemtu";
const LEVEL_PASSED_TEXT = "Stadija pabeigta, apsveicu! Nospied šeit lai turpinātu spēli";
const GAME_WON_TEXT = "Apsveicu, Tu uzvarēji!!! Nospied šeit lai sāktu no sākuma";
const GAME_OVER_TEXT = "Diemžēl zaudēji, pamēģini vēlreiz! Nospied šeit lai mēģinātu vēlreiz";

/** @typedef {[Block, [number, number][]][]} BlockPath  */

class GameField {
  constructor() {
    this.gameFieldElement = document.getElementById('game-field');
    if (!this.gameFieldElement) throw new Error(`game-field element was not found`);

    this.blockComponentElement = document.getElementById('components').getElementsByClassName('item-box').item(0);
    if (!this.blockComponentElement) throw new Error(`item-box element was not found in components element`);

    this.timerElement = document.getElementById('timer');
    if (!this.timerElement) throw new Error(`timer element was not found`);

    this.livesElement = document.getElementById('lives');
    if (!this.livesElement) throw new Error(`lives element was not found`);

    this.scoreElement = document.getElementById('score');
    if (!this.scoreElement) throw new Error(`score element was not found`);

    this.levelElement = document.getElementById('level');
    if (!this.levelElement) throw new Error(`level element was not found`);

    this.noMoreMovesElement = document.getElementById('no-more-moves');
    if (!this.noMoreMovesElement) throw new Error(`no-more-moves element was not found`);

    this.fieldOverlayElement = document.getElementById('field-overlay');
    if (!this.fieldOverlayElement) throw new Error(`field-overlay element was not found`);

    // add click listener
    document.onmousedown = this.onMouseDownHandler.bind(this);

    // fill the grid with blocks
    this.fillGrid();

    // draw the blocks on the game field
    this.drawBlocks();

    // start level
    this.startLevel();

    this.lastTimeCheck = Date.now();
    setInterval(this.handleInterval.bind(this), 200);
  }

  /** @type {Block[]} The blocks by their grid location */
  blocks = [];

  /** @type {Block[][]} The blocks by their grid location */
  blocksByGrid = [];

  /** @type {Block} Currently selected block */
  selectedBlock = null;

  /** @type {string[]} List of all the items avaliable */
  allItems = ['apple', 'banana', 'banana2', 'brocoli', 'carrot', 'cheries', 'coconuts', 'corn', 'cucumber', 'garlic', 'grapes', 'hazelnuts', 'kivi', 'kivi2', 'lemon', 'mooshroom', 'olive', 'onion', 'orange', 'orange2', 'pepper', 'pineapple', 'pineapple2', 'radish', 'raspberries', 'strawberry', 'strawberry2', 'tomato', 'watermelon', 'cucumber2', 'lemon2', 'olive2', 'corn2', 'tomato2', 'peas', 'strawberry3', 'peach', 'paprika', 'paprika2', 'dragonfruit'];

  /** @type {string[]} List of item combinations currently on the field */
  itemCombinations = [];

  /** @type {[Block, Block]} Known possible combination */
  knownCombination = [];

  /** @type {number} Count of different items taht are used in this level */
  levelItems = 30;

  /** @type {number} The current level */
  level = 1;

  /** @type {number} The time that is still left */
  timeLeft = MAX_TIME;

  /** @type {number} The current score of the player */
  score = 0;

  /** @type {number} The lives that the player have left*/
  lives = 6;

  /** @type {boolean} Is the timer currently stopped */
  timerStopped = true;

  /** @type {any} The timeout to hide no more moves left text */
  noMoreMovesTimeout;

  /** @type {boolean} Is a combination currently colored */
  combinationColored = false;

  fillGrid() {
    // fill the grid with blocks
    for (let i = 0; i < VERTICAL_TILES; i++) {
      // add an empty array as a row for the grid
      this.blocksByGrid.push([]);

      // add blocks to the grid
      for (let c = 0; c < HORIZONTAL_TILES; c++) {
        // copy the block component element
        const blockElement = this.blockComponentElement.cloneNode(true);
        // create the block class
        const block = new Block(blockElement, [i, c]);
        // add the block to the grid
        this.blocksByGrid[i][c] = block;
        // add the block to overall block list
        this.blocks.push(block);
      }
    }
  }

  drawBlocks() {
    // draw all blocks
    for (const row of this.blocksByGrid) {
      // add a new div to the game field
      const rowElement = document.createElement('div');
      rowElement.classList.add('item-box-row');

      // add blocks to the row
      for (const block of row) rowElement.appendChild(block.element);

      // append the row element to the game field
      this.gameFieldElement.appendChild(rowElement);
    }
  }

  showPossibleCombination() {
    // don't do anything if timer is stopped or there are no lives to spend or a combination is already colored
    if (this.timerStopped || this.lives < 1 || this.combinationColored) return;

    // do nothing if no known combination is set
    if (!this.knownCombination[0] || !this.knownCombination[1]) return;

    // color the combination blocks
    this.knownCombination[0].mark();
    this.knownCombination[1].mark();

    // set combination colored to true
    this.combinationColored = true;

    // remove one live
    this.addLives(-1);
  }

  pauseGame(text = PAUSE_TEXT) {
    // don't do anything if timer alreay stopped
    if (this.timerStopped) return;

    // set timer stopped to true
    this.timerStopped = true;

    // set the overlay text to the one provided
    this.fieldOverlayElement.textContent = text;

    // show the field overlay element
    this.toggleShowElement(this.fieldOverlayElement, true);
  }

  unPauseGame() {
    // set timer stopped to false
    this.timerStopped = false;

    // hide the field overlay element
    this.toggleShowElement(this.fieldOverlayElement, false);
  }

  togglePause() {
    // un pause the game if the timer is stopped
    if (this.timerStopped) this.unPauseGame();
    // pause the game otherwise
    else this.pauseGame();
  }

  /* 
      time - 220s, time per fruit - 3s, points per combo - 10
      after level points: -4 per second below 72 seconds and +4 per second above 71 seconds
                          basically -284 + ( 4 per second )
      1st level - 30 items, no movement
      2nd level - 35 items, no movement, +1 live
      3rd level - 40 items, half goes up and half goes down, + 1 live
      4th level - 40 items, half goes left and half goes right
      5th level - 40 items, everything goes left
      6th level - 40 items, everything goes down,
      7th level - 40 items, everything goes right, ?
      8th level - 40 items, everything goes up, ?
      9th level - 40 items, everything goes to center
  */
  startLevel() {
    if (this.level === 1) this.levelItems = 30;
    else if (this.level === 2) this.levelItems = 35;
    else this.levelItems = 40;

    // add items
    this.addItems();

    // set accessible blocks for each block
    this.blocks.forEach(b => b.setAccessibleBlocks(this.getAccessibleBlocks(b)));

    // make sure that at least one combination exists
    this.checkPossibleCombinations(false);

    // update time left
    this.updateTimeLeft(MAX_TIME);
  }

  restart() {
    // start everything from beginning
    this.setLives(6);
    this.setScore(0);
    this.setLevel(1);

    this.startLevel();
  }

  finishLevel() {
    // add score -4 per second below 72 seconds means -284 + 4 per second left
    this.addScore(-284 + (4 * Math.floor(this.timeLeft)));

    if (this.level === 9) {
      // pause the game with game won text
      this.pauseGame(GAME_WON_TEXT);

      // restart the game
      return this.restart();
    }

    // pause the game with level passed text
    this.pauseGame(LEVEL_PASSED_TEXT);

    // add lives based on level
    // add 1 live if we are below the 4th level
    if (this.level < 4) this.addLives(1);
    // othewise add 2 lives if we are below the 7th level
    else if (this.level < 7) this.addLives(1);
    // otherwise add 3 lives
    else this.addLives(1);

    // update level
    this.setLevel(this.level + 1);

    // start next level
    this.startLevel();
  }

  gameOver() {
    // pauze the game with game over text
    this.pauseGame(GAME_OVER_TEXT);

    // restart the game
    this.restart();
  }

  handleInterval() {
    const timeNow = Date.now();
    const timePassed = (timeNow - this.lastTimeCheck) / 1000;
    // update the last time check
    this.lastTimeCheck = timeNow;

    // nothing to do if timer is stopped
    if (this.timerStopped) return;

    // remove one second from the timer
    this.updateTimeLeft(this.timeLeft - timePassed);

    // handle game over if no more time is left
    if (this.timeLeft <= 0) this.gameOver();
  }

  addItems() {
    // clear current item list
    this.itemCombinations = [];

    // create a list that will contain all empty blocks
    const emptyBlocks = [];
    for (let i = 0; i < this.blocks.length; i++) emptyBlocks.push(i);

    const addItemToBlock = (item) => {
      // get random block index from the list
      const index = randomInteger(emptyBlocks.length);

      // add item to the block
      this.blocks[emptyBlocks[index]].setItem(item);

      // remove the empty block from the list
      emptyBlocks.splice(index, 1);
    }

    const addItemCombination = (item) => {
      // add two of the items to random blocks
      addItemToBlock(item);
      addItemToBlock(item);

      // add item to the list of combinations left
      this.itemCombinations.push(item);
    }

    // add one combination of each avaliable item
    for (let itemIndex = 0; itemIndex < this.levelItems; itemIndex++) {
      // stop the loop if there are no empty blocks left
      if (!emptyBlocks.length) break;

      addItemCombination(this.allItems[itemIndex]);
    }

    // nothing more to do if all empty blocks were used
    if (!emptyBlocks.length) return;

    // create a list that will hold the amount of combinations created for each item
    const createdItemCombinations = [];

    // get the maximum combination amount for each item
    const maxCombinations = Math.floor(((VERTICAL_TILES * HORIZONTAL_TILES) - this.levelItems) / this.levelItems);

    // loop while there are empty blocks avaliable
    while (emptyBlocks.length) {
      // get random item
      const itemIndex = randomInteger(this.levelItems);
      const createdCombinations = createdItemCombinations[itemIndex];
      // try again if the maximum amount of combinations are already created for the item
      if (createdCombinations === maxCombinations) continue;

      // add one to the created combination counter
      createdItemCombinations[itemIndex] = (createdCombinations ?? 0) + 1;

      // add the item combination
      addItemCombination(this.allItems[itemIndex]);
    }
  }

  reshuffleItems() {
    // create a lsit of all blocks that contain an item
    const blocksWithItem = this.blocks.filter(b => b.hasItem);

    const addItemToBlock = (item) => {
      // get random block index from the list
      const index = randomInteger(blocksWithItem.length);

      // add item to the block
      blocksWithItem[index].setItem(item);

      // remove the used block from the list
      blocksWithItem.splice(index, 1);

    }

    // randomly add items to the blocks
    for (const item of this.itemCombinations) {
      addItemToBlock(item);
      addItemToBlock(item);
    }
  }

  /**
   * Get a list of accessible blocks for the provided block and path to them
   * @param {Block} block 
   * @param {[number, number, number, number]} skipDirrections Dirrections that should not be checked
   * @param {number} turnsLeft the number of turns that can be made
   * @param {[number, number][]} path List of grid coordinates which should be prepended to the result paths
   * @returns {BlockPath} list of accessible blocks
   */
  getAccessibleBlocks(block, skipDirrections = [], turnsLeft = 2, path = []) {
    /** @type {BlockPath} The result holder */
    const result = [];

    for (let dirrection = 0; dirrection < 4; dirrection++) {
      // add all accessible blocks in the dirrection if it should not be skipped
      if (!skipDirrections[dirrection]) result.push(...this.getAccessibleBlocksInDirrection(dirrection, block.location, turnsLeft, [...path]));
    }
    return result;
  }

  /**
   * get accessible blocks in one dirrection
   * @param {number} dirrection 0 - up, 1 - down, 2 - left, 3 - right
   * @param {[number, number]} location The location of the start block
   * @param {number} turnsLeft How many turns can be made
   * @param {[number, number][]} path List of grid coordinates which should be prepended to the result paths
   * @param {boolean} startOutOfBox should we start outside of the box
   * @returns {BlockPath} list of accessible blocks
   */
  getAccessibleBlocksInDirrection(dirrection, location, turnsLeft, path, startOutOfBox = false) {
    /** @type {BlockPath} The result holder */
    const result = [];

    // reverse if dirrection is bottom or right
    const reverse = dirrection === 1 || dirrection === 3;

    // move horizontally if dirrection is left or right
    const horizontal = dirrection > 1;

    // get the start index
    let index = horizontal ? location[1] : location[0];

    if (startOutOfBox) {
      // move index by one entry, since we want to start out of box
      if (reverse) index--;
      else index++;
    }

    let endIndex;
    // set the end index to first tile if we are not going reverse. -1 so that we don't ignore the 0th tile
    if (!reverse) endIndex = -1;
    // othwerise set the end index to the horizontal tile count if we are moving horizontaly
    else if (horizontal) endIndex = HORIZONTAL_TILES;
    // othwerise set the end index to the vertical tile count
    else endIndex = VERTICAL_TILES;

    // set the skip dirrections to the forward and back, so that we don't double check those blocks
    const skipDirrections = horizontal ? [0, 0, 1, 1] : [1, 1];

    while (true) {
      // move our index
      if (reverse) index++;
      else index--;

      // break the loop if index is equal to the end index
      if (index === endIndex) break;

      // get the current vertical and horizontal indexes
      const verticalIndex = horizontal ? location[0] : index;
      const horizontalIndex = horizontal ? index : location[1];

      // add the current location to the path
      path.push([...location]); // TODO: check if we shouldn't be adding the vertical index and horizontal index values here

      // get the current block
      const currentBlock = this.blocksByGrid[verticalIndex][horizontalIndex];
      if (currentBlock.hasItem) {
        // we hit a block, lets add it to the result list
        result.push([currentBlock, path]);

        // nothing more can be done, lets return the result
        return result;
      }

      // get accessible blocks in the side dirrections if we can make any more turns
      if (turnsLeft > 0) result.push(...this.getAccessibleBlocks(currentBlock, skipDirrections, turnsLeft - 1, [...path]));
    }

    // we got here, that means that we have reached one of the sides
    // no use to continue if less than 2 turns left, since we need 2 turns to get back in the field
    if (turnsLeft < 2) return result;

    // loop through all blocks on the side that we reached and add them to result if item is set
    // if no item is set then get the blocks avaliable in that direction

    // get the backwards dirrection
    let newDirrection;
    if (dirrection === 0) newDirrection = 1;
    else if (dirrection === 1) newDirrection = 0;
    else if (dirrection === 2) newDirrection = 3;
    else newDirrection = 2;

    // update the end index
    endIndex = horizontal ? VERTICAL_TILES : HORIZONTAL_TILES;

    for (let i = 0; i < endIndex; i++) {
      const newLocation = [];
      if (horizontal) {
        newLocation[0] = i;
        newLocation[1] = reverse ? HORIZONTAL_TILES - 1 : 0;
      } else {
        newLocation[0] = reverse ? VERTICAL_TILES - 1 : 0;
        newLocation[1] = i;
      }

      // add blocks accessible in the new dirrection to the result
      result.push(...this.getAccessibleBlocksInDirrection(newDirrection, newLocation, turnsLeft - 2, [...path], true));
    }

    return result;
  }

  /**
   * Checks if at least one combination is still possible and reshuffles if not
   * @param {boolean} looseLifeIfNoneFound Should we loose a life on reshuffle
   */
  checkPossibleCombinations(looseLifeIfNoneFound = true) {
    // check if at least one combination exists
    for (const block of this.blocks) {
      // skip the block if it doesn't have an item
      if (!block.hasItem) continue;

      // check if the block has any accessible blocks that contain the same item
      const found = block.accessibleBlocks.find(ab => ab.item === block.item);
      // skip if no combination was found
      if (!found) continue;

      // set the block and found block as the known combination
      this.knownCombination[0] = block;
      this.knownCombination[1] = found;

      // no need to keep checking as we know that we have at least one combination
      return;
    }

    // if we got here then it means that no combinations were found

    if (!looseLifeIfNoneFound) {
      // we shouldn't loose a life, so we can just reshufle the items
      this.reshuffleItems();

      // check again
      return this.checkPossibleCombinations(false);
    }

    // remove one life
    this.addLives(-1);

    // nothing more to do if timer is already stopped
    if (this.timerStopped) return;

    // set the timeout to hide no more moves in 1 second
    this.noMoreMovesTimeout = setTimeout(() => {
      // replace the items
      this.reshuffleItems();

      // check for combinations again without loosing any lives this time
      this.checkPossibleCombinations(false);

      // hide the no more moves left text
      this.toggleNoMoreMovesText(false);

      // start the timer
      this.timerStopped = false;
    }, 1000);

    // show the no more moves text
    this.toggleNoMoreMovesText(true);

    // stop the timer
    this.timerStopped = true;
  }


  /**
   * Handles the actions that should be made after block removal
   * @param {Block} selectedBlock the block that was first selected
   * @param {Block} blockClass the block that was clicked on remove
   */
  handleAfterRemove(selectedBlock, otherBlock) {
    // add score
    this.addScore(SCORE_PER_COMBINATION);

    // clear the known combination
    this.knownCombination[0].unMark();
    this.knownCombination[0] = undefined;
    this.knownCombination[1].unMark();
    this.knownCombination[1] = undefined;

    // clear the combination colored mark, so taht we can show combination again
    this.combinationColored = false;

    // add time with an upper limit of MAX_TIME
    this.updateTimeLeft(Math.min(this.timeLeft + TIME_PER_COMBINATIONS, MAX_TIME));

    // move to the next level if all items were cleared
    if (!this.itemCombinations.length) return this.finishLevel();

    // TODO: update item locations based on level and update accessible blocks properly
    const movedSelectedBlock = this.moveItems(selectedBlock, otherBlock);
    const movedOtherBlock = this.moveItems(otherBlock);

    // update accessible blocks to all blocks that were accessible by the removed blocks
    movedSelectedBlock.accessibleBlocks.forEach(b => b.setAccessibleBlocks(this.getAccessibleBlocks(b)));
    movedOtherBlock.accessibleBlocks.forEach(b => b.setAccessibleBlocks(this.getAccessibleBlocks(b)));

    // check for possible combinations
    this.checkPossibleCombinations();
  }

  /**
   * move items throguh blocks
   * @param {Block} block 
   * @param {Block} otherBlock 
   * @returns {Block} The block that was left empty after moving
   */
  moveItems(block, otherBlock = null) {
    // no moving is done till level 3, so do nothing if level is less than 3
    if (this.level < 3) return block;
    // nothing that can be done if the block already has an item set
    if (block.hasItem) return block;

    /** @type {Block} */
    let newEmptyBlock;

    // handle items going vertically outwards from center if we are at the 3rd level
    if (this.level === 3) newEmptyBlock = this.handleOut(block, true);
    // handle items going horizontally outwards from center if we are at the 4th level
    else if (this.level === 4) newEmptyBlock = this.handleOut(block, false);
    // handle items going left from right if we are at the 5th level
    else if (this.level === 5) newEmptyBlock = this.handleMove(block, HORIZONTAL_TILES - 1, 2);
    // handle items going down from up if we are at the 6th level
    else if (this.level === 6) newEmptyBlock = this.handleMove(block, 0, 1);
    // handle items going right from left if we are at the 7th level
    else if (this.level === 7) newEmptyBlock = this.handleMove(block, 0, 3);
    // handle items going up from down if we are at the 8th level
    else if (this.level === 8) newEmptyBlock = this.handleMove(block, VERTICAL_TILES - 1, 0);
    else if (this.level === 9) {
      // handle items going to center

      // set newEmptyBlock as the input block by default
      newEmptyBlock = block;

      // get the vertical and horizontal center
      const verticalCenter = VERTICAL_TILES / 2;
      const horizontalCenter = HORIZONTAL_TILES / 2;

      // check if block is top and left
      const isTop = block.location[0] < verticalCenter;
      const isLeft = block.location[1] < horizontalCenter;

      // check if the other block is on the same vertica
      const isOtherOnSameVertical = otherBlock && otherBlock.location[0] === block.location[0];

      // create shorthand methods
      const moveLeft = () => this.handleMove(newEmptyBlock, HORIZONTAL_TILES - 1, 2) ?? newEmptyBlock;
      const moveRight = () => this.handleMove(newEmptyBlock, 0, 3) ?? newEmptyBlock;
      const moveUp = () => this.handleMove(newEmptyBlock, VERTICAL_TILES - 1, 0) ?? newEmptyBlock;
      const moveDown = () => this.handleMove(newEmptyBlock, 0, 1) ?? newEmptyBlock;

      if (isTop && isLeft) {
        // move top left corner to center
        newEmptyBlock = isOtherOnSameVertical ? moveDown() : moveRight();
        newEmptyBlock = isOtherOnSameVertical ? moveRight() : moveDown();
      } else if (!isTop && isLeft) {
        // move bottom left corner
        newEmptyBlock = isOtherOnSameVertical ? moveUp() : moveRight();
        newEmptyBlock = isOtherOnSameVertical ? moveRight() : moveUp();
      } else if (!isTop && !isLeft) {
        // move bottom right corner
        newEmptyBlock = isOtherOnSameVertical ? moveUp() : moveLeft();
        newEmptyBlock = isOtherOnSameVertical ? moveLeft() : moveUp();
      }
      else if (isTop && !isLeft) {
        // move top right corner
        newEmptyBlock = isOtherOnSameVertical ? moveDown() : moveLeft();
        newEmptyBlock = isOtherOnSameVertical ? moveLeft() : moveDown();
      }
    }

    return newEmptyBlock ?? block;
  }

  /**
   * 
   * @param {Block} block 
   * @param {boolean} vertical 
   * @returns {Block | null}
   */
  handleOut(block, vertical = false) {
    const tiles = vertical ? VERTICAL_TILES : HORIZONTAL_TILES;
    const firstStart = Math.ceil(tiles / 2);
    const firstEnd = Math.floor(tiles / 2);

    const check = block.location[vertical ? 0 : 1];
    // move blocks up from center if the block is above center
    if (check < firstStart) return this.handleMove(block, firstStart, vertical ? 0 : 2);
    // otherwise move blocks down from center if the block is below center
    else if (check > firstEnd) return this.handleMove(block, firstEnd, vertical ? 1 : 3);

    return null;
  }

  /**
   * Shift items from the dirrection provided to the provided block location
   * @param {Block} block The block to which the found item should be moved
   * @param {number} endIndex The index till which we can keep moving item
   * @param {number} dirrection Which dirrection should we take the closest item from, 0 - up, 1 - down, 2 - left, 3 - right
   * @returns {Block | null} The new empty block or null if no movement was made
   */
  handleMove(block, endIndex, dirrection) {
    const vertical = dirrection < 2;
    const reverse = dirrection === 1 || dirrection === 3;

    // get the block index based on the movement axis
    const blockIndex = vertical ? block.location[0] : block.location[1];

    const indexMove = reverse ? -1 : 1;

    let index = blockIndex + indexMove;
    // get teh closest block in the dirrection set
    /** @type {Block} */
    let blockFound;
    while ((reverse && index >= endIndex) || (!reverse && index <= endIndex)) {
      // get the block at the index
      const currentBlock = vertical ? this.blocksByGrid[index][block.location[1]] : this.blocksByGrid[block.location[0]][index];
      if (currentBlock.hasItem) {
        // block found, lets set it and break the loop
        blockFound = currentBlock;
        break;
      }

      // move the index
      index += indexMove;
    }
    // return null if no block with item was found
    if (!blockFound) return null;

    // move item from the block found to the input block
    block.setItem(blockFound.item);
    blockFound.removeItem();

    // return the found block if the input block is already at the max index
    if ((reverse && blockIndex <= endIndex) || (!reverse && blockIndex >= endIndex)) return blockFound;

    // handle movement the same way for the next block
    const nextHorizontal = block.location[1] + ((vertical ? 0 : indexMove));
    const nextVertical = block.location[0] + (vertical ? indexMove : 0);
    return this.handleMove(this.blocksByGrid[nextVertical][nextHorizontal], endIndex, dirrection) ?? blockFound;
  }

  // /**
  //  * Move the closest item to the provided block. Movement is made from the end of the axis to the start
  //  * @param {Block} block The block in which we will put the found item
  //  * @param {number} maxToIndex The maximal index till which we can search for the closes item
  //  * @param {boolean} vertical Should we be moving along the y axis
  //  * @returns {Block | null} The block that was left empty after moving, or null if no movement was made
  //  */
  // handleMoveToStart(block, maxToIndex, vertical){
  //   // get the block index based on the movement axis
  //   const blockIndex = vertical ? block.location[0] : block.location[1];

  //   /** @type {Block} */
  //   let blockFound;
  //   for (let index = blockIndex + 1; index <= maxToIndex; index++){
  //     const currentBlock = vertical ? this.blocksByGrid[block.location[1]][index] : this.blocksByGrid[index][block.location[0]];
  //     if (currentBlock.hasItem){
  //       // block found, lets set it and break the loop
  //       blockFound = currentBlock;
  //       break;
  //     }
  //   }

  //   while ((reverse && index >= endIndex) || (!reverse && index <= endIndex)){
  //     // get the block at the index
  //     const currentBlock = vertical ? this.blocksByGrid[block.location[1]][index] : this.blocksByGrid[index][block.location[0]];
  //     if (currentBlock.hasItem){
  //       // block found, lets set it and break the loop
  //       blockFound = currentBlock;
  //       break;
  //     }

  //     // move the index
  //     if (reverse) index--;
  //     else index++;
  //   }

  //   // return null if no block with item was found
  //   if (!blockFound) return null;

  //   // move item from the block found to the input block
  //   block.setItem(blockFound.item);
  //   blockFound.removeItem();

  //   // return the found block if the input block is already at the max index
  //   if (blockIndex >= maxToIndex) return blockFound;

  //   // handle movement the same way for the next block
  //   const nextHorizontal = block.location[1] + (vertical ? 0 : 1);
  //   const nextVertical = block.location[0] + (vertical ? 1 : 0);
  //   return this.handleMoveToStart(this.blocksByGrid[nextVertical][nextHorizontal], maxToIndex, vertical) ?? blockFound;
  // }

  // /**
  //  * Move the closest item to the provided block. Movement is made from the start of the axis to the end
  //  * @param {Block} block The block in which we will put the found item
  //  * @param {number} minFromIndex The minimal index from which we can search for the closes item
  //  * @param {boolean} vertical Should we be moving along the y axis
  //  * @returns {Block | null} The block that was left empty after moving, or null if no movement was made
  //  */
  // handleMoveToEnd(block, minFromIndex, vertical){
  //   // get the block index based on the movement axis
  //   const blockIndex = vertical ? block.location[0] : block.location[1];

  //   /** @type {Block} */
  //   let blockFound;
  //   for (let index = blockIndex - 1; index >= minFromIndex; index--){
  //     const currentBlock = vertical ? this.blocksByGrid[block.location[1]][index] : this.blocksByGrid[index][block.location[0]];
  //     if (currentBlock.hasItem){
  //       // block found, lets set it and break the loop
  //       blockFound = currentBlock;
  //       break;
  //     }
  //   }

  //   // return null if no block with item was found
  //   if (!blockFound) return null;

  //   // move item from the block found to the input block
  //   block.setItem(blockFound.item);
  //   blockFound.removeItem();

  //   // return the found block if the input block is already at the min index
  //   if (blockIndex <= maxToIndex) return blockFound;

  //   // handle movement the same way for the next block
  //   const nextHorizontal = block.location[1] - (vertical ? 0 : 1);
  //   const nextVertical = block.location[0] - (vertical ? 1 : 0);
  //   return this.handleMoveToEnd(this.blocksByGrid[nextVertical][nextHorizontal], minFromIndex, vertical) ?? blockFound;

  // }

  /**
   * Shows or hides the no more moves left window
   * @param {boolean} show Should the widnow be shown
   */
  toggleNoMoreMovesText(show) {
    this.toggleShowElement(this.noMoreMovesElement, show);
  }

  /**
   * Toggles show class on the element
   * @param {HTMLElement} element Element on which the class should be toggled
   * @param {boolean} show Should the widnow be shown
   */
  toggleShowElement(element, show) {
    // add show class if show is set to true
    if (show) element.classList.add('show');
    // remove show class if show is set to false
    else element.classList.remove('show');
  }

  /**
   * Adds a number to score.
   * @param {number} score positive or negative integer of score that should be added
   */
  addScore(score) {
    this.setScore(this.score + score);
  }

  /**
   * Sets the score to the value provided
   * @param {number} score The new score value to be set
   */
  setScore(score) {
    // update the score
    this.score = score;

    // update score text
    this.scoreElement.textContent = this.score;
  }

  /**
   * Adds a number of lives.
   * @param {number} lives positive or negative integer of lives that should be added
   */
  addLives(lives) {
    this.setLives(this.lives + lives);
    // game over if lives went to less than 1
    if (this.lives < 0) this.gameOver();
  }

  /**
   * Sets the number of lives that are provided
   * @param {number} lives New live count
   */
  setLives(lives) {
    // update the lives
    this.lives = lives;

    // update lives text
    this.livesElement.textContent = this.lives;
  }

  /**
   * Sets the level to the number provided
   * @param {number} level The new level
   */
  setLevel(level) {
    this.level = level;
    this.levelElement.textContent = this.level;
  }

  onMouseDownHandler(ev) {
    // check if the click happened in the block
    const blockElement = getParentElementWithClass('item-box', ev.target);

    // do nothing if the click was not within block
    if (blockElement === null) return;

    /** @type {Block} */
    const blockClass = blockElement.blockClass;

    // nothing to do if the selected block was clicked or the clicked block has no item
    if (this.selectedBlock === blockClass || !blockClass.hasItem) return;

    // let's set the block as the currently selected one if no block is selected
    if (!this.selectedBlock) return this.selectBlock(blockClass);

    const selectedBlock = this.selectedBlock;
    // visually de select the currently selected block
    selectedBlock.deSelect();

    if (selectedBlock.item != blockClass.item || !selectedBlock.accessibleBlocks.includes(blockClass)) {
      // just select the clicked block
      return this.selectBlock(blockClass);
    }

    // item should be removed from block
    // remove item from selected block and clicked block
    selectedBlock.removeItem();
    blockClass.removeItem();

    // remove the item from combination list
    const itemIndex = this.itemCombinations.indexOf(blockClass.item);
    this.itemCombinations.splice(itemIndex, 1);

    // set selected block to null
    this.selectedBlock = null;

    // handle after remove actions
    this.handleAfterRemove(selectedBlock, blockClass);
  }

  /**
   * Sets the currently selected block to the one provided
   * @param {Block} block the block to be set as currently selected
   */
  selectBlock(block) {
    // set the block class as the currently selected one
    this.selectedBlock = block;
    // handle the click within the block
    block.select();
  }

  /**
   * Updates the time left in the game field and visually
   * @param {number} timeLeft The time left in seconds
   */
  updateTimeLeft(timeLeft) {
    // set the time left
    this.timeLeft = timeLeft;

    // update the visual timer element
    this.timerElement.value = timeLeft;
  }

  updateBlockSize() {
    // get max size that will fit into the width of the game element
    const maxWidth = Math.floor(this.gameFieldElement.clientWidth / HORIZONTAL_TILES);
    // get max size that will fit into the height of the game element
    const maxHeight = Math.floor(this.gameFieldElement.clientHeight / VERTICAL_TILES);

    // the size that we can use is the minimum between the two and the max size
    const newSize = (Math.min(maxHeight, maxWidth, 75) - 4) + `px`;
    // update the size of all blocks
    for (const block of this.blocks) {
      block.element.style.width = newSize;
      block.element.style.height = newSize;
    }
  }
}