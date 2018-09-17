/* eslint-disable no-unused-expressions */
import Annotation from '../Annotation';
import AnnotationDialog from '../AnnotationDialog';
import * as util from '../util';
import * as constants from '../constants';

const CLASS_FLIPPED_DIALOG = 'ba-annotation-dialog-flipped';
const CLASS_ANIMATE_DIALOG = 'ba-animate-show-dialog';
const CLASS_INVALID_INPUT = 'ba-invalid-input';

let dialog;
const html = `<div class="annotated-element">
<div class="ba-mobile-annotation-dialog">
    <div class="ba-annotation-mobile-header">
        <div class="ba-annotation-dialog-close"></div>
    </div>
</div>
</div>`;

describe('AnnotationDialog', () => {
    let rootElement;
    let annotation;

    beforeEach(() => {
        rootElement = document.createElement('div');
        rootElement.innerHTML = html;
        document.body.appendChild(rootElement);

        dialog = new AnnotationDialog({
            annotatedElement: document.querySelector(constants.SELECTOR_ANNOTATED_ELEMENT),
            container: document,
            location: {},
            annotations: {},
            canAnnotate: true,
            locale: 'en-US'
        });

        dialog.localized = {
            addCommentPlaceholder: 'add comment placeholder',
            posting: 'posting'
        };

        annotation = new Annotation({
            id: 1,
            message: 'the preview sdk is amazing!',
            user: { id: 1, name: 'user' },
            permissions: { can_delete: true }
        });

        dialog.setup();
        document.querySelector(constants.SELECTOR_ANNOTATED_ELEMENT).appendChild(dialog.element);

        dialog.emit = jest.fn();
        util.hideElement = jest.fn();
        util.showElement = jest.fn();
        dialog.isMobile = false;
    });

    afterEach(() => {
        dialog.annotations = [];
        const dialogEl = document.querySelector(constants.SELECTOR_ANNOTATED_ELEMENT);
        if (dialogEl && dialogEl.parentNode) {
            dialogEl.parentNode.removeChild(dialogEl);
        }

        dialog.element = null;
        document.body.removeChild(rootElement);
        dialog = null;
    });

    describe('destroy()', () => {
        it('should unbind DOM listeners and cleanup its HTML', () => {
            dialog.unbindDOMListeners = jest.fn();

            dialog.destroy();
            expect(dialog.unbindDOMListeners).toBeCalled();
            expect(dialog.element).toBeNull();
        });
    });

    describe('show()', () => {
        beforeEach(() => {
            dialog.position = jest.fn();
            dialog.scrollToLastComment = jest.fn();
            dialog.showMobileDialog = jest.fn();
            dialog.canAnnotate = true;
            dialog.isMobile = false;
            dialog.element.classList.add(constants.CLASS_HIDDEN);
        });

        it('should show the mobile dialog if on a mobile device', () => {
            dialog.isMobile = true;
            dialog.show([annotation]);
            expect(dialog.showMobileDialog).toBeCalled();
            expect(dialog.scrollToLastComment).toBeCalled();
            expect(dialog.emit).toBeCalledWith('annotationshow');
        });

        it('should position the dialog if not on a mobile device', () => {
            const commentsTextArea = document.createElement('textarea');
            commentsTextArea.classList.add(constants.CLASS_ANNOTATION_TEXTAREA);
            commentsTextArea.classList.remove(constants.CLASS_ACTIVE);
            dialog.element.appendChild(commentsTextArea);

            dialog.show([annotation]);
            expect(dialog.position).toBeCalled();
            expect(dialog.scrollToLastComment).toBeCalled();
            expect(dialog.emit).toBeCalledWith('annotationshow');
        });

        it('should render a list of annotations', () => {
            const annotations = [
                annotation,
                new Annotation({
                    id: 2,
                    message: 'the preview sdk is amazing!',
                    user: { id: 1, name: 'user' }
                }),
                new Annotation({
                    id: 3,
                    message: 'the preview sdk is amazing!',
                    user: { id: 1, name: 'user' }
                })
            ];
            dialog.show(annotations);
            expect(dialog.annotationListComponent).not.toBeUndefined();
            expect(dialog.annotationListComponent.querySelectorAll('.ba-annotation-list-item').length).toEqual(3);
        });
    });

    describe('scrollToLastComment()', () => {
        it('should set the dialog scroll height to the bottom of the comments container', () => {
            const annotationEl = {
                scrollHeight: 500,
                clientHeight: 300,
                scrollTop: 0
            };
            dialog.element.querySelector = jest.fn().mockReturnValue(annotationEl);

            dialog.scrollToLastComment();
            expect(annotationEl.scrollTop).toEqual(200);
        });

        it('should set the flipped dialog scroll height to the bottom of the comments container', () => {
            const annotationEl = {
                scrollHeight: 500,
                clientHeight: 500,
                scrollTop: 0
            };
            dialog.dialogEl.classList.add('ba-annotation-dialog-flipped');
            dialog.element.querySelector = jest.fn().mockReturnValue(annotationEl);

            dialog.scrollToLastComment();
            expect(annotationEl.scrollTop).toEqual(500);
        });
    });

    describe('showMobileDialog()', () => {
        beforeEach(() => {
            dialog.bindDOMListeners = jest.fn();

            dialog.container = document.createElement('div');
            dialog.container.querySelector = jest.fn().mockReturnValue(dialog.element);

            dialog.element.classList.add(constants.CLASS_MOBILE_ANNOTATION_DIALOG);
            dialog.element.classList.add(constants.CLASS_HIDDEN);

            dialog.element.querySelector = jest.fn().mockReturnValue(document.createElement('div'));
        });

        it('should populate the mobile dialog if using a mobile browser', () => {
            dialog.highlightDialogEl = null;

            dialog.showMobileDialog();
            expect(util.showElement).toBeCalledWith(dialog.element);
            expect(dialog.bindDOMListeners).toBeCalled();
            expect(dialog.element.classList.contains(constants.CLASS_MOBILE_ANNOTATION_DIALOG)).toBeTruthy();
            expect(dialog.element.classList.contains(CLASS_ANIMATE_DIALOG)).toBeTruthy();
        });

        it('should reset the annotation dialog to be a plain highlight if no comments are present', () => {
            dialog.highlightDialogEl = {};

            const headerEl = document.createElement('div');
            headerEl.classList.add(constants.CLASS_MOBILE_DIALOG_HEADER);
            dialog.element.appendChild(headerEl);

            dialog.showMobileDialog();

            expect(dialog.element.classList).toContain(constants.CLASS_ANNOTATION_PLAIN_HIGHLIGHT);
        });

        it('should not re-show the dialog if it is already visible', () => {
            dialog.element.classList.remove(constants.CLASS_HIDDEN);
            dialog.showMobileDialog();
            expect(util.showElement).not.toBeCalled();
        });
    });

    describe('hideMobileDialog()', () => {
        it('should do nothing if the dialog element does not exist', () => {
            dialog.element = null;
            dialog.hideMobileDialog();
            expect(util.hideElement).not.toBeCalled();
        });

        it('should hide the mobile annotations dialog', () => {
            dialog.element = document.querySelector(constants.SELECTOR_MOBILE_ANNOTATION_DIALOG);
            dialog.unbindDOMListeners = jest.fn();

            dialog.hideMobileDialog();
            expect(util.hideElement).toBeCalled();
            expect(dialog.unbindDOMListeners).toBeCalled();
        });
    });

    describe('hide()', () => {
        beforeEach(() => {
            dialog.isMobile = false;
            dialog.element.classList.remove(constants.CLASS_HIDDEN);
            dialog.unbindDOMListeners = jest.fn();
        });

        it('should do nothing if element is already hidden', () => {
            dialog.element.classList.add(constants.CLASS_HIDDEN);
            dialog.hide();
            expect(util.hideElement).not.toBeCalled();
            expect(dialog.emit).not.toBeCalledWith('annotationhide');
        });

        it('should hide dialog immediately', () => {
            dialog.toggleFlippedThreadEl = jest.fn();
            dialog.hide();
            expect(util.hideElement).toBeCalledWith(dialog.element);
            expect(dialog.toggleFlippedThreadEl).toBeCalled();
            expect(dialog.emit).toBeCalledWith('annotationhide');
        });

        it('should hide the mobile dialog if using a mobile browser', () => {
            dialog.isMobile = true;
            dialog.hideMobileDialog = jest.fn();
            dialog.toggleFlippedThreadEl = jest.fn();
            dialog.hide();
            expect(dialog.hideMobileDialog).toBeCalled();
            expect(dialog.toggleFlippedThreadEl).toBeCalled();
            dialog.element = null;
            expect(dialog.emit).toBeCalledWith('annotationhide');
        });
    });

    describe('element()', () => {
        it('should return dialog element', () => {
            expect(dialog.element).toEqual(dialog.element);
        });
    });

    describe('setup()', () => {
        beforeEach(() => {
            const dialogEl = document.createElement('div');
            dialog.generateDialogEl = jest.fn().mockReturnValue(dialogEl);
            dialog.bindDOMListeners = jest.fn();
            dialog.show = jest.fn();
            dialog.unbindDOMListeners = jest.fn();
            dialog.isMobile = false;
        });

        it('should set up HTML element, add annotations to the dialog, and bind DOM listeners', () => {
            dialog.setup([annotation], {});
            expect(dialog.element).not.toBeNull();
            expect(dialog.bindDOMListeners).toBeCalled();
            expect(dialog.threadEl).not.toBeUndefined();
        });

        it('should not create dialog element if using a mobile browser', () => {
            dialog.isMobile = true;
            dialog.setup([annotation, annotation], {});
            expect(dialog.bindDOMListeners).not.toBeCalled();
            expect(dialog.show).toBeCalledWith([annotation, annotation]);
            dialog.element = null;
        });
    });

    describe('bindDOMListeners()', () => {
        beforeEach(() => {
            dialog.element.addEventListener = jest.fn();
        });

        it('should bind ALL DOM listeners for touch enabled laptops', () => {
            dialog.hasTouch = true;

            dialog.bindDOMListeners();
            expect(dialog.element.addEventListener).toBeCalledWith('keydown', expect.any(Function));
            expect(dialog.element.addEventListener).toBeCalledWith('click', expect.any(Function));
            expect(dialog.element.addEventListener).toBeCalledWith('mouseup', expect.any(Function));
            expect(dialog.element.addEventListener).toBeCalledWith('wheel', expect.any(Function));
            expect(dialog.element.addEventListener).toBeCalledWith('touchstart', dialog.clickHandler);
            expect(dialog.element.addEventListener).toBeCalledWith('touchstart', dialog.stopPropagation);
        });

        it('should not bind touch events if not on a touch enabled devices', () => {
            dialog.bindDOMListeners();
            expect(dialog.element.addEventListener).toBeCalledWith('keydown', expect.any(Function));
            expect(dialog.element.addEventListener).toBeCalledWith('click', expect.any(Function));
            expect(dialog.element.addEventListener).toBeCalledWith('mouseup', expect.any(Function));
            expect(dialog.element.addEventListener).toBeCalledWith('wheel', expect.any(Function));
            expect(dialog.element.addEventListener).not.toBeCalledWith('touchstart', dialog.clickHandler);
            expect(dialog.element.addEventListener).not.toBeCalledWith('touchstart', dialog.stopPropagation);
            dialog.element = null;
        });

        it('should not bind mouseenter/leave events for mobile browsers', () => {
            dialog.isMobile = true;

            dialog.bindDOMListeners();
            expect(dialog.element.addEventListener).toBeCalledWith('keydown', expect.any(Function));
            expect(dialog.element.addEventListener).toBeCalledWith('mouseup', expect.any(Function));
            expect(dialog.element.addEventListener).not.toBeCalledWith('click', expect.any(Function));
            expect(dialog.element.addEventListener).toBeCalledWith('wheel', expect.any(Function));
            dialog.element = null;
        });
    });

    describe('validateTextArea()', () => {
        const textEl = document.createElement('textarea');

        it('should do nothing if textarea is blank', () => {
            textEl.classList.add(constants.CLASS_INVALID_INPUT);
            dialog.validateTextArea({ target: textEl });
            expect(textEl.classList).toContain(constants.CLASS_INVALID_INPUT);
        });

        it('should remove red border around textarea', () => {
            textEl.classList.add(constants.CLASS_INVALID_INPUT);
            textEl.value = 'words';
            dialog.validateTextArea({ target: textEl });
            expect(textEl.classList).not.toContain(constants.CLASS_INVALID_INPUT);
        });
    });

    describe('unbindDOMListeners()', () => {
        beforeEach(() => {
            dialog.element.removeEventListener = jest.fn();
        });

        it('should unbind ALL DOM listeners for touch enabled laptops', () => {
            dialog.hasTouch = true;

            dialog.unbindDOMListeners();
            expect(dialog.element.removeEventListener).toBeCalledWith('keydown', expect.any(Function));
            expect(dialog.element.removeEventListener).toBeCalledWith('click', expect.any(Function));
            expect(dialog.element.removeEventListener).toBeCalledWith('mouseup', expect.any(Function));
            expect(dialog.element.removeEventListener).toBeCalledWith('touchstart', dialog.clickHandler);
            expect(dialog.element.removeEventListener).toBeCalledWith('touchstart', dialog.stopPropagation);
            expect(dialog.element.removeEventListener).toBeCalledWith('wheel', expect.any(Function));
        });

        it('should not bind touch events if not on a touch enabled devices', () => {
            dialog.unbindDOMListeners();
            expect(dialog.element.removeEventListener).toBeCalledWith('keydown', expect.any(Function));
            expect(dialog.element.removeEventListener).toBeCalledWith('click', expect.any(Function));
            expect(dialog.element.removeEventListener).toBeCalledWith('mouseup', expect.any(Function));
            expect(dialog.element.removeEventListener).toBeCalledWith('wheel', expect.any(Function));
            expect(dialog.element.removeEventListener).not.toBeCalledWith('touchstart', dialog.clickHandler);
            expect(dialog.element.removeEventListener).not.toBeCalledWith('touchstart', dialog.stopPropagation);
            dialog.element = null;
        });

        it('should not bind mouseenter/leave events for mobile browsers', () => {
            dialog.isMobile = true;

            dialog.unbindDOMListeners();
            expect(dialog.element.removeEventListener).toBeCalledWith('keydown', expect.any(Function));
            expect(dialog.element.removeEventListener).toBeCalledWith('mouseup', expect.any(Function));
            expect(dialog.element.removeEventListener).not.toBeCalledWith('click', expect.any(Function));
            expect(dialog.element.removeEventListener).toBeCalledWith('wheel', expect.any(Function));
        });
    });

    describe('keydownHandler()', () => {
        it('should cancel any unsaved annotations when user presses Esc on pending dialog', () => {
            dialog.cancelAnnotation = jest.fn();
            dialog.annotations = [];

            dialog.keydownHandler({
                key: 'U+001B', // esc key
                stopPropagation: jest.fn()
            });
            expect(dialog.cancelAnnotation).toBeCalled();
        });

        it('should hide the dialog when user presses Esc if not creating a new annotation', () => {
            dialog.hide = jest.fn();
            dialog.hasAnnotations = jest.fn().mockReturnValue(true);

            dialog.keydownHandler({
                key: 'U+001B', // esc key
                stopPropagation: jest.fn()
            });
            expect(dialog.hide).toBeCalled();
        });
    });

    describe('stopPropagation()', () => {
        it('should stop propagation on the event', () => {
            const event = {
                stopPropagation: jest.fn()
            };

            dialog.stopPropagation(event);
            expect(event.stopPropagation).toBeCalled();
        });
    });

    describe('clickHandler()', () => {
        let event;

        beforeEach(() => {
            event = { target: document.createElement('div') };

            dialog.cancelAnnotation = jest.fn();
            util.findClosestDataType = jest.fn();
            dialog.hideMobileDialog = jest.fn();

            dialog.isMobile = false;
            dialog.element.classList.remove(constants.CLASS_HIDDEN);
        });

        it('should cancel annotation when cancel annotation button is clicked', () => {
            util.findClosestDataType = jest.fn().mockReturnValue(constants.DATA_TYPE_MOBILE_CLOSE);
            dialog.clickHandler(event);
            expect(dialog.cancelAnnotation).toBeCalled();
        });

        it('should cancel annotation when mobile dialog close button is clicked', () => {
            util.findClosestDataType = jest.fn().mockReturnValue(constants.DATA_TYPE_MOBILE_CLOSE);
            dialog.clickHandler(event);
            expect(dialog.cancelAnnotation).toBeCalled();
        });

        it('should do nothing if dataType does not match any button in the annotation dialog', () => {
            util.findClosestDataType = jest.fn().mockReturnValue(null);

            dialog.clickHandler(event);
            expect(dialog.cancelAnnotation).not.toBeCalled();
        });
    });

    describe('postAnnotation()', () => {
        let annotationTextEl;

        beforeEach(() => {
            annotationTextEl = document.createElement('textarea');
            annotationTextEl.classList.add(constants.CLASS_ANNOTATION_TEXTAREA);
            dialog.element = rootElement;
            dialog.element.appendChild(annotationTextEl);
        });

        it('should not post an annotation to the dialog if it has no text', () => {
            dialog.postAnnotation();
            expect(dialog.emit).not.toBeCalled();
            expect(annotationTextEl.classList).toContain(CLASS_INVALID_INPUT);
        });

        it('should post an annotation to the dialog if it has text', () => {
            annotationTextEl.innerHTML += 'the preview SDK is great!';
            dialog.postAnnotation();
            expect(dialog.emit).toBeCalledWith('annotationcreate', 'the preview SDK is great!');
            expect(annotationTextEl.value).toEqual('');
        });
    });

    describe('cancelAnnotation()', () => {
        it('should emit the annotationcancel message', () => {
            dialog.cancelAnnotation();
            expect(dialog.emit).toBeCalledWith('annotationcancel');
        });
    });

    describe('postReply()', () => {
        let replyTextEl;

        beforeEach(() => {
            replyTextEl = document.createElement('textarea');
            replyTextEl.classList.add(constants.CLASS_REPLY_TEXTAREA);
            dialog.element = rootElement;
            dialog.element.appendChild(replyTextEl);

            replyTextEl.focus = jest.fn();
        });

        it('should not post reply to the dialog if it has no text', () => {
            dialog.postReply();
            expect(dialog.emit).not.toBeCalledWith('annotationcreate', 'the preview SDK is great!');
            expect(replyTextEl.classList).toContain(CLASS_INVALID_INPUT);
        });

        it('should post a reply to the dialog if it has text', () => {
            replyTextEl.innerHTML += 'the preview SDK is great!';
            dialog.postReply();
            expect(dialog.emit).toBeCalledWith('annotationcreate', 'the preview SDK is great!');
            expect(replyTextEl.value).toEqual('');
            expect(replyTextEl.focus).toBeCalled();
        });
    });

    describe('emitAnnotationDelete()', () => {
        it('should emit the annotationdelete message', () => {
            dialog.emitAnnotationDelete(annotation);
            expect(dialog.emit).toBeCalledWith('annotationdelete', annotation);
        });
    });

    describe('generateDialogEl', () => {
        it('should generate a blank annotations dialog element', () => {
            const dialogEl = dialog.generateDialogEl(0);
            const createSectionEl = dialogEl.querySelector(constants.SECTION_CREATE);
            const showSectionEl = dialogEl.querySelector(constants.SECTION_SHOW);
            expect(createSectionEl.classList).not.toContain(constants.CLASS_HIDDEN);
            expect(showSectionEl.classList).toContain(constants.CLASS_HIDDEN);
        });

        it('should generate an annotations dialog element with annotations', () => {
            const dialogEl = dialog.generateDialogEl(1);
            const createSectionEl = dialogEl.querySelector(constants.SECTION_CREATE);
            const showSectionEl = dialogEl.querySelector(constants.SECTION_SHOW);
            expect(createSectionEl.classList).toContain(constants.CLASS_HIDDEN);
            expect(showSectionEl.classList).not.toContain(constants.CLASS_HIDDEN);
        });

        it('should not add the create section nor the reply container in read-only mode', () => {
            dialog.canAnnotate = false;
            const dialogEl = dialog.generateDialogEl(1);

            const createSectionEl = dialogEl.querySelector(constants.SECTION_CREATE);
            const replyContainerEl = dialogEl.querySelector(constants.SELECTOR_REPLY_CONTAINER);
            const showSectionEl = dialogEl.querySelector(constants.SECTION_SHOW);
            expect(createSectionEl).toBeNull();
            expect(replyContainerEl).toBeNull();
            expect(showSectionEl.classList).not.toContain(constants.CLASS_HIDDEN);
        });
    });

    describe('flipDialog()', () => {
        const containerHeight = 5;

        beforeEach(() => {
            dialog.element = document.createElement('div');
            dialog.element.querySelector = jest.fn().mockReturnValue(document.createElement('div'));
            dialog.fitDialogHeightInPage = jest.fn();
            dialog.toggleFlippedThreadEl = jest.fn();
        });

        afterEach(() => {
            dialog.element = null;
        });

        it('should keep the dialog below the annotation icon if the annotation is in the top half of the viewport', () => {
            const { top, bottom } = dialog.flipDialog(2, containerHeight);
            expect(dialog.element.classList).not.toContain(CLASS_FLIPPED_DIALOG);
            expect(top).not.toEqual('');
            expect(bottom).toEqual('');
            expect(dialog.fitDialogHeightInPage).toBeCalled();
            expect(dialog.toggleFlippedThreadEl).toBeCalled();
        });

        it('should flip the dialog above the annotation icon if the annotation is in the lower half of the viewport', () => {
            const { top, bottom } = dialog.flipDialog(4, containerHeight);
            expect(dialog.element.classList).toContain(CLASS_FLIPPED_DIALOG);
            expect(top).toEqual('');
            expect(bottom).not.toEqual('');
        });
    });

    describe('toggleFlippedThreadEl()', () => {
        beforeEach(() => {
            dialog.element.classList.remove(constants.CLASS_HIDDEN);
            dialog.threadEl = document.createElement('div');
        });

        it('should do nothing if the dialog is not flipped', () => {
            dialog.toggleFlippedThreadEl();
            expect(dialog.threadEl.classList).not.toContain(CLASS_FLIPPED_DIALOG);
        });

        it('should reset thread icon if dialog is flipped and hidden', () => {
            dialog.element.classList.add(CLASS_FLIPPED_DIALOG);
            dialog.toggleFlippedThreadEl();
            expect(dialog.threadEl.classList).toContain(CLASS_FLIPPED_DIALOG);
        });

        it('should flip thread icon if dialog is flipped and not hidden', () => {
            dialog.element.classList.add(CLASS_FLIPPED_DIALOG);
            dialog.element.classList.add(constants.CLASS_HIDDEN);
            dialog.toggleFlippedThreadEl();
            expect(dialog.threadEl.classList).not.toContain(CLASS_FLIPPED_DIALOG);
        });
    });

    describe('fitDialogHeightInPage()', () => {
        it('should allow scrolling on annotations dialog if file is a powerpoint', () => {
            dialog.dialogEl = {
                style: {},
                querySelector: jest.fn().mockReturnValue(null)
            };
            dialog.container = { clientHeight: 100 };
            dialog.fitDialogHeightInPage();
            expect(dialog.dialogEl.style.maxHeight).toEqual('20px');
        });

        it('should allow scrolling on annotations dialog if file is a powerpoint', () => {
            const commentsEl = document.createElement('div');
            dialog.dialogEl = {
                style: {},
                querySelector: jest.fn().mockReturnValue(commentsEl)
            };
            dialog.container = { clientHeight: 100 };
            dialog.fitDialogHeightInPage();
            expect(dialog.dialogEl.style.maxHeight).toEqual('20px');
            expect(commentsEl.style.maxHeight).toEqual('20px');
        });
    });
});
