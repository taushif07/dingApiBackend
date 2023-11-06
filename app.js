const http = require('http');
var express = require('express');
const https = require("https");
const dotenv = require('dotenv').config();
var cors = require('cors');
const instance = require('./dingInstance');


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

app.get("/GetErrorCodeDescriptions", async function (request, response) {
    console.log(`[GET] ${request.url}`);
    try {
        const res = await instance.get(`/api/V1/GetErrorCodeDescriptions`);
        const data = res.data;
        response.json(data);
      } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Internal Server Error' });
      }    
});

app.get("/GetAccountLookup", async function (request, response) {
    const accountNumber = "916203962194";
    console.log(`[GET] ${request.url}`);
    try {
        const res = await instance.get(`/api/V1/GetAccountLookup?accountNumber=${accountNumber}`);
        const data = res.data;
        response.json(data);
      } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Internal Server Error' });
      }    
});

app.get("/GetPromotionDescriptions", async function (request, response) {
    const languageCodes = "en"
    console.log(`[GET] ${request.url}`);
    try {
        const res = await instance.get(`/api/V1/GetPromotionDescriptions?languageCodes=${languageCodes}`);
        const data = res.data;
        response.json(data);
      } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Internal Server Error' });
      }    
});


app.get("/GetPromotions", async function (request, response) {
    const countryIsos = "IN";
    const providerCodes = "RJIN";
    const accountNumber = "916203962194";
    console.log(`[GET] ${request.url}`);
    try {
        const res = await instance.get(`/api/V1/GetPromotions?countryIsos=${countryIsos}&providerCodes=${providerCodes}&accountNumber=${accountNumber}`);
        const data = res.data;
        response.json(data);
      } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Internal Server Error' });
      }    
});

app.get("/GetBalance", async function (request, response) {
    console.log(`[GET] ${request.url}`);
    try {
        const res = await instance.get(`/api/V1/GetBalance`);
        const data = res.data;
        response.json(data);
      } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Internal Server Error' });
      }    
});

app.get("/GetProductDescriptions", async function (request, response) {
    const skuCodes = "RJININ80851"
    console.log(`[GET] ${request.url}`);
    try {
        const res = await instance.get(`/api/V1/GetProductDescriptions?skuCodes=${skuCodes}`);
        const data = res.data;
        response.json(data);
      } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Internal Server Error' });
      }    
});

app.get("/GetProducts", async function (request, response) {
    const providerCodes = "RJIN";
    const countryIsos = "IN";
    const regionCodes = "IN";
    console.log(`[GET] ${request.url}`);
    try {
        const res = await instance.get(`/api/V1/GetProducts?countryIsos=${countryIsos}&providerCodes=${providerCodes}&regionCodes=${regionCodes}`);
        const data = res.data;
        response.json(data);
      } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Internal Server Error' });
      }    
});

app.get("/GetProviderStatus", async function (request, response) {
    const providerCodes = "RJIN"
    console.log(`[GET] ${request.url}`);
    try {
        const res = await instance.get(`/api/V1/GetProviderStatus?providerCodes=${providerCodes}`);
        const data = res.data;
        response.json(data);
      } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Internal Server Error' });
      }    
});

app.get("/GetProviders", async function (request, response) {
    const countryIsos = "IN";
    const regionCodes = "IN";
    const accountNumber = "916203962194";
    console.log(`[GET] ${request.url}`);
    try {
        const res = await instance.get(`/api/V1/GetProviders?countryIsos=${countryIsos}&regionCodes=${regionCodes}&accountNumber=${accountNumber}`);
        const data = res.data;
        response.json(data);
      } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Internal Server Error' });
      }    
});

app.get("/GetCurrencies", async function (request, response) {
    console.log(`[GET] ${request.url}`);
    try {
        const res = await instance.get('/api/V1/GetCurrencies');
        const data = res.data;
        response.json(data);
      } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Internal Server Error' });
      }    
});

app.get("/GetRegions", async function (request, response) {
    console.log(`[GET] ${request.url}`);
    try {
        const res = await instance.get('/api/V1/GetRegions');
        const data = res.data;
        response.json(data);
      } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Internal Server Error' });
      }    
});

app.get("/GetCountries", async function (request, response) {
    console.log(`[GET] ${request.url}`);
    try {
        const res = await instance.get('/api/V1/GetCountries');
        const data = res.data;
        response.json(data);
      } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Internal Server Error' });
      }
});

var server2 = app.listen(port, function () {
  var host = server2.address().address;
  var port = server2.address().port;
  console.log("Ding connect api backend listening at http://%s:%s", host, port);
});