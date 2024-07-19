/***
 * Returns the intersection of two sets.
 */
function intersection(setOne, setTwo) {
  const intersection = [];

  for (setOneIndex in setOne) {
    if (
      setTwo.includes(setOne[setOneIndex]) &&
      !intersection.includes(setOne[setOneIndex])
    ) {
      intersection.push(setOne[setOneIndex]);
    }
  }

  return intersection;
}

module.exports = { intersection };
