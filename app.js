const http = require("http");
var express = require("express");
const https = require("https");
const dotenv = require("dotenv").config();
var cors = require("cors");
const instance = require("./dingInstance");
const amadeusInstance = require("./amadeusInstance");

const port = process.env.PORT || 3000;

var app = express();

app.use(cors({ origin: "*" }));

// Parse POST requests as JSON payload
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(
  express.urlencoded({ extended: true })
); /* bodyParser.urlencoded() is deprecated */

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Ding connect backend api" });
});

// Serve static files
app.use(express.static("public"));
console.log("Port: " + port);
const ID = process.env.ID || "";
const SECRET = process.env.SECRET || "";
const AMADEUS_ID = process.env.AMADEUS_ID || "";
const AMADEUS_SECRET = process.env.AMADEUS_SECRET || "";

/**
 * Sends a POST request
 * @param {string} hostname
 * @param {string} path
 * @param {*} headers
 * @param {string} body
 * @returns A JSON payload object through a Promise.
 */
const postAsync = (hostname, path, headers, body) => {
  return new Promise(function (resolve, reject) {
    const options = {
      hostname: hostname,
      port: 443,
      path: path,
      method: "POST",
      headers: headers,
    };

    const req = https.request(options, (res) => {
      console.log(`[POST] ${res.statusCode} - https://${hostname}${path}`);

      let data = "";
      res.on("data", (chunk) => {
        data = data + chunk.toString();
      });

      res.on("end", () => {
        const json = JSON.parse(data);
        resolve(json);
      });
    });

    req.on("error", (error) => {
      console.error("error", error);
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

  // console.log('ID: ' + ID);
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-cache",
    "Content-Length": body.length,
  };

  return postAsync(hostname, path, headers, body);
};

/**
 * Gets a JWT token for authorization.
 * @param {string} hostname
 * @param {string} path
 * @returns a JWT token.
 */
const getAmadeusAccessToken = (hostname, path) => {
  const body = `grant_type=client_credentials&client_id=${AMADEUS_ID}&client_secret=${AMADEUS_SECRET}&grant_type=client_credentials`;

  // console.log('ID: ' + ID);
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-cache",
    "Content-Length": body.length,
  };

  return postAsync(hostname, path, headers, body);
};

const getDingAccessTokenAsync = () => {
  console.log("Get Ding Access Token");
  return getDingAccessToken("idp.ding.com", "/connect/token");
};

const getAmadeusAccessTokenAsync = () => {
  console.log("Get Amadeus Access Token");
  return getAmadeusAccessToken(
    "test.api.amadeus.com",
    "/v1/security/oauth2/token"
  );
};

app.get("/ding-access-token", function (request, response) {
  console.log(`[GET] ${request.url}`);

  getDingAccessTokenAsync()
    .then((accessToken) => {
      response.set("Content-Type", "application/json");
      response.send(JSON.stringify(accessToken));
    })
    .catch(() => {
      response.status(500);
    });
});

app.get("/amadeus-access-token", function (request, response) {
  console.log(`[GET] ${request.url}`);

  getAmadeusAccessTokenAsync()
    .then((accessToken) => {
      response.set("Content-Type", "application/json");
      response.send(JSON.stringify(accessToken));
    })
    .catch(() => {
      response.status(500);
    });
});

//AMADEUS GET APIs

app.post("/shopping/flight-offers", async function (request, response) {
  const destinationLocationCode = request?.body?.destinationLocationCode;
  const originLocationCode = request?.body?.originLocationCode;
  const adults = request?.body?.adults;
  const departureDate = request?.body?.departureDate;
  const returnDate = request?.body?.returnDate;
  const children = request?.body?.children ? request?.body?.children : 0;
  const infants = request?.body?.infants ? request?.body?.infants : 0;
  const travelClass = request?.body?.travelClass
    ? request?.body?.travelClass
    : "";
  const nonStop = request?.body?.nonStop;
  const max = request?.body?.max;
  try {
    if (request?.body?.returnDate) {
      const res = await amadeusInstance.get(
        `/v2/shopping/flight-offers?originLocationCode=${originLocationCode}&destinationLocationCode=${destinationLocationCode}&departureDate=${departureDate}&returnDate=${returnDate}&adults=${adults}&children=${children}&infants=${infants}&travelClass=${travelClass}&nonStop=${nonStop}&max=${max}`
      );
      const data = res.data;
      response.json(data);
    } else {
      const res = await amadeusInstance.get(
        `/v2/shopping/flight-offers?originLocationCode=${originLocationCode}&destinationLocationCode=${destinationLocationCode}&departureDate=${departureDate}&adults=${adults}&children=${children}&infants=${infants}&travelClass=${travelClass}&nonStop=${nonStop}&max=${max}`
      );
      const data = res.data;
      response.json(data);
    }
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Internal Server Error" });
  }
});

//AMADEUS POST APIs

const amadeusFlightBookingPostAsync = async (endpoint, payload) => {
  try {
    const res = await amadeusInstance.post(endpoint, payload);
    const data = res.data;
    return data;
  } catch (error) {
    console.error(error);
    return error;
  }
};

app.post("/shopping/flight-offers/pricing", async function (request, response) {
  const flightOfferData = request.body.flightOfferData;

  const payload = JSON.stringify({
    data: {
      type: "flight-offers-pricing",
      flightOffers: [flightOfferData],
    },
  });

  await amadeusFlightBookingPostAsync(
    `/v1/shopping/flight-offers/pricing?forceClass=false`,
    payload
  )
    .then((res) => {
      response.json(res);
    })
    .catch((error) => {
      console.error(error);
      response.status(500).json({ message: "Internal Server Error" });
    });
});

app.post("/booking/flight-orders", async function (request, response) {
  const flightOfferPriceData = request.body.flightOfferPriceData;

  const payload = {
    data: {
      type: "flight-order",
      flightOffers: [flightOfferPriceData],
      travelers: [
        {
          id: "1",
          dateOfBirth: "1982-01-16",
          name: {
            firstName: "JORGE",
            lastName: "GONZALES",
          },
          gender: "MALE",
          contact: {
            emailAddress: "jorge.gonzales833@telefonica.es",
            phones: [
              {
                deviceType: "MOBILE",
                countryCallingCode: "34",
                number: "480080076",
              },
            ],
          },
          documents: [
            {
              documentType: "PASSPORT",
              birthPlace: "Madrid",
              issuanceLocation: "Madrid",
              issuanceDate: "2015-04-14",
              number: "00000000",
              expiryDate: "2025-04-14",
              issuanceCountry: "ES",
              validityCountry: "ES",
              nationality: "ES",
              holder: true,
            },
          ],
        },
        {
          id: "2",
          dateOfBirth: "2012-10-11",
          gender: "FEMALE",
          contact: {
            emailAddress: "jorge.gonzales833@telefonica.es",
            phones: [
              {
                deviceType: "MOBILE",
                countryCallingCode: "34",
                number: "480080076",
              },
            ],
          },
          name: {
            firstName: "ADRIANA",
            lastName: "GONZALES",
          },
        },
        {
          id: "3",
          dateOfBirth: "2018-10-11",
          gender: "FEMALE",
          contact: {
            emailAddress: "jorge.gonzales833@telefonica.es",
            phones: [
              {
                deviceType: "MOBILE",
                countryCallingCode: "34",
                number: "480080076",
              },
            ],
          },
          name: {
            firstName: "ADRIANA",
            lastName: "GONZALES",
          },
        },
        {
          id: "4",
          dateOfBirth: "2022-10-11",
          gender: "FEMALE",
          contact: {
            emailAddress: "jorge.gonzales833@telefonica.es",
            phones: [
              {
                deviceType: "MOBILE",
                countryCallingCode: "34",
                number: "480080076",
              },
            ],
          },
          name: {
            firstName: "ADRIANA",
            lastName: "GONZALES",
          },
        }
      ],
      remarks: {
        general: [
          {
            subType: "GENERAL_MISCELLANEOUS",
            text: "ONLINE BOOKING FROM INCREIBLE VIAJES",
          },
        ],
      },
      ticketingAgreement: {
        option: "DELAY_TO_CANCEL",
        delay: "6D",
      },
      contacts: [
        {
          addresseeName: {
            firstName: "PABLO",
            lastName: "RODRIGUEZ",
          },
          companyName: "INCREIBLE VIAJES",
          purpose: "STANDARD",
          phones: [
            {
              deviceType: "LANDLINE",
              countryCallingCode: "34",
              number: "480080071",
            },
            {
              deviceType: "MOBILE",
              countryCallingCode: "33",
              number: "480080072",
            },
          ],
          emailAddress: "support@increibleviajes.es",
          address: {
            lines: ["Calle Prado, 16"],
            postalCode: "28014",
            cityName: "Madrid",
            countryCode: "ES",
          },
        },
      ],
    },
  };

  await amadeusFlightBookingPostAsync(`/v1/booking/flight-orders`, payload)
    .then((res) => {
      response.json(res);
    })
    .catch((error) => {
      console.error(error);
      response.status(500).json({ message: "Internal Server Error" });
    });
});

//Ding Get APIs

app.get("/GetErrorCodeDescriptions", async function (request, response) {
  console.log(`[GET] ${request.url}`);
  try {
    const res = await instance.get(`/api/V1/GetErrorCodeDescriptions`);
    const data = res.data;
    response.json(data);
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/GetAccountLookup", async function (request, response) {
  const accountNumber = request.body.accountNumber;
  console.log(`[GET] ${request.url}`);
  try {
    const res = await instance.get(
      `/api/V1/GetAccountLookup?accountNumber=${accountNumber}`
    );
    const data = res.data;
    response.json(data);
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/GetPromotionDescriptions", async function (request, response) {
  const languageCodes = request.body.languageCodes;
  console.log(`[GET] ${request.url}`);
  try {
    const res = await instance.get(
      `/api/V1/GetPromotionDescriptions?languageCodes=${languageCodes}`
    );
    const data = res.data;
    response.json(data);
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/GetPromotions", async function (request, response) {
  const countryIsos = request.body.countryIsos;
  const providerCodes = request.body.providerCodes;
  const accountNumber = request.body.accountNumber;
  console.log(`[GET] ${request.url}`);
  try {
    const res = await instance.get(
      `/api/V1/GetPromotions?countryIsos=${countryIsos}&providerCodes=${providerCodes}&accountNumber=${accountNumber}`
    );
    const data = res.data;
    response.json(data);
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Internal Server Error" });
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
    response.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/GetProductDescriptions", async function (request, response) {
  const skuCodes = request.body.skuCodes;
  const languageCodes = request.body.languageCodes;
  console.log(`[GET] ${request.url}`);
  try {
    const res = await instance.get(
      `/api/V1/GetProductDescriptions?languageCodes=${languageCodes}&skuCodes=${skuCodes}`
    );
    const data = res.data;
    response.json(data);
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/GetProducts", async function (request, response) {
  const providerCodes = request.body.providerCodes;
  const countryIsos = request.body.countryIsos;
  const regionCodes = request.body.regionCodes;
  console.log(`[GET] ${request.url}`);
  try {
    const res = await instance.get(
      `/api/V1/GetProducts?countryIsos=${countryIsos}&providerCodes=${providerCodes}&regionCodes=${regionCodes}`
    );
    const data = res.data;
    response.json(data);
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/GetProviderStatus", async function (request, response) {
  const providerCodes = request.body.providerCodes;
  console.log(`[GET] ${request.url}`);
  try {
    const res = await instance.get(
      `/api/V1/GetProviderStatus?providerCodes=${providerCodes}`
    );
    const data = res.data;
    response.json(data);
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/GetProviders", async function (request, response) {
  const countryIsos = request.body.countryIsos;
  const regionCodes = request.body.regionCodes;
  const accountNumber = request.body.accountNumber;
  console.log(`[GET] ${request.url}`);
  try {
    if (accountNumber && accountNumber?.length > 0) {
      const res = await instance.get(
        `/api/V1/GetProviders?countryIsos=${countryIsos}&regionCodes=${regionCodes}&accountNumber=${accountNumber}`
      );
      const data = res.data;
      response.json(data);
    } else {
      const res = await instance.get(
        `/api/V1/GetProviders?countryIsos=${countryIsos}&regionCodes=${regionCodes}`
      );
      const data = res.data;
      response.json(data);
    }
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/GetCurrencies", async function (request, response) {
  console.log(`[GET] ${request.url}`);
  try {
    const res = await instance.get("/api/V1/GetCurrencies");
    const data = res.data;
    response.json(data);
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/GetRegions", async function (request, response) {
  const countryIsos = request.body.countryIsos;
  console.log(`[GET] ${request.url}`);
  try {
    const res = await instance.get(
      `/api/V1/GetRegions?countryIsos=${countryIsos}`
    );
    const data = res.data;
    response.json(data);
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/GetCountries", async function (request, response) {
  console.log(`[GET] ${request.url}`);
  try {
    const res = await instance.get("/api/V1/GetCountries");
    const data = res.data;
    response.json(data);
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Internal Server Error" });
  }
});

//Ding post APIs

const sendTransferPostAsync = async (payload) => {
  try {
    const res = await instance.post(`/api/V1/SendTransfer`, payload);
    const data = res.data;
    return data;
  } catch (error) {
    console.error(error);
    return error;
  }
};

app.post("/SendTransfer", async function (request, response) {
  // console.log(`[GET] ${request.url}`);
  const SkuCode = request.body.SkuCode;
  const SendValue = request.body.SendValue;
  const AccountNumber = request.body.AccountNumber;
  const DistributorRef = request.body.DistributorRef;
  const ValidateOnly = request.body.ValidateOnly;
  const SendCurrencyIso = request.body.SendCurrencyIso;

  const payload = {
    SkuCode: SkuCode,
    SendValue: SendValue,
    AccountNumber: AccountNumber,
    DistributorRef: DistributorRef,
    ValidateOnly: ValidateOnly,
    SendCurrencyIso: SendCurrencyIso,
  };
  // const payload = {
  //       "SkuCode" : "RJININ80851",
  //       "SendValue" : 0.9,
  //       "AccountNumber": "910000000000",
  //       "DistributorRef": "123",
  //       "ValidateOnly": false,
  //       "SendCurrencyIso": "USD",
  // }

  console.log("payload", payload);

  // const headers = {
  //     'Content-Type': 'application/json',
  //     'Access-Control-Allow-Origin':'*',
  //     'Cache-Control': 'no-cache',
  // };

  // const hostname = `${process.env.DING_BASE_URL}`;

  // const path = `/api/V1/SendTransfer`

  // console.log(`[POST] ${request.url}`);
  // try {
  //     await postAsync(hostname, path, headers, payload).then((res) => {
  //       response.set('Content-Type', 'application/json');
  //       response.send(JSON.stringify(res));
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     response.status(500).json({ message: 'Internal Server Error' });
  //   }

  await sendTransferPostAsync(payload)
    .then((res) => {
      response.json(res);
    })
    .catch((error) => {
      console.error(error);
      response.status(500).json({ message: "Internal Server Error" });
    });
  // try {
  //   const res = await instance.post(`/api/V1/SendTransfer`,payload);
  //   const data = res.data;
  //   response.json(data);
  // } catch (error) {
  //   console.error(error);
  //   response.status(500).json({ message: 'Internal Server Error' });
  // }
});

var server2 = app.listen(port, function () {
  var host = server2.address().address;
  var port = server2.address().port;
  console.log("Ding connect api backend listening at http://%s:%s", host, port);
});
