import PropTypes from 'prop-types';
import React, { Component } from 'react';

import IconTrash from 'box-react-ui/lib/icons/general/IconTrash';
import Button from 'box-react-ui/lib/components/button/Button';
import PlainButton from 'box-react-ui/lib/components/plain-button/PlainButton';
import PrimaryButton from 'box-react-ui/lib/components/primary-button/PrimaryButton';

import * as constants from '../constants';

const CLASS_CANCEL_DELETE = 'cancel-delete-btn';
const CLASS_BUTTON_DELETE_COMMENT = 'delete-comment-btn';
const CLASS_DELETE_CONFIRMATION = 'delete-confirmation';
const CLASS_BUTTON_DELETE_CONFIRM = 'confirm-delete-btn';

/* eslint-disable require-jsdoc */
class DeleteConfirmation extends Component {
    static propTypes = {
        annotationID: PropTypes.string,
        message: PropTypes.string,
        cancelButton: PropTypes.string,
        deleteButton: PropTypes.string,
        onConfirmDelete: PropTypes.func
    };

    constructor(props) {
        super(props);
        this.state = {
            isDeleteConfirmationOpen: false
        };
    }

    onDelete = () => {
        console.log('Delete?');
        this.setState({ isDeleteConfirmationOpen: true });
    };

    onCancelDelete = () => {
        console.log('Nope');
        this.setState({ isDeleteConfirmationOpen: false });
    };

    onConfirmDelete = () => {
        console.log('Yup');
        const { annotationID, onConfirmDelete } = this.props;
        onConfirmDelete(annotationID);
        this.setState({ isDeleteConfirmationOpen: false });
    };

    render() {
        const { message, cancelButton, deleteButton } = this.props;
        const { isDeleteConfirmationOpen } = this.state;

        return (
            <div>
                <PlainButton
                    className={`${constants.CLASS_BUTTON_PLAIN} ${CLASS_BUTTON_DELETE_COMMENT}`}
                    onClick={this.onDelete}
                    type='button'
                >
                    <IconTrash />
                </PlainButton>
                {isDeleteConfirmationOpen ? (
                    <div className={CLASS_DELETE_CONFIRMATION}>
                        <div className={constants.CLASS_DELETE_CONFIRM_MESSAGE}>{message}</div>
                        <div className={constants.CLASS_BUTTON_CONTAINER}>
                            <Button className={CLASS_CANCEL_DELETE} onClick={this.onCancelDelete} type='button'>
                                {cancelButton}
                            </Button>
                            <PrimaryButton
                                className={CLASS_BUTTON_DELETE_CONFIRM}
                                onClick={this.onConfirmDelete}
                                type='button'
                            >
                                {deleteButton}
                            </PrimaryButton>
                        </div>
                    </div>
                ) : null}
            </div>
        );
    }
}

export default DeleteConfirmation;
