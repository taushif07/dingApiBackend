const { default: axios } = require("axios");

const getToken = async() => await axios.get(`${process.env.DING_CONNECT_BACKEND}/amadeus-access-token`).then((res) => {
    // console.log("token",res?.data?.access_token);
    return res?.data?.access_token;
});

const amadeusInstance = axios.create({
    
    baseURL: `${process.env.AMADEUS_BASE_URL}`,
    
});


amadeusInstance.interceptors.request.use(
    async (config) => {

        await getToken().then(res => {
            config.headers.Authorization = `Bearer ${res}`;
            config.headers.Accept = "application/json";
            config.headers["Content-Type"] = "application/json";
            config.headers['X-HTTP-Method-Override'] = 'GET';
        });
        // console.log("config",config.headers);
        // config.headers.Accept = "application/json";
        return config;
    },
    error => Promise.reject(error)
)

amadeusInstance.interceptors.response.use(
    response => {
        return response
    },
    error => {
        if ([401].includes(error.response.status)) {
            console.log("Invalid token or expired token.");
        }

        return Promise.reject(error)
    }
)

module.exports = amadeusInstance;