/* eslint-disable no-unused-expressions */
import fetchMock from 'fetch-mock';
import Annotation from '../Annotation';
import AnnotationService from '../AnnotationService';
import * as util from '../util';

const API_HOST = 'https://app.box.com/api';

let annotationService;
let sandbox;

describe('AnnotationService', () => {
    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        annotationService = new AnnotationService({
            apiHost: API_HOST,
            fileId: 1,
            token: 'someToken',
            canAnnotate: true
        });
    });

    afterEach(() => {
        sandbox.verifyAndRestore();
        fetchMock.restore();
    });

    describe('generateId()', () => {
        it('should return a rfc4122v4-compliant GUID', () => {
            const GUID = AnnotationService.generateId();
            const regex = /^[a-z0-9]{8}-[a-z0-9]{4}-4[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{12}$/i;
            expect(GUID.match(regex).length).to.satisfy;
        });

        it('should (almost always) return unique GUIDs', () => {
            expect(AnnotationService.generateId() === AnnotationService.generateId()).to.be.false;
        });
    });

    describe('create()', () => {
        const annotationToSave = new Annotation({
            fileVersionId: 2,
            threadId: AnnotationService.generateId(),
            type: 'point',
            threadNumber: '1',
            text: 'blah',
            location: { x: 0, y: 0 }
        });
        const url = `${API_HOST}/2.0/annotations`;

        it('should create annotation and return created object', () => {
            fetchMock.mock(url, {
                body: {
                    id: AnnotationService.generateId(),
                    item: {
                        id: annotationToSave.fileVersionId
                    },
                    details: {
                        type: annotationToSave.type,
                        threadId: annotationToSave.threadId,
                        location: annotationToSave.location
                    },
                    thread: annotationToSave.threadNumber,
                    message: annotationToSave.text,
                    created_by: {}
                }
            });
            const emitStub = sandbox.stub(annotationService, 'emit');

            return annotationService.create(annotationToSave).then((createdAnnotation) => {
                expect(createdAnnotation.fileVersionId).to.equal(annotationToSave.fileVersionId);
                expect(createdAnnotation.threadId).to.equal(annotationToSave.threadId);
                expect(createdAnnotation.threadNumber).to.equal(annotationToSave.threadNumber);
                expect(createdAnnotation.type).to.equal(annotationToSave.type);
                expect(createdAnnotation.text).to.equal(annotationToSave.text);
                expect(createdAnnotation.location.x).to.equal(annotationToSave.location.x);
                expect(createdAnnotation.location.y).to.equal(annotationToSave.location.y);
                expect(emitStub).to.not.be.called;
            });
        });

        it('should reject with an error if there was a problem creating', () => {
            fetchMock.mock(url, {
                body: {
                    type: 'error'
                }
            });
            const emitStub = sandbox.stub(annotationService, 'emit');

            return annotationService.create(annotationToSave).then(
                () => {
                    throw new Error('Annotation should not be returned');
                },
                (error) => {
                    expect(error.message).to.equal('Could not create annotation');
                    expect(emitStub).to.be.calledWith('annotationerror', {
                        reason: 'create',
                        error: sinon.match.string
                    });
                }
            );
        });
    });

    describe('read()', () => {
        const url = `${API_HOST}/2.0/files/1/annotations?version=2&fields=item,thread,details,message,created_by,created_at,modified_at,permissions`;

        it('should return array of annotations for the specified file and file version', () => {
            const annotation1 = new Annotation({
                fileVersionId: 2,
                threadId: AnnotationService.generateId(),
                type: 'point',
                text: 'blah',
                threadNumber: '1',
                location: { x: 0, y: 0 }
            });

            const annotation2 = new Annotation({
                fileVersionId: 2,
                threadId: AnnotationService.generateId(),
                type: 'highlight',
                text: 'blah2',
                threadNumber: '2',
                location: { x: 0, y: 0 }
            });

            fetchMock.mock(url, {
                body: {
                    entries: [
                        {
                            id: AnnotationService.generateId(),
                            item: {
                                id: annotation1.fileVersionId
                            },
                            details: {
                                type: annotation1.type,
                                threadId: annotation1.threadId,
                                location: annotation1.location
                            },
                            message: annotation1.text,
                            thread: annotation1.threadNumber,
                            created_by: {}
                        },
                        {
                            id: AnnotationService.generateId(),
                            item: {
                                id: annotation2.fileVersionId
                            },
                            details: {
                                type: annotation2.type,
                                threadId: annotation2.threadId,
                                location: annotation2.location
                            },
                            message: annotation2.text,
                            threadNumber: annotation2.threadNumber,
                            created_by: {}
                        }
                    ]
                }
            });

            return annotationService.read(2).then((annotations) => {
                expect(Object.keys(annotations).length).to.equal(2);

                const firstAnnotationId = Object.keys(annotations)[0];
                const createdAnnotation1 = annotations[firstAnnotationId];
                expect(createdAnnotation1.text).to.equal(annotation1.text);

                const secondAnnotationId = Object.keys(annotations)[1];
                const createdAnnotation2 = annotations[secondAnnotationId];
                expect(createdAnnotation2.text).to.equal(annotation2.text);
            });
        });

        it('should reject with an error if there was a problem reading', () => {
            fetchMock.mock(url, {
                body: {
                    type: 'error'
                }
            });

            return annotationService.read(2).then(
                () => {
                    throw new Error('Annotations should not be returned');
                },
                (error) => {
                    expect(error.message).to.equal('Could not read annotations from file version with Id 2');
                }
            );
        });
    });

    describe('delete()', () => {
        const url = `${API_HOST}/2.0/annotations/3`;

        it('should successfully delete the annotation', () => {
            fetchMock.mock(url, 204);
            const emitStub = sandbox.stub(annotationService, 'emit');

            return annotationService.delete(3).then(() => {
                expect(fetchMock.called(url)).to.be.true;
                expect(emitStub).to.not.be.called;
            });
        });

        it('should reject with an error if there was a problem deleting', () => {
            fetchMock.mock(url, {
                body: {
                    type: 'error'
                }
            });
            const emitStub = sandbox.stub(annotationService, 'emit');

            return annotationService.delete(3).then(
                () => {
                    throw new Error('Annotation should not have been deleted');
                },
                (error) => {
                    expect(error.message).to.equal('Could not delete annotation with Id 3');
                    expect(emitStub).to.be.calledWith('annotationerror', {
                        reason: 'delete',
                        error: sinon.match.string
                    });
                }
            );
        });
    });

    describe('getThreadMap()', () => {
        it('should call read and then generate a map of thread Id to annotations in those threads', () => {
            const annotation1 = new Annotation({
                fileVersionId: 2,
                annotationId: 1,
                type: 'point',
                text: 'blah',
                threadNumber: '1',
                threadId: '123abc',
                location: { x: 0, y: 0 }
            });

            const annotation2 = new Annotation({
                fileVersionId: 2,
                annotationId: 2,
                type: 'point',
                text: 'blah2',
                threadNumber: '2',
                threadId: '456def',
                location: { x: 0, y: 0 }
            });

            const annotation3 = new Annotation({
                fileVersionId: 2,
                annotationId: 3,
                type: 'point',
                text: 'blah3',
                threadNumber: '1',
                threadId: '123abc',
                location: { x: 0, y: 0 }
            });

            const threads = {
                1: annotation1,
                2: annotation2,
                3: annotation3
            };
            sandbox.stub(annotationService, 'read').returns(Promise.resolve(threads));
            sandbox.stub(annotationService, 'createThreadMap').returns(threads);

            return annotationService.getThreadMap(2).then((threadMap) => {
                expect(annotationService.createThreadMap).to.be.called;
            });
        });
    });

    describe('createThreadMap()', () => {
        it('should create a thread map with the correct annotations', () => {
            const annotation1 = new Annotation({
                fileVersionId: 2,
                annotationId: 1,
                type: 'point',
                text: 'blah',
                threadNumber: '1',
                threadId: '123abc',
                location: { x: 0, y: 0 }
            });

            const annotation2 = new Annotation({
                fileVersionId: 2,
                annotationId: 2,
                type: 'point',
                text: 'blah2',
                threadNumber: '2',
                threadId: '456def',
                location: { x: 0, y: 0 }
            });

            const annotation3 = new Annotation({
                fileVersionId: 2,
                annotationId: 3,
                type: 'point',
                text: 'blah3',
                threadNumber: '1',
                threadId: '123abc',
                location: { x: 0, y: 0 }
            });

            const annotation4 = new Annotation({
                fileVersionId: 2,
                annotationId: 4,
                type: 'point',
                text: 'blah4',
                threadNumber: '1',
                threadId: '123abc',
                location: { x: 0, y: 0 }
            });

            const threadMap = annotationService.createThreadMap([annotation1, annotation2, annotation3, annotation4]);

            expect(Object.keys(threadMap[annotation1.threadId]).length).to.equal(3);

            const thread = threadMap[annotation1.threadId];
            expect(thread[1]).to.deep.equal(annotation1);
            expect(thread[1].threadNumber).to.equal(annotation1.threadNumber);
            expect(thread).to.not.contain(annotation2);
        });
    });

    describe('createAnnotation()', () => {
        it('should call the Annotation constructor', () => {
            const data = {
                fileVersionId: 2,
                threadId: 1,
                type: 'point',
                text: 'blah3',
                threadNumber: '1',
                location: { x: 0, y: 0 },
                created: Date.now(),
                item: { id: 1 },
                details: { threadId: 1 },
                created_by: { id: 1 }
            };
            const annotation1 = annotationService.createAnnotation(data);

            expect(annotation1 instanceof Annotation).to.be.true;
        });
    });

    describe('readFromMarker()', () => {
        it('should get subsequent annotations if a marker is present', () => {
            const markerUrl = annotationService.getReadUrl(2, 'a', 1);

            const annotation2 = new Annotation({
                fileVersionId: 2,
                threadId: AnnotationService.generateId(),
                type: 'highlight',
                text: 'blah2',
                threadNumber: '1',
                location: { x: 0, y: 0 }
            });

            fetchMock.mock(markerUrl, {
                body: {
                    entries: [
                        {
                            id: AnnotationService.generateId(),
                            item: {
                                id: annotation2.fileVersionId
                            },
                            details: {
                                type: annotation2.type,
                                threadId: annotation2.threadId,
                                location: annotation2.location
                            },
                            thread: annotation2.threadNumber,
                            message: annotation2.text,
                            created_by: {}
                        }
                    ]
                }
            });

            let resolve;
            let reject;
            const promise = new Promise((success, failure) => {
                resolve = success;
                reject = failure;
            });

            annotationService.annotations = [];
            annotationService.readFromMarker(resolve, reject, 2, 'a', 1);
            promise.then((result) => {
                expect(Object.keys(result).length).to.equal(1);
                const firstAnnotation = util.getFirstAnnotation(result);
                expect(firstAnnotation.text).to.equal(annotation2.text);
                expect(firstAnnotation.threadNumber).to.equal(annotation2.threadNumber);
            });
        });

        it('should reject with an error and show a notification if there was a problem reading', () => {
            const markerUrl = annotationService.getReadUrl(2, 'a', 1);

            fetchMock.mock(markerUrl, {
                body: {
                    type: 'error'
                }
            });
            const emitStub = sandbox.stub(annotationService, 'emit');

            let resolve;
            let reject;
            const promise = new Promise((success, failure) => {
                resolve = success;
                reject = failure;
            });

            annotationService.annotations = [];
            annotationService.readFromMarker(resolve, reject, 2, 'a', 1);
            return promise.then(
                () => {
                    throw new Error('Annotation should not have been deleted');
                },
                (error) => {
                    expect(error.message).to.equal('Could not read annotations from file version with Id 2');
                    expect(emitStub).to.be.calledWith('annotationerror', {
                        reason: 'read',
                        error: sinon.match.string
                    });
                }
            );
        });

        it('should reject with an error and show a notification if the token is invalid', () => {
            const markerUrl = annotationService.getReadUrl(2, 'a', 1);

            fetchMock.mock(markerUrl, 401);
            const emitStub = sandbox.stub(annotationService, 'emit');

            let resolve;
            let reject;
            const promise = new Promise((success, failure) => {
                resolve = success;
                reject = failure;
            });

            annotationService.annotations = [];
            annotationService.readFromMarker(resolve, reject, 2, 'a', 1);
            return promise.catch((error) => {
                expect(error.message).to.equal('Could not read annotations from file due to invalid or expired token');
                expect(emitStub).to.be.calledWith('annotationerror', {
                    reason: 'authorization',
                    error: sinon.match.string
                });
            });
        });
    });

    describe('getReadUrl()', () => {
        it('should return the original url if no limit or marker exists', () => {
            annotationService.api = 'box';
            annotationService.fileId = 1;
            const fileVersionId = 2;
            const url = `${annotationService.api}/2.0/files/${annotationService.fileId}/annotations?version=${fileVersionId}&fields=item,thread,details,message,created_by,created_at,modified_at,permissions`;

            const result = annotationService.getReadUrl(fileVersionId);
            expect(result).to.equal(url);
        });

        it('should add a marker and limit if provided', () => {
            annotationService.api = 'box';
            annotationService.fileId = 1;
            const fileVersionId = 2;
            const marker = 'next_annotation';
            const limit = 1;
            const url = `${annotationService.api}/2.0/files/${annotationService.fileId}/annotations?version=${fileVersionId}&fields=item,thread,details,message,created_by,created_at,modified_at,permissions&marker=${marker}&limit=${limit}`;

            const result = annotationService.getReadUrl(fileVersionId, marker, limit);
            expect(result).to.equal(url);
        });
    });
});
