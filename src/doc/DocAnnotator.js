import rangy from 'rangy';
/* eslint-disable no-unused-vars */
// Workaround for rangy npm issue: https://github.com/timdown/rangy/lib/issues/342
import rangyClassApplier from 'rangy/lib/rangy-classapplier';
import rangyHighlight from 'rangy/lib/rangy-highlighter';
import rangySaveRestore from 'rangy/lib/rangy-selectionsaverestore';
/* eslint-enable no-unused-vars */
import Annotator from '../Annotator';
import * as util from '../util';
import * as docUtil from './docUtil';
import {
    STATES,
    TYPES,
    DATA_TYPE_ANNOTATION_INDICATOR,
    PAGE_PADDING_TOP,
    PAGE_PADDING_BOTTOM,
    CLASS_ANNOTATION_LAYER_HIGHLIGHT,
    CLASS_ANNOTATION_LAYER_HIGHLIGHT_COMMENT,
    CLASS_ANNOTATION_LAYER_DRAW,
    CLASS_ANNOTATION_PLAIN_HIGHLIGHT,
    THREAD_EVENT,
    ANNOTATOR_EVENT,
    CONTROLLER_EVENT,
    CREATE_EVENT
} from '../constants';

const SELECTION_TIMEOUT = 500;
const CLASS_RANGY_HIGHLIGHT = 'rangy-highlight';

const SELECTOR_PREVIEW_DOC = '.bp-doc';
const CLASS_DEFAULT_CURSOR = 'bp-use-default-cursor';

// Required by rangy highlighter
const ID_ANNOTATED_ELEMENT = 'ba-rangy-annotated-element';

const ANNOTATION_LAYER_CLASSES = [
    CLASS_ANNOTATION_LAYER_HIGHLIGHT,
    CLASS_ANNOTATION_LAYER_HIGHLIGHT_COMMENT,
    CLASS_ANNOTATION_LAYER_DRAW
];

class DocAnnotator extends Annotator {
    /** @property {Event} - For delaying creation of highlight quad points and dialog. Tracks the
     * current selection event, made in a previous event. */
    lastHighlightEvent;

    /** @property {Selection} - For tracking diffs in text selection, for mobile highlights creation. */
    lastSelection;

    /** @property {boolean} - True if regular highlights are allowed to be read/written */
    plainHighlightEnabled;

    /** @property {boolean} - True if draw annotations are allowed to be read/written */
    drawEnabled;

    /** @property {boolean} - True if comment highlights are allowed to be read/written */
    commentHighlightEnabled;

    /** @property {Function} - Reference to filter function that has been bound TODO(@jholdstock): remove on refactor. */
    showFirstDialogFilter;

    /** @inheritdoc */
    init(initialScale) {
        super.init(initialScale);

        // Allow rangy to highlight this
        this.annotatedElement.id = ID_ANNOTATED_ELEMENT;
    }

    //--------------------------------------------------------------------------
    // Abstract Implementations
    //--------------------------------------------------------------------------

    /**
     * Determines the annotated element in the viewer
     *
     * @param {HTMLElement} containerEl Container element for the viewer
     * @return {HTMLElement} Annotated element in the viewer
     */
    getAnnotatedEl(containerEl) {
        return containerEl.querySelector(SELECTOR_PREVIEW_DOC);
    }

    /**
     * Returns an annotation location on a document from the DOM event or null
     * if no correct annotation location can be inferred from the event. For
     * point annotations, we return the (x, y) coordinates and page the
     * point is on in PDF units with the lower left corner of the document as
     * the origin. For highlight annotations, we return the PDF quad points
     * as defined by the PDF spec and page the highlight is on.
     *
     * @override
     * @param {Event} event DOM event
     * @param {string} annotationType Type of annotation
     * @return {Object|null} Location object
     */
    getLocationFromEvent = (event, annotationType) => {
        let location = null;
        const zoomScale = util.getScale(this.annotatedElement);

        if (annotationType === TYPES.point) {
            let clientEvent = event;
            if (this.hasTouch && event.targetTouches) {
                if (event.targetTouches.length <= 0) {
                    return location;
                }
                clientEvent = event.targetTouches[0];
            }

            // If click isn't on a page, ignore
            const eventTarget = clientEvent.target;
            const pageInfo = util.getPageInfo(eventTarget);
            const pageEl = pageInfo.pageEl
                ? pageInfo.pageEl
                : this.annotatedElement.querySelector(`[data-page-number="${pageInfo.page}"]`);
            if (!pageEl) {
                return location;
            }

            // If there is a selection, ignore
            if (docUtil.isSelectionPresent()) {
                return location;
            }

            // If click is inside an annotation dialog, ignore
            const dataType = util.findClosestDataType(eventTarget);
            if (util.isInDialog(event) || dataType === DATA_TYPE_ANNOTATION_INDICATOR) {
                return location;
            }

            // Store coordinates at 100% scale in PDF space in PDF units
            const pageDimensions = pageEl.getBoundingClientRect();
            const pageWidth = pageDimensions.width;
            const pageHeight = pageDimensions.height - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM;
            const browserCoordinates = [
                clientEvent.clientX - pageDimensions.left,
                clientEvent.clientY - pageDimensions.top - PAGE_PADDING_TOP
            ];

            // If click is outside the page, ignore
            if (docUtil.isCoordOutside(browserCoordinates, pageWidth, pageHeight)) {
                return location;
            }

            let [x, y] = browserCoordinates;
            // Do not create annotation if event doesn't have coordinates
            if (Number.isNaN(x) || Number.isNaN(y)) {
                this.emit(ANNOTATOR_EVENT.error, this.localized.createError);
                return location;
            }

            const pdfCoordinates = docUtil.convertDOMSpaceToPDFSpace(browserCoordinates, pageHeight, zoomScale);
            [x, y] = pdfCoordinates;

            // We save the dimensions of the annotated element scaled to 100%
            // so we can compare to the annotated element during render time
            // and scale if needed (in case the representation changes size)
            const dimensions = {
                x: pageWidth / zoomScale,
                y: pageHeight / zoomScale
            };

            location = { x, y, page: pageInfo.page, dimensions };
        } else if (util.isHighlightAnnotation(annotationType)) {
            if (!this.highlighter || !this.highlighter.highlights.length) {
                return location;
            }

            // Get correct page
            let { pageEl, page } = util.getPageInfo(window.getSelection().anchorNode);
            if (!pageEl) {
                // The ( .. ) around assignment is required syntax
                ({ pageEl, page } = util.getPageInfo(this.annotatedElement.querySelector(`.${CLASS_RANGY_HIGHLIGHT}`)));
            }

            // Use highlight module to calculate quad points
            const { highlightEls } = docUtil.getHighlightAndHighlightEls(this.highlighter, pageEl);

            // Do not create highlight annotation if no highlights are detected
            if (highlightEls.length === 0) {
                return location;
            }

            const quadPoints = [];
            highlightEls.forEach((element) => {
                quadPoints.push(docUtil.getQuadPoints(element, pageEl, zoomScale));
            });

            // We save the dimensions of the annotated element scaled to 100%
            // so we can compare to the annotated element during render time
            // and scale if needed (in case the representation changes size)
            const pageDimensions = pageEl.getBoundingClientRect();
            const pageWidth = pageDimensions.width;
            const pageHeight = pageDimensions.height - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM;
            const dimensions = {
                x: pageWidth / zoomScale,
                y: pageHeight / zoomScale
            };

            location = { page, quadPoints, dimensions };
        }

        return location;
    };

    /**
     * Override to factor in highlight types being filtered out, if disabled. Also scales annotation canvases.
     *
     * @override
     * @param {number} pageNum Page number
     * @return {void}
     */
    renderPage(pageNum) {
        // Scale existing canvases on re-render
        this.scaleAnnotationCanvases(pageNum);
        super.renderPage(pageNum);
    }

    /**
     * Scales all annotation canvases for a specified page.
     *
     * @override
     * @param {number} pageNum Page number
     * @return {void}
     */
    scaleAnnotationCanvases(pageNum) {
        const pageEl = this.annotatedElement.querySelector(`[data-page-number="${pageNum}"]`);

        ANNOTATION_LAYER_CLASSES.forEach((annotationLayerClass) => {
            const annotationLayerEl = pageEl.querySelector(`canvas.${annotationLayerClass}`);
            if (annotationLayerEl) {
                docUtil.scaleCanvas(pageEl, annotationLayerEl);
            }
        });
    }

    //--------------------------------------------------------------------------
    // Protected
    //--------------------------------------------------------------------------

    /**
     * Annotations setup.
     *
     * @protected
     * @override
     * @return {void}
     */
    setupAnnotations() {
        super.setupAnnotations();

        // Don't bind to highlight specific handlers if we cannot highlight
        if (!this.plainHighlightEnabled && !this.commentHighlightEnabled) {
            super.setupAnnotations();
            return;
        }

        // Explicit scoping
        this.clickThread = this.clickThread.bind(this);

        if (this.isMobile || this.hasTouch) {
            this.onSelectionChange = this.onSelectionChange.bind(this);
        }
    }

    /**
     * Binds DOM event listeners.
     *
     * @protected
     * @override
     * @return {void}
     */
    bindDOMListeners() {
        super.bindDOMListeners();

        if (this.hasTouch) {
            this.annotatedElement.addEventListener('touchstart', this.clickHandler);
        } else {
            this.annotatedElement.addEventListener('click', this.clickHandler);
        }

        // Prevent highlight creation if annotating (or plain AND comment highlights) is disabled
        if (!this.permissions.can_annotate || !(this.plainHighlightEnabled || this.commentHighlightEnabled)) {
            return;
        }

        if (this.hasTouch || this.isMobile) {
            document.addEventListener('selectionchange', this.onSelectionChange);
        }
    }

    /**
     * Unbinds DOM event listeners.
     *
     * @protected
     * @override
     * @return {void}
     */
    unbindDOMListeners() {
        super.unbindDOMListeners();

        if (this.highlightThrottleHandle) {
            cancelAnimationFrame(this.highlightThrottleHandle);
            this.highlightThrottleHandle = null;
        }

        Object.keys(this.modeControllers).forEach((mode) => {
            const controller = this.modeControllers[mode];
            controller.removeSelection();
        });

        if (this.hasTouch || this.isMobile) {
            document.removeEventListener('selectionchange', this.onSelectionChange);
        } else {
            this.annotatedElement.removeEventListener('click', this.clickHandler);
        }
    }

    clickHandler = (event) => {
        if (event.target && event.target.nodeName === 'BUTTON') {
            return;
        }

        // NOTE: This assumes that only one dialog will ever exist within
        // the annotatedElement at a time
        const popoverEl = this.annotatedElement.querySelector('.ba-popover');
        if (util.isInDialog(event, popoverEl)) {
            event.stopPropagation();
            return;
        }

        if (!this.isCreatingAnnotation() && this.highlightClickHandler(event)) {
            return;
        }

        if (this.drawEnabled) {
            const controller = this.modeControllers[TYPES.draw];
            if (controller && !this.isCreatingAnnotation() && !this.isCreatingHighlight) {
                controller.handleSelection(event);
                return;
            }
        }

        this.hideAnnotations(event);
    };

    /**
     * Hides and resets the shared mobile dialog.
     *
     * @return {void}
     */
    removeThreadFromSharedDialog() {
        if (!this.mobileDialogEl) {
            return;
        }

        this.mobileDialogEl.classList.remove(CLASS_ANNOTATION_PLAIN_HIGHLIGHT);
        super.removeThreadFromSharedDialog();
    }

    /**
     * Clears the text selection and hides the create highlight dialog
     *
     * @param {Event} event - Mouse wheel event
     * @return {void}
     */
    resetHighlightSelection(event) {
        this.isCreatingHighlight = false;
        document.getSelection().removeAllRanges();
    }

    /**
     * Handles changes in text selection. Used for mobile highlight creation.
     *
     * @private
     * @param {Event} event The DOM event coming from interacting with the element.
     * @return {void}
     */
    onSelectionChange = (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (this.selectionEndTimeout) {
            clearTimeout(this.selectionEndTimeout);
            this.selectionEndTimeout = null;
        }

        // Do nothing if in a text area or mobile dialog or mobile create dialog is already open
        const pointController = this.modeControllers[TYPES.point];
        const isCreatingPoint = !!(pointController && pointController.pendingThreadID);
        if (isCreatingPoint || document.activeElement.nodeName.toLowerCase() === 'textarea') {
            return;
        }

        const selection = window.getSelection();

        // If we're creating a new selection, make sure to clear out to avoid
        // incorrect text being selected
        if (!this.lastSelection || !selection || !docUtil.hasSelectionChanged(selection, this.lastSelection)) {
            this.highlighter.removeAllHighlights();
        }

        // Bail if mid highlight and tapping on the screen
        if (!docUtil.isValidSelection(selection)) {
            this.lastHighlightEvent = null;
            this.highlighter.removeAllHighlights();
            return;
        }

        this.selectionEndTimeout = setTimeout(() => {}, SELECTION_TIMEOUT);

        const { page } = util.getPageInfo(event.target);

        // Set all annotations on current page that are in the 'active' state to 'inactive'
        if (this.plainHighlightEnabled) {
            this.modeControllers[TYPES.highlight].applyActionToThreads((thread) => thread.reset(), page);
        }

        if (this.commentHighlightEnabled) {
            this.modeControllers[TYPES.highlight_comment].applyActionToThreads((thread) => thread.reset(), page);
        }

        this.lastSelection = selection;
        this.lastHighlightEvent = event;
    };

    /**
     * Mode controllers setup.
     *
     * @protected
     * @return {void}
     */
    setupControllers() {
        super.setupControllers();

        // Determine enabled annotation types before binding mode controller listeners
        this.plainHighlightEnabled = !!this.modeControllers[TYPES.highlight];
        this.commentHighlightEnabled = !!this.modeControllers[TYPES.highlight_comment];
        this.drawEnabled = !!this.modeControllers[TYPES.draw];

        if (this.commentHighlightEnabled) {
            this.modeControllers[TYPES.highlight_comment].canComment = this.commentHighlightEnabled;

            if (this.plainHighlightEnabled) {
                this.modeControllers[TYPES.highlight].canComment = this.commentHighlightEnabled;
            }
        }
    }

    /**
     * Highlight the current range of text that has been selected.
     *
     * @private
     * @return {void}
     */
    highlightCurrentSelection() {
        if (!this.highlighter) {
            return;
        }

        this.highlighter.highlightSelection('rangy-highlight', {
            containerElementId: this.annotatedElement.id
        });
    }

    /**
     * Returns whether any mode controller is currently creating an
     * annotation thread
     *
     * @private
     * @return {boolean} Whether any controller has a pending thread
     */
    isCreatingAnnotation() {
        let isPending = false;
        Object.keys(this.modeControllers).some((mode) => {
            const controller = this.modeControllers[mode];
            if (controller.hadPendingThreads) {
                isPending = true;
            }
            return isPending;
        });
        return isPending;
    }

    /**
     * Highlight click handler. Delegates click event to click handlers for
     * threads on the page.
     *
     * @private
     * @param {Event} event DOM event
     * @return {void}
     */
    highlightClickHandler(event) {
        if (this.isCreatingHighlight || (!this.plainHighlightEnabled && !this.commentHighlightEnabled)) {
            return false;
        }

        this.activeThread = null;
        this.mouseEvent = event;
        this.consumed = false;

        let plainThreads = [];
        let commentThreads = [];

        const location = this.getLocationFromEvent(event, TYPES.point);
        if (this.plainHighlightEnabled) {
            plainThreads = this.modeControllers[TYPES.highlight].getIntersectingThreads(this.mouseEvent, location);
        }

        if (this.commentHighlightEnabled) {
            commentThreads = this.modeControllers[TYPES.highlight_comment].getIntersectingThreads(
                this.mouseEvent,
                location
            );
        }

        this.hideAnnotations(event);

        const intersectingThreads = [].concat(plainThreads, commentThreads);
        intersectingThreads.forEach(this.clickThread);

        // Show active thread last
        if (this.activeThread) {
            this.activeThread.show();
            return true;
        }

        if (this.isMobile) {
            this.removeThreadFromSharedDialog();
            return true;
        }

        this.resetHighlightSelection(event);
        return false;
    }

    /**
     * Delegates click event to click handlers for threads on the page.
     *
     * @private
     * @param {AnnotationThread} thread Highlight thread to check
     * @return {void}
     */
    clickThread = (thread) => {
        if (util.isPending(thread.state)) {
            // Destroy any pending highlights on click outside the highlight
            if (thread.type === TYPES.point) {
                thread.destroy();
            } else {
                thread.cancelFirstComment();
            }
        } else if (util.isHighlightAnnotation(thread.type)) {
            // We use this to prevent a mousedown from activating two different
            // highlights at the same time - this tracks whether a delegated
            // mousedown activated some highlight, and then informs the other
            // keydown handlers to not activate
            const threadActive = thread.onClick(this.mouseEvent, this.consumed);
            if (threadActive) {
                this.activeThread = thread;
            }

            this.consumed = this.consumed || threadActive;
        } else {
            thread.unmountPopover();
        }
    };

    /**
     * Show normal cursor instead of text cursor.
     *
     * @private
     * @return {void}
     */
    useDefaultCursor() {
        this.annotatedElement.classList.add(CLASS_DEFAULT_CURSOR);
    }

    /**
     * Use text cursor.
     *
     * @private
     * @return {void}
     */
    removeDefaultCursor() {
        this.annotatedElement.classList.remove(CLASS_DEFAULT_CURSOR);
    }

    /**
     * Helper to remove a Rangy highlight by deleting the highlight in the
     * internal highlighter list that has a matching ID. We can't directly use
     * the highlighter's removeHighlights since the highlight could possibly
     * not be a true Rangy highlight object.
     *
     * @private
     * @param {Object} highlight Highlight to delete.
     * @return {void}
     */
    removeRangyHighlight(highlight) {
        const { highlights } = this.highlighter;
        if (!Array.isArray(highlights)) {
            return;
        }

        const matchingHighlights = highlights.filter((internalHighlight) => {
            return internalHighlight.id === highlight.id;
        });

        this.highlighter.removeHighlights(matchingHighlights);
    }

    /**
     * Handle events emitted by the annotation service
     *
     * @private
     * @param {Object} [data] Annotation service event data
     * @param {string} [data.event] Annotation service event
     * @param {string} [data.data] Annotation event data
     * @return {void}
     */
    handleControllerEvents(data) {
        switch (data.event) {
            case CONTROLLER_EVENT.toggleMode:
                this.resetHighlightSelection(data.event);
                break;
            case CONTROLLER_EVENT.renderPage:
                this.renderPage(data.data);
                break;
            default:
        }
        super.handleControllerEvents(data);
    }

    /**
     * For filtering out and only showing the first thread in a list of threads.
     *
     * @private
     * @param {Object} thread The annotation thread to either hide or show
     * @param {number} index The index of the annotation thread
     * @return {void}
     */
    showFirstDialogFilter(thread, index) {
        if (index === 0) {
            thread.show();
        } else {
            thread.unmountPopover();
        }
    }
}

export default DocAnnotator;
