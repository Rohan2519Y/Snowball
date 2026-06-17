import axios from "axios";
const serverURL = 'http://localhost:5000'

const postData = async (url, body) => {
    try {
        var response = await axios.post(`${serverURL}/${url}`, body)
        var result = response.data
        return (result)
    }
    catch (e) {
        return (null)
    }
}

const getData = async (url) => {
    try {
        var response = await axios.get(`${serverURL}/${url}`)
        var result = response.data
        return (result)
    }
    catch (e) {
        return (null)
    }
}

const generateOtp = () => {
    var otp = parseInt((Math.random() * 8999) + 1000)
    return (otp)
}

function getDate() {
    const cd = new Date();
    return `${cd.getFullYear()}/${cd.getMonth() + 1}/${cd.getDate()}`;
}

function getTime() {
    const cd = new Date();
    return `${cd.getHours()}:${cd.getMinutes()}:${cd.getSeconds()}`;
}

const currentDate = () => {
    var d = new Date();
    var cd = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    var ct = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
    return cd + " " + ct;
};

const createDate = (date) => {
    var d = new Date(date);
    var cd = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    var ct = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
    return cd + " " + ct;
};

export { serverURL, postData, getData, generateOtp, getDate, getTime, currentDate, createDate}