// @flow
import * as React from 'react';
import { getBrowserCoordinatesFromLocation } from '../../doc/docUtil';
import { createLocation } from '../../util';

type Props = {
    location: DrawingLocationInfo,
    parentEl: HTMLElement
};

class DrawingBoundary extends React.PureComponent<Props> {
    calculatePositioning = () => {
        const { location, parentEl } = this.props;
        const { minX, minY, maxX, maxY, dimensions } = location;

        const l1 = createLocation(minX, minY, dimensions);
        const l2 = createLocation(maxX, maxY, dimensions);
        const [x1, y1] = getBrowserCoordinatesFromLocation(l1, parentEl);
        const [x2, y2] = getBrowserCoordinatesFromLocation(l2, parentEl);

        const BOUNDARY_PADDING = 10;
        return {
            left: `${Math.min(x1, x2) - BOUNDARY_PADDING}px`,
            top: `${Math.min(y1, y2) + BOUNDARY_PADDING / 2}px`,
            width: Math.abs(x2 - x1) + 2 * BOUNDARY_PADDING,
            height: Math.abs(y2 - y1) + 2 * BOUNDARY_PADDING
        };
    };

    render() {
        return <div style={this.calculatePositioning()} className='ba-drawing-boundary' />;
    }
}

export default DrawingBoundary;
