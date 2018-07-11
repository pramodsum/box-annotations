import formatTaggedMessage from 'box-react-ui/lib/features/activity-feed/utils/formatTaggedMessage';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import * as constants from '../constants';

import DeleteConfirmation from './DeleteConfirmation';
import Profile from './Profile';

class AnnotationElement extends Component {
    static propTypes = {
        localized: PropTypes.array,
        locale: PropTypes.string,
        annotation: PropTypes.object,
        permissions: PropTypes.object,
        user: PropTypes.object,
        onConfirmDelete: PropTypes.func
    };

    constructor(props) {
        super(props);

        const { annotation, locale } = this.props;
        this.createdBy = new Date(annotation.created).toLocaleString(locale, {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getUserName = () => {
        const { localized } = this.props;

        // Temporary until annotation user API is available
        if (this.userId === '0') {
            return localized.posting;
        }

        return user.name || localized.anonymousUserName;
    };

    render() {
        const { annotation, localized, permissions, user } = this.props;
        const { text, fileVersionId, annotationID } = annotation;
        return (
            <div
                className={constants.CLASS_COMMENT}
                key={`annotation_${annotationID}`}
                data-annotation-id={annotationID}
            >
                <Profile {...user} name={this.getUserName()} />
                <p className={constants.CLASS_ANNOTATION_COMMENT_TEXT}>
                    {formatTaggedMessage(text, fileVersionId, true)}
                </p>
                {permissions.can_delete && (
                    <DeleteConfirmation
                        annotationID={annotationID}
                        message={localized.deleteConfirmation}
                        {...localized}
                    />
                )}
            </div>
        );
    }
}

export default AnnotationElement;
