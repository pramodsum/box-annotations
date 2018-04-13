const { assert } = require('chai');

/**
 * Returns whether the specified canvas is not blank
 *
 * @param {Object} I - the codeceptjs I
 * @param {string} selector - the selector to use
 *
 * @return {boolean} - Whether or not the canvas is blank
 */
function*isCanvasBlank(I, selector) {
    const isBlank = yield I.executeScript(
        /* eslint-disable prefer-arrow-callback, no-var, func-names */
        function (sel) {
            const canvas = document.querySelector(sel);
            const blank = document.createElement('canvas');
            blank.width = canvas.width;
            blank.height = canvas.height;
            return (canvas.toDataURL() === blank.toDataURL());
        },
        selector);
    return isBlank;
}

exports.confirmBlankCanvas = function (I, selector) {
    I.waitForElement(selector);
    assert.isTrue(isCanvasBlank(I, selector), 'Canvas is blank');
};
exports.confirmAnnotationOnCanvas = function (I, selector) {
    I.waitForElement(selector);
    assert.isFalse(isCanvasBlank(I, selector), 'Canvas contains an annotation');
};