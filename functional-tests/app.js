/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable require-jsdoc */
/* eslint-disable no-console */
const express = require('express');
const path = require('path');
const BoxSDK = require('box-node-sdk');

const app = express();

const FILE_ID_DOC = '285405334010';
const ACCESS_TOKEN = 'F3D4ZM6OCIn6pR7pC2oYmhk4Ax40Ohhh';

app.use(express.static('lib'));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

function errorCallback(err) {
    console.log(err.response.body);
    throw err;
}

// viewed at http://localhost:8080
app.get('/', function(req, res) {
    // eslint-disable-next-line prefer-template
    const url = 'https://api.box.com/2.0/files/' + FILE_ID_DOC;
    const options = {
        actor: {
            id: '3504101558',
            name: 'Kanye West'
        }
    };

    const sdk = new BoxSDK({
        clientID: 'l20yq2uyg3y8vl27rvw67m8s0ryo9mrz',
        clientSecret: 'NUH UH'
    });
    const client = sdk.getBasicClient(ACCESS_TOKEN);

    client.exchangeToken(['item_preview'], url, options)
        .then((tokenInfo) => {
            // tokenInfo.accessToken contains the new annotator token
            res.render('index', { token: tokenInfo.accessToken, file_id: FILE_ID_DOC });
        })
        .catch(errorCallback);
});

const server = app.listen(8080, () => console.log('Example app listening on port 8080!'));

// this function is called when you want the server to die gracefully
// i.e. wait for existing connections
const gracefulShutdown = function() {
    console.log('Received kill signal, shutting down gracefully.');
    server.close(function() {
        console.log('Closed out remaining connections.');
        process.exit()
    });

    // if after
    setTimeout(function() {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit()
    }, 10*1000);
}

// listen for TERM signal .e.g. kill
process.on ('SIGTERM', gracefulShutdown);

// listen for INT signal e.g. Ctrl-C
process.on ('SIGINT', gracefulShutdown);