import AnnotationModeController from './AnnotationModeController';
import CreateHighlightDialog from './CreateHighlightDialog';
import { clearCanvas, getFirstAnnotation } from '../util';
import {
    THREAD_EVENT,
    CONTROLLER_EVENT,
    TYPES,
    CREATE_EVENT,
    CLASS_ANNOTATION_LAYER_HIGHLIGHT,
    CLASS_ANNOTATION_LAYER_HIGHLIGHT_COMMENT
} from '../constants';

class HighlightModeController extends AnnotationModeController {
    /** @inheritdoc */
    setupSharedDialog() {
        this.allowComment = !!(this.mode === TYPES.highlight_comment);
        this.allowHighlight = !!(this.mode === TYPES.highlight);

        this.createDialog = new CreateHighlightDialog(this.container, {
            isMobile: this.isMobile,
            hasTouch: this.hasTouch,
            allowComment: this.allowComment,
            allowHighlight: this.allowHighlight,
            localized: this.localized
        });
        this.createDialog.createElement();

        this.onDialogPendingComment = this.onDialogPendingComment.bind(this);
        this.onDialogPost = this.onDialogPost.bind(this);
        this.destroyPendingThreads = this.destroyPendingThreads.bind(this);

        this.createDialog.addListener(CREATE_EVENT.init, () => this.onDialogPendingComment);

        if (this.allowComment) {
            this.createDialog.addListener(CREATE_EVENT.comment, this.onDialogPendingComment);
            this.createDialog.addListener(CREATE_EVENT.post, this.onDialogPost);
        }

        if (this.allowHighlight) {
            this.createDialog.addListener(CREATE_EVENT.plain, this.onDialogPost);
        }
    }

    /** @inheritdoc */
    destroy() {
        this.createDialog.removeListener(CREATE_EVENT.comment, this.onDialogPendingComment);
        this.createDialog.removeListener(CREATE_EVENT.post, this.onDialogPost);
        this.createDialog.removeListener(CREATE_EVENT.plain, this.onDialogPost);

        super.destroy();
    }

    /** @inheritdoc */
    handleThreadEvents(thread, data) {
        let firstAnnotation;
        switch (data.event) {
            case THREAD_EVENT.save:
                // Re-render plain highlight canvas when a plain highlight is converted to a highlight comment
                firstAnnotation = getFirstAnnotation(thread.annotations);
                if (
                    firstAnnotation &&
                    firstAnnotation.type === TYPES.highlight &&
                    Object.keys(thread.annotations).length === 2
                ) {
                    this.renderPage(thread.location.page);
                }
                break;
            case THREAD_EVENT.threadCleanup:
                if (thread && thread.location) {
                    this.renderPage(thread.location.page);
                }
                break;
            default:
        }

        super.handleThreadEvents(thread, data);
    }

    /** @inheritdoc */
    exit() {
        this.destroyPendingThreads();
        window.getSelection().removeAllRanges();
        this.unbindListeners(); // Disable mode
        this.emit(CONTROLLER_EVENT.bindDOMListeners);
    }

    /** @inheritdoc */
    enter() {
        this.emit(CONTROLLER_EVENT.unbindDOMListeners); // Disable other annotations
        this.bindListeners(); // Enable mode
    }

    /** @inheritdoc */
    render() {
        super.render();
        this.destroyPendingThreads();
    }

    /** @inheritdoc */
    renderPage(pageNum) {
        // Clear context if needed
        const pageEl = this.annotatedElement.querySelector(`[data-page-number="${pageNum}"]`);
        const layerClass =
            this.mode === TYPES.highlight ? CLASS_ANNOTATION_LAYER_HIGHLIGHT : CLASS_ANNOTATION_LAYER_HIGHLIGHT_COMMENT;
        clearCanvas(pageEl, layerClass);

        if (!this.threads) {
            return;
        }

        super.renderPage(pageNum);
    }
}

export default HighlightModeController;
