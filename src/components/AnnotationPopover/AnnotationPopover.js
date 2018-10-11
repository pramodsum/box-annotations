// @flow
import React from 'react';
import classNames from 'classnames';
import noop from 'lodash/noop';
import Overlay from 'box-react-ui/lib/components/flyout/Overlay';
import Flyout from 'box-react-ui/lib/components/flyout/Flyout';

import Internationalize from '../Internationalize';
import CommentList from '../CommentList';
import AnnotationTether from './AnnotationTether';

import './AnnotationPopover.scss';
import ActionControls from '../ActionControls';
import AnnotatorLabel from './AnnotatorLabel';

type Props = {
    canComment: boolean,
    position: Function,
    onDelete: Function,
    onCancel: Function,
    onCreate: Function,
    onCommentClick: Function,
    isPending: boolean,
    language?: string,
    messages?: StringMap,
    parentEl: HTMLElement
} & Annotation;

class AnnotationPopover extends React.PureComponent<Props> {
    static defaultProps = {
        isPending: false,
        canAnnotate: false,
        canComment: false,
        canDelete: false,
        onCommentClick: noop,
        onDelete: noop,
        onCancel: noop,
        onCreate: noop,
        comments: []
    };

    componentDidMount() {
        // const { position } = this.props;
        // position();
    }

    render() {
        const {
            id,
            type,
            createdAt,
            createdBy,
            comments,
            canComment,
            canAnnotate,
            isPending,
            canDelete,
            onDelete,
            onCancel,
            onCreate,
            onCommentClick,
            location,
            parentEl,
            language,
            messages: intlMessages
        } = this.props;

        return (
            <Internationalize language={language} messages={intlMessages}>
                <Flyout className='ba-popover' isVisibleByDefault={true} position='bottom-center'>
                    <AnnotationTether type={type} location={location} parentEl={parentEl} />
                    <Overlay
                        className={classNames('ba-popover-overlay', {
                            'ba-inline': !isPending && !comments,
                            'ba-create-popover': isPending
                        })}
                    >
                        {comments.length > 0 ? (
                            <CommentList comments={comments} onDelete={onDelete} />
                        ) : (
                            <AnnotatorLabel id={id} type={type} createdBy={createdBy} isPending={isPending} />
                        )}
                        {canAnnotate && (
                            <ActionControls
                                id={id}
                                type={type}
                                hasComments={!!comments}
                                isPending={isPending}
                                canComment={canComment}
                                canDelete={canDelete}
                                createdBy={createdBy}
                                createdAt={createdAt}
                                onCreate={onCreate}
                                onCancel={onCancel}
                                onDelete={onDelete}
                                onCommentClick={onCommentClick}
                            />
                        )}
                    </Overlay>
                </Flyout>
            </Internationalize>
        );
    }
}

export default AnnotationPopover;
