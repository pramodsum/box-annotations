// @flow
import * as React from 'react';
import IconPointAnnotation from 'box-react-ui/lib/icons/annotations/IconPointAnnotation';
import PlainButton from 'box-react-ui/lib/components/plain-button';

import DrawingBoundary from './DrawingBoundary';
import { TYPES } from '../../constants';

type Props = {
    type: AnnotationType,
    location: Location,
    parentEl: HTMLElement
};

class AnnotationTether extends React.PureComponent<Props> {
    determineButton() {
        const { type, location, parentEl } = this.props;
        switch (type) {
            case TYPES.point:
                return <IconPointAnnotation />;
            case TYPES.highlight:
            case TYPES.highlight_comment:
                return null;
            case TYPES.draw:
                return <DrawingBoundary location={location} parentEl={parentEl} />;
            default:
                return null;
        }
    }

    render() {
        return <PlainButton className='ba-popover-toggle-btn'>{this.determineButton()}</PlainButton>;
    }
}

export default AnnotationTether;
