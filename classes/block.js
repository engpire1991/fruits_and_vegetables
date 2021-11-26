
class Block {
  /**
   * 
   * @param {HTMLElement} element The HTML element assigned to this block
   * @param {[number,number]} location The location in the grid as [x,y]
   */
  constructor(element, location) {
    this.element = element;
    this.location = location;

    // add self to the element
    element.blockClass = this;

    // add shortcut to item element
    this.itemElement = element.getElementsByClassName('item')[0];
  }

  /** @type {string} item currently in the box */
  item = undefined;

  /** @type {Block[]} List containing all blocks that are accessible */
  accessibleBlocks = [];

  /** @type {Map<Block, [number,number][]>} Map containing the path to each accessible block */
  accessibleBlockPathMap = new Map();

  /** @type {boolean} Is the block currently marked */
  marked = false;

  /**
   * Sets the provided item in the block
   * @param {string} item The item to be set
   */
  setItem(item) {
    if (typeof item != "string") throw `A string must be provided`;

    // set the item
    this.item = item;

    // this.itemElement.setAttribute(`src`, `./items/${item}.png`);
    this.itemElement.style.backgroundImage = `url(items/${item}.png)`;
  }

  /**
   * Removes an item from the block if any is set
   */
  removeItem() {
    // nothing to do if item is not set
    if (!this.item) return;

    // remove the item
    this.item = undefined;

    // remove the src from item element
    // this.itemElement.removeAttribute(`src`);
    this.itemElement.style.backgroundImage = ``;
  }

  get hasItem() {
    return this.item !== undefined;
  }

  select() {
    // do nothing if block was already selected
    if (this.selected) return;

    // set selected as true
    this.selected = true;

    // add selected class to the element
    this.element.classList.add('selected');
  }

  deSelect() {
    // do nothing if element was not selected
    if (!this.selected) return;

    // set selected as false
    this.selected = false;

    // remove the selected class from the element
    this.element.classList.remove('selected');
  }

  /**
   * Sets the blocks accessible to the block and their paths
   * @param {BlockPath} accessibleBlockPaths The blocks that should be set as accessible and hteir paths
   */
  setAccessibleBlocks(accessibleBlockPaths) {
    // nothing to do if this block does not have an item set
    if (!this.hasItem) return;

    // filter out this block if it is received in accessible blocks
    accessibleBlockPaths = accessibleBlockPaths.filter(abp => abp[0] !== this);

    for (const [block, blockPath] of accessibleBlockPaths) {
      const blockPathMapEntry = this.accessibleBlockPathMap.get(block);
      // set the block path to the map if no entry was found for current block or if current path was shorter than the one set in the map
      if (!blockPathMapEntry || blockPath.length < blockPathMapEntry.length) this.accessibleBlockPathMap.set(block, blockPath);
    }

    // set accessible blocks
    this.accessibleBlocks = accessibleBlockPaths.map(abp => abp[0]);
  }

  mark() {
    // do nothing if block was already marked
    if (this.marked) return;

    // set marked as true
    this.marked = true;

    // add marked class to the element
    this.element.classList.add('marked');
  }

  unMark() {
    // do nothing if element was not marked
    if (!this.marked) return;

    // set marked as false
    this.marked = false;

    // remove the marked class from the element
    this.element.classList.remove('marked');
  }
}