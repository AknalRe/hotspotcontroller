const { logg, Mikrotik } = require('./main');
const { RouterOSAPI } = require('node-routeros');

let mikrotikerror = 0;
let cekstatusinterval;

const host = process.env.HOST;
const user = process.env.USER;
const password = process.env.PASSWD;
const port = process.env.PORTMIKROTIK;
const interval = parseInt(process.env.INTERVAL || 10);

const client = new RouterOSAPI({
    host: host,
    user: user,
    password: password,
    SSL_PORT: port,
    timeout: 30000
});

async function connect(){
    let response;
    try {
        response = await client.connect();
        cekstatusinterval = setInterval(CekStatus, interval * 60 * 1000)
        Mikrotik.mikrotikstatus = true;
        logg(true, `Mikrotik berhasil terhubung`)
        return { success: true, message: `Mikrotik berhasil terhubung`}
    } catch (err){
        Mikrotik.mikrotikstatus = false;
        logg(false, `Mikrotik gagal terhubung`)
        return { success: false, message: `Mikrotik gagal terhubung` }
    }
}

async function CekStatus() {
    let response;
    try {
        response = await status()
        logg(response.success, response.message);
        if (!response.success) {
            mikrotikerror++;
            response = await client.connect();
            if (!response.connected) {
                if (mikrotikerror >= 3) {
                    mikrotikStatusObj.mikrotikStatus = false;
                    clearInterval(cekstatusinterval);
                }
            } else {
                mikrotikerror = 0;
            }
        } else {
            mikrotikerror = 0;
        }
    } catch (err) {
        logg(false, `Terjadi kesalahan saat memeriksa status: ${err}`);
    }
}

async function status(){
    try {
        await client.write("/interface/print");
        return { success: true, message: "Koneksi dengan Mikrotik tetap aktif" };
    } catch (err){
        return { success: false, message: "Koneksi dengan Mikrotik terputus", response: err };
    }
}

module.exports = {
    connect,
    client,
}