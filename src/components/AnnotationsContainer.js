import PropTypes from 'prop-types';
import React from 'react';
import AnnotationElement from './AnnotationElement';

/* eslint-disable require-jsdoc */
const AnnotationsContainer = ({ annotations, localized, locale, onConfirmDelete }) => (
    <div className='ba-annotations-container'>
        {annotations.map((annotation) => (
            <AnnotationElement
                key={`annotation_${annotation.id}`}
                localized={localized}
                locale={locale}
                annotation={annotation}
                permissions={annotation.permissions}
                user={annotation.user}
                onConfirmDelete={onConfirmDelete}
            />
        ))}
    </div>
);

AnnotationsContainer.displayName = 'AnnotationsContainer';
AnnotationsContainer.propTypes = {
    localized: PropTypes.array,
    locale: PropTypes.string,
    annotations: PropTypes.array,
    permissions: PropTypes.object,
    user: PropTypes.object,
    onConfirmDelete: PropTypes.func
};

export default AnnotationsContainer;
