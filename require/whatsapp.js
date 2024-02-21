const { logg, moment, readUserFile, title, author, nomorwa, Mikrotik, APPDEBUG, APPENV } = require('./main');
const axios = require('axios');

const urlWA = process.env.LINKWA;
const urlWA2 = process.env.LINKWA2;
const apikeyWA = process.env.APIKEYWA;
const apikeyWA2 = process.env.APIKEYWA2;
const idgrup = process.env.IDKOMUNITAS;

async function KirimPesanWA(nomorTujuan, pesan, linkGambar) {
    if (!APPDEBUG && ENV !== 'local') {
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
    } else {
        return { success: false, message: `Aplikasi dalam mode pengembang`};
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
    if (!APPDEBUG && ENV !== 'local') {

    } else {
        return { success: false, message: `Aplikasi dalam mode pengembang`};
    }
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

async function notif(hostname, username, role, message) {
    if (!APPDEBUG && ENV !== 'local') {
        let pesan = `Waktu : ${moment().format("DD/MMMM/YYYY - hh:mm:ss")}\nHostname : ${hostname}\nMikrotik : ${Mikrotik.mikrotikidentity}\nUsername : ${username}\nRole : ${role}\nMessage : \n\n'${message}'`
        try {
            const response = await kirimNotif(pesan);
            if (response.success) {
                logg(true, `Berhasil mengirimkan notif ke admin`);
            } else {
                logg(false, `Gagal mengirimkan notif ke admin`);
            }
            return response
        } catch (err) {
            return { success: false, response: err.message}
        }
    } else {
        return { success: false, message: `Aplikasi dalam mode pengembang`};
    }
}

async function notifmikrotik(message) {
    if (!APPDEBUG && ENV !== 'local') {
        let pesan = `Waktu : ${moment().format("DD/MMMM/YYYY - hh:mm:ss")}\n\n\n*'${message}'*\nMohon segera dicek lebih lanjut!`
        try {
            const response = await kirimNotif(pesan);
            if (response.success) {
                logg(true, `Berhasil mengirimkan notif ke admin`);
            } else {
                logg(false, `Gagal mengirimkan notif ke admin`);
            }
            return response
        } catch (err) {
            return { success: false, response: err.message}
        }
    } else {
        return { success: false, message: `Aplikasi dalam mode pengembang`};
    }
}

module.exports = {
    KirimPesanWA,
    kirimNotif,
    notif,
    notifmikrotik,
};