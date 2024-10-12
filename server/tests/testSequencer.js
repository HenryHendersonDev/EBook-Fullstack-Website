// testSequencer.js
const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    // Sort test files by file name in ascending order
    return tests.sort((testA, testB) => testA.path.localeCompare(testB.path));
  }
}

module.exports = CustomSequencer;
