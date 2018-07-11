import EventEmitter from 'events';
import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import * as util from '../util';
import AnnotationsContainer from './AnnotationsContainer';

class DialogWrapper extends EventEmitter {
    /**
     * [constructor]
     *
     * @param {HTMLElement} containerEl - Container element
     * @param {Object} data - Profile data
     * @return {Profile} Instance
     */
    constructor(containerEl, data) {
        super();

        this.containerEl = containerEl;
        this.annotatedElement = data.annotatedElement;
        this.container = data.container;
        this.locale = data.locale;
        this.annotations = data.annotations;
    }

    /**
     * [destructor]
     *
     * @return {void}
     */
    destroy() {
        if (this.annotationComponent) {
            unmountComponentAtNode(this.annotationComponent);
            this.annotationComponent = null;
        }
    }

    /**
     * Renders Annotations Container into an html table
     *
     * @return {void}
     * @private
     */
    renderAnnotation() {
        const firstAnnotation = util.getFirstAnnotation(this.annotations);
        this.annotationComponent = render(
            <div>
                {firstAnnotation.threadNumber ? (
                    <AnnotationsContainer
                        key={`thread_${firstAnnotation.threadNumber}`}
                        localized={this.localized}
                        locale={this.locale}
                        annotations={this.annotations}
                        onConfirmDelete={this.onConfirmDelete}
                    />
                ) : null}
            </div>,
            this.containerEl
        );
    }
}

export default DialogWrapper;
