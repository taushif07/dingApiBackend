const http = require("http");
var express = require("express");
const https = require("https");
const dotenv = require("dotenv").config();
var cors = require("cors");
const instance = require("./dingInstance");
const amadeusInstance = require("./amadeusInstance");
const amadeusPostInstance = require("./amadeusPostInstance");

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

// Amadeus flight booking get Api start
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

app.post(`/reference-data/airlines`,async function (request, response) {
  const airlinesCodesArray = request.body.airlinesCodesArray;
  const airlineCodes = airlinesCodesArray.join(",");
  try {
    const res = await amadeusInstance.get(`/v1/reference-data/airlines?airlineCodes=${airlineCodes}`);
    const data = res.data;
    response.json(data);
  } catch(error) {
    console.log(error);
    response.status(500).json({message:"Internal Server Error"});
  }
});

// Amadeus flight booking get Api end

// Amadeus hotel booking get Api start

app.post(`/hotels/by-city`, async function (request, response) {
  const cityCode = request.body.cityCode;
  const radius = request.body.radius;
  const radiusUnit = request.body.radiusUnit;
  const amenities = request.body.amenities;
  const ratings = request.body.ratings;
  const hotelSource = request.body.hotelSource;
  // const cityCode = "BOM";
  // const radius = "10";
  // const radiusUnit = "KM";
  // const amenities = request.body.amenities;
  // const ratings = request.body.ratings;
  // const hotelSource = "ALL";
  try {
    if (amenities && ratings) {
      const res = await amadeusInstance.get(
        `/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}&radius=${radius}&radiusUnit=${radiusUnit}&amenities=${amenities}&ratings=${ratings}&hotelSource=${hotelSource}`
      );
      const data = res?.data;
      response.json(data);
    } else if (amenities && !ratings) {
      const res = await amadeusInstance.get(
        `/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}&radius=${radius}&radiusUnit=${radiusUnit}&amenities=${amenities}&hotelSource=${hotelSource}`
      );
      const data = res?.data;
      response.json(data);
    } else if (ratings && !amenities) {
      const res = await amadeusInstance.get(
        `/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}&radius=${radius}&radiusUnit=${radiusUnit}&ratings=${ratings}&hotelSource=${hotelSource}`
      );
      const data = res?.data;
      response.json(data);
    } else if (!amenities && !ratings) {
      const res = await amadeusInstance.get(
        `/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}&radius=${radius}&radiusUnit=${radiusUnit}&hotelSource=${hotelSource}`
      );
      const data = res?.data;
      response.json(data);
    }
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Internal Server Error" });
  }
});

app.post(`/hotels/by-geocode`, async function (request, response) {
  const latitude = request.body.latitude;
  const longitude = request.body.longitude;
  const radius = request.body.radius;
  const radiusUnit = request.body.radiusUnit;
  const amenities = request.body.amenities;
  const ratings = request.body.ratings;
  const hotelSource = request.body.hotelSource;
  // const latitude = 19.09361;
  // const longitude = 72.8549;
  // const radius = 100;
  // const radiusUnit = "KM";
  // const amenities =
  //   "SWIMMING_POOL, SPA, FITNESS_CENTER, AIR_CONDITIONING, RESTAURANT, PARKING, PETS_ALLOWED, AIRPORT_SHUTTLE, BUSINESS_CENTER, DISABLED_FACILITIES, WIFI, MEETING_ROOMS, NO_KID_ALLOWED, TENNIS, GOLF, KITCHEN, ANIMAL_WATCHING, BABY-SITTING, BEACH, CASINO, JACUZZI, SAUNA, SOLARIUM, MASSAGE, VALET_PARKING";
  // const ratings = "5,4";
  // const hotelSource = "ALL";
  try {
    if (amenities && ratings) {
      const res = await amadeusInstance.get(
        `/v1/reference-data/locations/hotels/by-geocode?latitude=${latitude}&longitude=${longitude}&radius=${radius}&radiusUnit=${radiusUnit}&amenities=${amenities}&ratings=${ratings}&hotelSource=${hotelSource}`
      );
      const data = res?.data;
      response.json(data);
    } else if (amenities && !ratings) {
      const res = await amadeusInstance.get(
        `/v1/reference-data/locations/hotels/by-geocode?latitude=${latitude}&longitude=${longitude}&radius=${radius}&radiusUnit=${radiusUnit}&amenities=${amenities}&hotelSource=${hotelSource}`
      );
      const data = res?.data;
      response.json(data);
    } else if (ratings && !amenities) {
      const res = await amadeusInstance.get(
        `/v1/reference-data/locations/hotels/by-geocode?latitude=${latitude}&longitude=${longitude}&radius=${radius}&radiusUnit=${radiusUnit}&ratings=${ratings}&hotelSource=${hotelSource}`
      );
      const data = res?.data;
      response.json(data);
    } else if (!amenities && !ratings) {
      const res = await amadeusInstance.get(
        `/v1/reference-data/locations/hotels/by-geocode?latitude=${latitude}&longitude=${longitude}&radius=${radius}&radiusUnit=${radiusUnit}&hotelSource=${hotelSource}`
      );
      const data = res?.data;
      response.json(data);
    }
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Internal Server Error" });
  }
});

app.post(`/hotel-offers`,async function (request, response) {
  const hotelIds = request.body.hotelIds;
  const adults = request.body.adults;
  const checkInDate = request.body.checkInDate;
  const checkOutDate = request.body.checkOutDate;
  const roomQuantity = request.body.roomQuantity;
  try {
    const res = await amadeusInstance.get(`/v3/shopping/hotel-offers?hotelIds=${hotelIds}&adults=${adults}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&roomQuantity=${roomQuantity}`);
    const data = res?.data;
    response.json(data);
  } catch(error) {
    console.error(error);
    response.status(500).json({ message: "Internal Server Error" });
  }
});

// Amadeus hotel booking get Api end

//AMADEUS POST APIs

const amadeusFlightBookingPostAsync = async (instance, endpoint, payload) => {
  try {
    const res = await instance.post(endpoint, payload);
    const data = res.data;
    return data;
  } catch (error) {
    console.error(error);
    return error;
  }
};

// Amadeus flight booking post api start

app.post("/shopping/flight-offers/pricing", async function (request, response) {
  const flightOfferData = request.body.flightOfferData;

  const payload = JSON.stringify({
    data: {
      type: "flight-offers-pricing",
      flightOffers: [flightOfferData],
    },
  });

  await amadeusFlightBookingPostAsync(
    amadeusInstance,
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
  const travelers = request.body.travelers;
  const contacts = request.body.contacts;

  const payload = JSON.stringify({
    data: {
      type: "flight-order",
      flightOffers: [flightOfferPriceData],
      travelers: travelers,
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
      contacts: contacts,
    },
  });

  await amadeusFlightBookingPostAsync(
    amadeusPostInstance,
    `/v1/booking/flight-orders`,
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

// Amadeus flight booking post api end

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
