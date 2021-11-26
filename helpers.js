/**
 * Searches for an element containing a provided class going up the parrent ladder, starting with the provided element
 * @param {string} elementClass The class to search for
 * @param {HTMLElement} element The element from which to start the search
 * @returns {HTMLElement | null} the element that contains the class or null if none was found
 */
function getParentElementWithClass(elementClass, element) {
  // set the start element
  let currentElement = element;
  while (currentElement) {
    // return the current element if it contains the searched class
    if (currentElement.classList.contains(elementClass)) return currentElement;

    // move to parent element
    currentElement = currentElement.parentElement;
  }

  // return null if our element was not found
  return null;
}

/**
 * Returns random integer between 0 ( including ) and provided number ( excluding )
 * @param {number} maxExcluding The excluding maximum that can be returned
 * @returns a random integer
 */
function randomInteger(maxExcluding) {
  return Math.floor(Math.random() * maxExcluding);
}