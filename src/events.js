// Events emitted by Annotators
export const ANNOTATOR_EVENT = {
    fetch: 'annotationsfetched',
    load: 'load', // Annotations is finished loading.
    scale: 'scaleannotations',
    notificationShow: 'notificationshow', // Show notification modal.
    notificationHide: 'notificationhide', // Hide notification modal.
    error: 'error', // When an error occurs.
    destroy: 'annotationsdestroyed',
    default: 'annotatorevent', // The default annotator event.
    metric: 'annotatormetric' // A annotator metric.
};

// Error codes logged by annotations with "annotations_error" events
export const ERROR_CODE = {
    PERMISSIONS_ANNOTATIONS: 'error_permissions_annotations',
    BAD_INPUT: 'error_bad_input',
    LOAD_ANNOTATIONS: 'error_load_annotations',
    LOAD_ANNOTATOR: 'error_load_annotator',
    GENERIC: 'error_generic',
    ANNOTATOR_LOAD_TIMEOUT: 'error_annotator_load_timeout'
};

export const ANNOTATIONS_LOAD_EVENT = '';
// Event fired from Preview with error details
export const ANNOTATIONS_ERROR = 'annotations_error';
// Event fired from Preview with performance metrics
export const ANNOTATIONS_METRIC = 'annotations_metric';
// Milestone events for loading performance
export const LOAD_METRIC = {
    annotationsLoadEvent: 'load', // Event name for annotations_metric events related to loading times.
    fetchResponseTime: 'fetch_response_time', // Time it took for TTFB when fetch annotations.
    pointAnnotationsLoadTime: 'point_annotations_load_time',
    plainHighlightAnnotationsLoadTime: 'plain_highlight_annotations_load_time',
    highlightCommentAnnotationsLoadTime: 'highlight_comment_annotations_load_time',
    drawAnnotationsLoadTime: 'draw_annotations_load_time',
    totalAnnotationsLoadTime: 'total_annotations_load_time'
};

export const DURATION_METRIC = 'annotations_duration_metric';
// Event fired from annotations with annotations duration metrics
export const ANNOTATIONS_END_EVENT = 'annotations_end';
// Event fired when the user attempts to download the file
