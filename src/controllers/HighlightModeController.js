// @flow

import rangy from 'rangy';
/* eslint-disable no-unused-vars */
// Workaround for rangy npm issue: https://github.com/timdown/rangy/lib/issues/342
import rangyClassApplier from 'rangy/lib/rangy-classapplier';
import rangyHighlight from 'rangy/lib/rangy-highlighter';
import rangySaveRestore from 'rangy/lib/rangy-selectionsaverestore';
/* eslint-enable no-unused-vars */

import AnnotationModeController from './AnnotationModeController';
import DocHighlightThread from '../doc/DocHighlightThread';
import { clearCanvas, isInAnnotationOrMarker, getPageInfo, getScale } from '../util';
import { isValidSelection, getHighlightAndHighlightEls, getQuadPoints } from '../doc/docUtil';
import {
    ANNOTATOR_TYPE,
    THREAD_EVENT,
    CONTROLLER_EVENT,
    TYPES,
    CLASS_ANNOTATION_LAYER_HIGHLIGHT,
    CLASS_ANNOTATION_LAYER_HIGHLIGHT_COMMENT,
    PAGE_PADDING_TOP,
    PAGE_PADDING_BOTTOM,
    STATES
} from '../constants';

const CLASS_RANGY_HIGHLIGHT = 'rangy-highlight';

class HighlightModeController extends AnnotationModeController {
    /** @inheritdoc */
    handleThreadEvents(thread: AnnotationThread, data: Object): void {
        let firstAnnotation;
        switch (data.event) {
            case THREAD_EVENT.hide:
                this.resetHighlights();
                break;
            case THREAD_EVENT.save:
                thread.show();

                // Re-render plain highlight canvas when a plain highlight is converted to a highlight comment
                firstAnnotation = thread.annotations[0];
                if (
                    firstAnnotation &&
                    firstAnnotation.type === TYPES.highlight &&
                    Object.keys(thread.annotations).length === 2
                ) {
                    this.renderPage(thread.location.page);
                }
                break;
            case THREAD_EVENT.threadCleanup:
                this.emit(CONTROLLER_EVENT.renderPage, thread.location.page);
                break;
            default:
        }

        super.handleThreadEvents(thread, data);
    }

    /** @inheritdoc */
    setupHandlers(): void {
        /* eslint-disable require-jsdoc */
        this.locationFunction = (event) => this.getLocation(event, this.mode);
        this.locationFunction = this.locationFunction.bind(this);
        /* eslint-enable require-jsdoc */

        this.mousedownHandler = this.mousedownHandler.bind(this);
        this.mouseupHandler = this.mouseupHandler.bind(this);

        // Get handlers
        this.pushElementHandler(this.annotatedElement, ['mousedown', 'contextmenu'], this.mousedownHandler, true);
        this.pushElementHandler(this.annotatedElement, ['mouseup', 'dblclick'], this.mouseupHandler, true);

        // Init rangy and rangy highlight
        this.highlighter = rangy.createHighlighter();
        this.highlighter.addClassApplier(
            rangy.createClassApplier(CLASS_RANGY_HIGHLIGHT, {
                ignoreWhiteSpace: true,
                tagNames: ['span', 'a']
            })
        );
    }

    resetHighlights() {
        this.highlighter.removeAllHighlights();
        document.getSelection().removeAllRanges();

        if (this.pendingThreadID) {
            return;
        }

        const pendingThread = this.getThreadByID(this.pendingThreadID);
        if (this.pendingThreadID && pendingThread) {
            pendingThread.destroy();
        }
    }

    mousedownHandler(event) {
        this.resetHighlights();

        this.mouseX = event.clientX;
        this.mouseY = event.clientY;

        // const pageNum = this

        this.applyActionToPageThreads((thread) => thread.onMousedown());
    }

    mouseupHandler(event) {
        const popoverEl = this.annotatedElement.querySelector('.ba-popover');
        if (isInAnnotationOrMarker(event, popoverEl)) {
            return;
        }

        if (this.highlighter) {
            this.highlighter.removeAllHighlights();
        }

        const hasMouseMoved =
            (this.mouseX && this.mouseX !== event.clientX) || (this.mouseY && this.mouseY !== event.clientY);

        // Creating highlights is disabled on mobile for now since the
        // event we would listen to, selectionchange, fires continuously and
        // is unreliable. If the mouse moved or we double clicked text,
        // we trigger the create handler instead of the click handler
        if (hasMouseMoved || event.type === 'dblclick') {
            this.createHandler(event);
        }
    }

    /**
     * Handler for creating a pending highlight thread from the current
     * selection. Default creates highlight threads as ANNOTATION_TYPE_HIGHLIGHT.
     * If the user adds a comment, the type changes to
     * ANNOTATION_TYPE_HIGHLIGHT_COMMENT.
     *
     * @private
     * @param {Event} event DOM event
     * @return {void}
     */
    createHandler(event) {
        event.stopPropagation();
        event.preventDefault();

        // Get correct page
        const selection = window.getSelection();
        if (!isValidSelection(selection)) {
            return;
        }

        const { pageEl, page } = getPageInfo(selection.anchorNode);
        if (!pageEl) {
            return;
        }

        this.highlighter.highlightSelection(CLASS_RANGY_HIGHLIGHT, {
            containerElementId: this.annotatedElement.id
        });

        // Do not create highlight annotation if no highlights are detected
        const { highlightEls } = getHighlightAndHighlightEls(this.highlighter, pageEl);
        if (highlightEls.length === 0) {
            return;
        }

        // Use highlight module to calculate quad points
        const quadPoints = [];
        const zoomScale = getScale(this.annotatedElement);
        highlightEls.forEach((element) => {
            quadPoints.push(getQuadPoints(element, pageEl, zoomScale));
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

        const location = { page, quadPoints, dimensions };
        if (!location) {
            return;
        }

        const thread = this.registerThread([], location, TYPES.highlight);
        thread.state = STATES.pending;
        thread.show();

        this.pendingThreadID = thread.threadID;
        this.emit(THREAD_EVENT.pending, thread.getThreadEventData());
    }

    /** @inheritdoc */
    exit(): void {
        this.destroyPendingThreads();
        window.getSelection().removeAllRanges();
        this.unbindListeners(); // Disable mode
        this.emit(CONTROLLER_EVENT.bindDOMListeners);
    }

    /** @inheritdoc */
    enter(): void {
        this.emit(CONTROLLER_EVENT.unbindDOMListeners); // Disable other annotations
        this.bindListeners(); // Enable mode
    }

    /** @inheritdoc */
    init(data: Object): void {
        super.init(data);
        this.enter();
    }

    /** @inheritdoc */
    destroy(): void {
        this.exit();
        super.destroy();
    }

    /** @inheritdoc */
    render(): void {
        super.render();
        this.destroyPendingThreads();
    }

    /** @inheritdoc */
    renderPage(pageNum: string): void {
        // Clear context if needed
        const pageEl = this.annotatedElement.querySelector(`[data-page-number="${pageNum.toString()}"]`);
        const layerClass =
            this.mode === TYPES.highlight ? CLASS_ANNOTATION_LAYER_HIGHLIGHT : CLASS_ANNOTATION_LAYER_HIGHLIGHT_COMMENT;
        clearCanvas(pageEl, layerClass);

        if (!this.threads) {
            return;
        }

        super.renderPage(pageNum);
    }

    /** @inheritdoc */
    instantiateThread(params: Object): AnnotationThread {
        return this.annotatorType === ANNOTATOR_TYPE.document ? new DocHighlightThread(params, this.canComment) : null;
    }
}

export default HighlightModeController;
