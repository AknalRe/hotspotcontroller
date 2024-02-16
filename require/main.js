require('dotenv').config();

const title = process.env.TITLE;
const author = process.env.AUTHOR;
const nomorwa = process.env.NOMORWA;

const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
require('moment/locale/id');
moment.locale('id');
let fileuser = "./database/useraccount.json";

const databaseFolder = path.dirname(fileuser);

const Mikrotik = {
    mikrotikstatus: false,
};

async function readUserFile() {
    if (!fs.existsSync(databaseFolder)) {
        try {
            fs.mkdirSync(databaseFolder, { recursive: true });
            // Jika file tidak ditemukan, buat file baru dengan data pengguna default
            fs.writeFileSync(fileuser, JSON.stringify(userAccountData, null, 2), 'utf8');
            console.log("Folder berhasil dibuat:", databaseFolder);
        } catch (err) {
            console.error("Gagal membuat folder:", err);
        }
    }
    return new Promise((resolve, reject) => {
        fs.readFile(fileuser, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(data));
            }
        });
    });
}

const userAccountData = {
    users: {
        "1": {
            username: "Renaldi",
            password: "Renaldi123",
            name: "Renaldi",
            role: "Administrator"
        }
    }
};

async function logg(status, message) {
    const merah = "\x1b[31m";
    const putih = "\x1b[0m";
    const biru = "\x1b[34m";
    if (status == true) {
        try {
            console.log(`${biru}[${moment().format("DD/MMMM/YYYY - hh:mm:ss")}] - ${putih}${message}`);
        } catch (err) {
            console.log(`${biru}[${moment().format("DD/MMMM/YYYY - hh:mm:ss")}] - ${putih}${merah}${err}${putih}`);
        }
    } else {
        try {
            console.log(`${biru}[${moment().format("DD/MMMM/YYYY - hh:mm:ss")}] - ${putih}${merah}${message}${putih}`);
        } catch (err) {
            console.log(`${biru}[${moment().format("DD/MMMM/YYYY - hh:mm:ss")}] - ${putih}${merah}${err}${putih}`);
        }
    }
}

module.exports = {
    logg,
    moment,
    Mikrotik,
    readUserFile,
    title,
    author,
    nomorwa,
}