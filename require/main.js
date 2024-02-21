require('dotenv').config();

const title = process.env.TITLE;
const author = process.env.AUTHOR;
const nomorwa = process.env.NOMORWA;
const hostname = process.env.HOSTNAME;
const timeout1 = parseInt(process.env.TIMEOUT1);
const timeout2 = parseInt(process.env.TIMEOUT2);
const APPDEBUG = process.env.APP_DEBUG == "true";
const APPENV = process.env.APP_ENV;
const { USERLG, PASSLG, ROLELG, NAMELG } = process.env;
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
require('moment/locale/id');
moment.locale('id');
let fileuser = "./database/useraccount.json";

const databaseFolder = path.dirname(fileuser);

const Mikrotik = {
    mikrotikstatus: false,
    mikrotikidentity: '',
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
            username: USERLG,
            password: PASSLG,
            name: NAMELG,
            role: ROLELG
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

fs.readFile('.env', 'utf8', (err, envData) => {
    if (err) {
        console.error('Gagal membaca file .env:', err);
        return;
    }

    // Ubah isi file .env menjadi array baris
    const envLines = envData.split('\n');
    const jmlhbaris = envLines.length;
    let baris = 0;

    // Hapus nilai pada setiap variabel
    const copyEnvLines = envLines.map(line => {
        baris++;
        if (line.trim() !== "" && line.includes('=')) {
            let command;
            if (line.includes(' # ')) {
                command = " # " + line.split(' # ')[1];
            } else {
                command = "";
            }
            if (baris !== jmlhbaris) {
                const key = line.split('=')[0];
                // const value = line.split('=')[1];
                return `${key}=${command}\n`;
            } else {
                const key = line.split('=')[0];
                return `${key}=${command}`;
            }
        } else {
            return line + '\n';
        }
    });

    // Gabungkan array baris menjadi string
    const copyEnvContent = copyEnvLines.join('');

    // Tulis kembali isi file .copyenv
    fs.writeFile('.copyenv', copyEnvContent, 'utf8', err => {
        if (!APPDEBUG && APPENV !== 'local') {
            if (err) {
                return;
            }
        } else {
            if (err) {
                logg(false, `Gagal menulis file .copyenv: ${err}`);
                return;
            }
            logg(true,'.copyenv berhasil diperbarui.');
        }
    });
});

console.log(APPDEBUG, APPENV);

logg(!APPDEBUG, APPDEBUG ? `Debugging True` : `Debugging False`);
logg(APPENV !== 'local' ? true : false, APPENV !== 'local' ? `APP Dalam mode production` : `APP Dalam mode developer` );

module.exports = {
    logg,
    moment,
    Mikrotik,
    readUserFile,
    title,
    author,
    nomorwa,
    timeout1,
    timeout2,
    APPDEBUG,
    APPENV,
}