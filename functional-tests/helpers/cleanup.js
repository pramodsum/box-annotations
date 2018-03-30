/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable require-jsdoc */
/* eslint-disable no-console */
const BoxSDK = require('box-node-sdk');

const {
    FILE_ID,
    FILE_VERSION_ID
} = process.env;

const ACCESS_TOKEN = 'F3D4ZM6OCIn6pR7pC2oYmhk4Ax40Ohhh';
const CLIENT_ID = 'l20yq2uyg3y8vl27rvw67m8s0ryo9mrz';

const sdk = new BoxSDK({
    clientID: CLIENT_ID,
    clientSecret: 'NUH UH'
});
const client = sdk.getBasicClient(ACCESS_TOKEN);

function deleteAnnotation(annotation) {
    const { id } = annotation;
    client.del(`/annotations/${id}`, {}, function(err) {
        if (err) {
            // handle error
            throw err;
        }
        console.log(`Annotation ID ${id} was deleted`);
    });
}

module.exports = function() {
    client.get(`/files/${FILE_ID}/annotations?version=${FILE_VERSION_ID}`, {}, function(err, response) {
        if (err) {
            // handle error
            throw err;
        }

        const { entries } = response.body;
        if (!entries) {
            console.log('File does not have any existing annotations');
            return;
        }

        console.log(`Deleting ${entries.length} annotations`);
        entries.forEach(deleteAnnotation);
    });
}