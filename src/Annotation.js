class Annotation {
    //--------------------------------------------------------------------------
    // Typedef
    //--------------------------------------------------------------------------

    /**
     * The data object for constructing an annotation.
     *
     * @typedef {Object} AnnotationData
     * @property {string} annotationId Annotation Id
     * @property {string} fileVersionId File version Id for this annotation
     * @property {string} threadId Thread Id
     * @property {string} thread Thread number
     * @property {string} type Annotation type, e.g. 'point' or 'highlight'
     * @property {string} text Annotation text
     * @property {Object} location Location object
     * @property {Object} user User creating/that created this annotation
     * @property {Object} permissions Permissions user has
     * @property {number} created Created timestamp
     * @property {number} modified Modified timestamp
     */

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * [constructor]
     *
     * @param {AnnotationData} data - Data for constructing annotation
     * @return {Annotation} Instance of annotation
     */
    constructor(data) {
        this.annotationId = data.annotationId;
        this.fileVersionId = data.fileVersionId;
        this.threadId = data.threadId;
        this.threadNumber = data.threadNumber;
        this.type = data.type;
        this.text = data.text;
        this.location = data.location;
        this.user = data.user;
        this.permissions = data.permissions;
        this.created = data.created;
        this.modified = data.modified;
    }
}

export default Annotation;
