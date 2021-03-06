/* eslint-disable prefer-arrow-callback, no-var, func-names */
const {
    SELECTOR_TEXT_LAYER,
    SELECTOR_DISABLED,
    SELECTOR_ANNOTATIONS_LOADED,
    SELECTOR_ANNNOTATION_MODE_BACKGROUND,
    SELECTOR_ANNOTATION_BUTTON_DRAW,
    SELECTOR_ANNOTATION_BUTTON_DRAW_UNDO,
    SELECTOR_ANNOTATION_BUTTON_DRAW_REDO,
    SELECTOR_DRAWING_SAVE_BTN,
    SELECTOR_ANNOTATION_BUTTON_DRAW_CANCEL,
    SELECTOR_ANNOTATION_LAYER_DRAW_IN_PROGRESS,
    SELECTOR_DRAW_CONTROLS,
    SELECTOR_ANNOTATION_DRAWING_LABEL,
    SELECTOR_DRAWING_DELETE_BTN,
    SELECTOR_HIGHLIGHT_CONTROLS
} = require('../helpers/constants');

const { draw, clickAtLocation, selectText } = require('../helpers/mouseEvents');
const { cleanupAnnotations } = require('../helpers/cleanup');

Feature('Draw Annotation Sanity');

Before(function(I) {
    I.amOnPage('/');
});

After(function() {
    cleanupAnnotations();
});

Scenario('Create/Delete drawing @desktop @doc', function(I) {
    /*
     * Can enter/exit drawing mode properly
     */
    I.waitForVisible(SELECTOR_ANNOTATIONS_LOADED);
    I.waitForVisible(SELECTOR_ANNOTATION_BUTTON_DRAW);

    I.say('Selected text will be cleared on entering draw mode');
    selectText(I, SELECTOR_TEXT_LAYER);
    I.waitForVisible(SELECTOR_HIGHLIGHT_CONTROLS);

    I.say('Enter draw annotation mode');
    I.click(SELECTOR_ANNOTATION_BUTTON_DRAW);
    I.dontSeeElement(SELECTOR_HIGHLIGHT_CONTROLS);
    I.waitForVisible('.bp-notification');
    I.waitForVisible(SELECTOR_ANNNOTATION_MODE_BACKGROUND);
    I.waitForVisible(SELECTOR_DRAWING_SAVE_BTN);
    I.waitForVisible(SELECTOR_ANNOTATION_BUTTON_DRAW_CANCEL);

    I.say('Undo/redo buttons should be disabled');
    I.waitForVisible(`${SELECTOR_ANNOTATION_BUTTON_DRAW_UNDO}${SELECTOR_DISABLED}`);
    I.waitForVisible(`${SELECTOR_ANNOTATION_BUTTON_DRAW_REDO}${SELECTOR_DISABLED}`);

    I.say('Exit draw annotations mode');
    I.click(SELECTOR_ANNOTATION_BUTTON_DRAW_CANCEL);
    I.dontSeeElement(SELECTOR_ANNNOTATION_MODE_BACKGROUND);
    I.waitForVisible(SELECTOR_ANNOTATION_BUTTON_DRAW);

    /*
     * Cancel a new drawing annotation
     */
    I.say('Enter draw annotation mode');
    I.click(SELECTOR_ANNOTATION_BUTTON_DRAW);
    I.click(SELECTOR_TEXT_LAYER);

    draw(I, SELECTOR_TEXT_LAYER);
    I.waitForVisible(SELECTOR_ANNOTATION_LAYER_DRAW_IN_PROGRESS);
    I.waitForVisible(SELECTOR_DRAW_CONTROLS);

    I.say('Undo/redo buttons should be disabled');
    I.waitForEnabled(SELECTOR_ANNOTATION_BUTTON_DRAW_UNDO);
    I.waitForVisible(`${SELECTOR_ANNOTATION_BUTTON_DRAW_REDO}${SELECTOR_DISABLED}`);

    I.say('Cancel drawing');
    I.click(SELECTOR_DRAWING_DELETE_BTN);
    I.waitForInvisible(SELECTOR_DRAW_CONTROLS);

    /*
     * Create/Delete a drawing annotation w/ drawing dialog
     */
    draw(I, SELECTOR_TEXT_LAYER, 100);
    I.waitForVisible(SELECTOR_ANNOTATION_LAYER_DRAW_IN_PROGRESS);
    I.waitForVisible(SELECTOR_DRAW_CONTROLS);

    I.say('Undo/redo buttons should be appropriately disabled');
    I.waitForEnabled(SELECTOR_ANNOTATION_BUTTON_DRAW_UNDO);
    I.waitForVisible(`${SELECTOR_ANNOTATION_BUTTON_DRAW_REDO}${SELECTOR_DISABLED}`);
    I.click(SELECTOR_ANNOTATION_BUTTON_DRAW_UNDO);
    I.waitForVisible(`${SELECTOR_ANNOTATION_BUTTON_DRAW_UNDO}${SELECTOR_DISABLED}`);
    I.waitForEnabled(SELECTOR_ANNOTATION_BUTTON_DRAW_REDO);
    I.click(SELECTOR_ANNOTATION_BUTTON_DRAW_REDO);

    I.say('Save drawing');
    I.click(SELECTOR_DRAWING_SAVE_BTN);

    // Unselect newly created drawing
    I.click(SELECTOR_TEXT_LAYER);

    I.say('Select drawing');
    clickAtLocation(I, SELECTOR_TEXT_LAYER, 300);
    I.waitForVisible(SELECTOR_DRAW_CONTROLS);

    I.say('Drawing should have a boundary and dialog should appear');
    I.waitForText('Kanye West drew', 9, SELECTOR_ANNOTATION_DRAWING_LABEL);
    I.waitForEnabled(SELECTOR_DRAWING_DELETE_BTN);

    I.say('Delete drawing');
    I.click(SELECTOR_DRAWING_DELETE_BTN);
    I.waitForInvisible(SELECTOR_DRAW_CONTROLS);

    I.say('Enter draw annotation mode');
    I.click(SELECTOR_ANNOTATION_BUTTON_DRAW);
    I.click(SELECTOR_TEXT_LAYER);

    draw(I, SELECTOR_TEXT_LAYER, 50);
    I.waitForVisible(SELECTOR_ANNOTATION_LAYER_DRAW_IN_PROGRESS);
    I.waitForVisible(SELECTOR_DRAW_CONTROLS);

    I.say('Save drawing');
    I.click(SELECTOR_DRAWING_SAVE_BTN);

    // Unselect newly created drawing
    I.click(SELECTOR_TEXT_LAYER);

    I.say('Select drawing');
    clickAtLocation(I, SELECTOR_TEXT_LAYER, 300);
    I.waitForVisible(SELECTOR_DRAW_CONTROLS);

    I.say('Drawing should have a boundary and dialog should appear');
    I.waitForText('Kanye West drew', 9, SELECTOR_ANNOTATION_DRAWING_LABEL);
    I.waitForEnabled(SELECTOR_DRAWING_DELETE_BTN);

    I.say('Delete drawing');
    I.click(SELECTOR_DRAWING_DELETE_BTN);
    I.waitForInvisible(SELECTOR_DRAW_CONTROLS);
});