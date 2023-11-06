const { default: axios } = require("axios");

const getToken = async() => await axios.get(`${process.env.DING_CONNECT_BACKEND}/ding-access-token`).then((res) => {
    console.log("token",res?.data?.access_token);
    return res?.data?.access_token;
});

const instance = axios.create({
    
    baseURL: `${process.env.DING_BASE_URL}`,

});


instance.interceptors.request.use(
    async (config) => {

        await getToken().then(res => {
            config.headers.Authorization = `Bearer ${res}`;
            config.headers.Accept = "application/json";
        });
        console.log("config",config.headers);
        return config;
    },
    error => Promise.reject(error)
)

instance.interceptors.response.use(
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

module.exports = instance;