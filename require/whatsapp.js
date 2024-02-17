const axios = require('axios');

const urlWA = process.env.LINKWA;
const urlWA2 = process.env.LINKWA2;
const apikeyWA = process.env.APIKEYWA;
const apikeyWA2 = process.env.APIKEYWA2;
const idgrup = process.env.IDKOMUNITAS;

async function KirimPesanWA(nomorTujuan, pesan, linkGambar) {
    const payload = linkGambar
        ? { apikey: apikeyWA, to: nomorTujuan, message: pesan, url: linkGambar }
        : { apikey: apikeyWA, to: nomorTujuan, message: pesan };

    const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(payload),
        url: urlWA,
    };

    try {
        const response = await axios(options);
        return response.data;
    } catch (err) {
        return KirimPesanWA2(nomorTujuan, pesan);
    }
}

async function KirimPesanWA2(nomorTujuan, pesan) {
    const payload = {
        secretApp: apikeyWA2,
        grup: "no",
        phoneNumber: nomorTujuan,
        message: pesan,
    };

    const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(payload),
        url: urlWA2,
    };

    try {
        const response = await axios(options);
        // console.log(response.data);
        return response.data;
    } catch (err) {
        console.error(err);
        return { success: false, response: err };
    }
}

async function kirimNotif(pesan) {
    const payload = {
        secretApp: apikeyWA2,
        grup: "yes",
        phoneNumber: idgrup,
        message: pesan,
    };

    const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(payload),
        url: urlWA2,
    };

    try {
        const response = await axios(options);
        // console.log(response.data);
        return response.data;
    } catch (err) {
        console.error(err.response.data || err.message || err);
        return { success: false, response: err.response.data || err.message || err };
    }
}

module.exports = {
    KirimPesanWA,
    kirimNotif,
};