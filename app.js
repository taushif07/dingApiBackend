const http = require('http');
var express = require('express');
const https = require("https");
const dotenv = require('dotenv').config();
var cors = require('cors');



const port = process.env.PORT || 3000;

var app = express();


app.use(cors({origin: '*'}));

// Parse POST requests as JSON payload
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));   /* bodyParser.urlencoded() is deprecated */

  // simple route
app.get("/", (req, res) => {
    res.json({ message: "Welcome to Ding connect backend api" });
  });

// Serve static files
app.use(express.static('public'))
console.log("Port: " + port)
const ID = process.env.ID || '';
const SECRET = process.env.SECRET || '';

/**
 * Sends a POST request
 * @param {string} hostname
 * @param {string} path 
 * @param {*} headers 
 * @param {string} body 
 * @returns A JSON payload object through a Promise.
 */
const postAsync = (hostname, path, headers, body) => {
    return new Promise(function(resolve, reject) {
        const options = {
            hostname: hostname,
            port: 443,
            path: path,
            method: 'POST',
            headers: headers
        };
        
        const req = https.request(options, res => {
            console.log(`[POST] ${res.statusCode} - https://${hostname}${path}`);

            let data = '';
            res.on('data', (chunk) => {
                data = data + chunk.toString();
            });

            res.on('end', () => {
                const json = JSON.parse(data);
                resolve(json);
            })
        });
        
        req.on('error', error => {
            console.error('error', error);
            reject(error);
        });
        
        req.write(body);
        req.end();
    });
};

/**
 * Gets a JWT token for authorization.
 * @param {string} hostname 
 * @param {string} path 
 * @returns a JWT token.
 */
const getDingAccessToken = (hostname, path) => {
    const body = `client_id=${ID}&client_secret=${SECRET}&grant_type=client_credentials`;

    console.log('ID: ' + ID);
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Access-Control-Allow-Origin':'*',
        'Cache-Control': 'no-cache',
        'Content-Length': body.length
    };

    return postAsync(hostname, path, headers, body);
}

const getDingAccessTokenAsync = () => {
    console.log('Get Ding Access Token');
    return getDingAccessToken('idp.ding.com', '/connect/token');

}

app.get('/ding-access-token', function (request, response) {
    console.log(`[GET] ${request.url}`);

    getDingAccessTokenAsync()
        .then(accessToken => {
            response.set('Content-Type', 'application/json');
            response.send(JSON.stringify(accessToken));
        })
        .catch(() => {
            response.status(500);
        });
});

var server2 = app.listen(port, function () {
  var host = server2.address().address;
  var port = server2.address().port;
  console.log("Dolby.io sample app listening at http://%s:%s", host, port);
});