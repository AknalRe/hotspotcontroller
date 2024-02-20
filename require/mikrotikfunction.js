
const { logg, moment, readUserFile, title, author, nomorwa, Mikrotik } = require('./main');
const { KirimPesanWA, kirimNotif } = require('./whatsapp');
const { client } = require('./mikrotik');

async function testINT(input) {
    const isNumber = !isNaN(input);
    if (isNumber && input.length >= 10) {
        return true;
    } else {
        return false;
    }
}

async function checkakun(username) {
    const { mikrotikstatus } = Mikrotik;
    if (mikrotikstatus) {
        try {
            let akunhotspot = await client.write('/ip/hotspot/user/print', [
                '=detail=',
                '?name=' + username,
            ]);
            akunhotspot = akunhotspot[0];
            // console.log(akunhotspot);
            // console.log(!!akunhotspot)
            logg(!!akunhotspot, `Akun (${username}) sudah ada`);
            return { success: !!akunhotspot, message: akunhotspot};
        } catch (err) {
            logg(false, `Akun (${username}) tidak ada`);
            return { success: false, message: err}
        }
    } else {
        logg(false, `Mikrotik Tidak Terhubung`);
        return { success: false, message: "Mikrotik Tidak Terhubung"}
    }
}

async function getUcapan() {
    const currentTime = new Date().getHours();
    if(currentTime >= 5 && currentTime < 11) {
        return "Selamat Pagi"
    } else if (currentTime >= 11 && currentTime < 15) {
        return "Selamat Siang"
    } else if (currentTime >= 15 && currentTime < 17) {
        return "Selamat Sore"
    } else {
        return "Selamat Malam"
    }
}

async function addakun(username, jenisakun, password) {
    const { mikrotikstatus } = Mikrotik;
    if (mikrotikstatus) {
        try {
            const commands = [
                `=name=${username}`,
                `=password=${password ? password : username}`,
                `=profile=${jenisakun}`,
                '=disabled=false',
            ];

            let isAkunHotspotAvailable = await checkakun(username);

            const isnumber = await testINT(username);

            if (isAkunHotspotAvailable.success) {
                logg(false, `Username (${username}) hotspot sudah ada!`)
                return { success: false, message: `Username (${username}) hotspot sudah ada!` };
            }

            await client.write('/ip/hotspot/user/add', commands);
            const resultcreateuser = await checkakun(username);
            if (resultcreateuser.success) {
                let response, nomortujuan, ucapan, pesan;
                if (isnumber) {
                    nomortujuan = username;
                    ucapan = await getUcapan();
                    const wifi = jenisakun.toLowerCase().includes("clarice") ? "WiFi Clarice" : jenisakun.toLowerCase().includes("haicantik") ? "WiFi Haicantik" : "WiFi"
                    pesan = `${ucapan}\n\nBerikut kami informasi akun untuk login pada ${wifi} :\n\nUsername : ${username}${password ? `\nPassword : ${password}` : ''}\n\nHarap untuk login sesuai dengan data diatas.\nTerima Kasih`;
                    response = await KirimPesanWA(nomortujuan, pesan);
                }
                logg(resultcreateuser.success, response.success ? `Username (${username}) berhasil di buat dan berhasil kirim notif` : `Username (${username}) berhasil di buat`);
                return { success: true, successwa: response.success, message: `Username (${username}) berhasil di buat`};
            } else {
                logg(resultcreateuser.success, `Username (${username}) gagal di buat`);
                return { success: false, message: `Username (${username}) gagal di buat`};
            }
        } catch (err) {
            logg(false, `Terjadi kesalahan tambah akun hotstpot : ${err.message}`);
            return { success: false, message: `Terjadi kesalahan tambah akun hotstpot : ${err.message}`}
        }
    } else {
        logg(false, `Mikrotik Tidak Terhubung`);
        return { success: false, message: "Mikrotik Tidak Terhubung"}
    }
}

async function editakun(usernamelama, id, username, jenisakun, password) {
    // console.log(usernamelama, id, username, jenisakun, password)
    const { mikrotikstatus } = Mikrotik;
    if (mikrotikstatus) {
        try {
            let newpassword = password ? password : username;
            const isnumber = await testINT(usernamelama);

            await client.write('/ip/hotspot/user/set', [
                "=.id=" + id,
                "=name=" + username,
                "=password=" + newpassword,
                "=profile=" + jenisakun,
            ])

            let isAkunHotspotAvailable = await checkakun(username);
            if (isAkunHotspotAvailable.success) {
                logg(true, `Data (${usernamelama}) berhasil di ubah ke data baru`);
                let response = { success: false }, nomortujuan, ucapan, pesan;
                if (isnumber) {
                    nomortujuan = usernamelama;
                    ucapan = await getUcapan();
                    const wifi = jenisakun.toLowerCase().includes("clarice") ? "WiFi Clarice" : jenisakun.toLowerCase().includes("haicantik") ? "WiFi Haicantik" : "WiFi"
                    pesan = `${ucapan}\n\nBerikut kami informasi data perubahan akun untuk login pada ${wifi} :\n\nUsername : ${username}${password ? `\nPassword : ${password}` : ''}\n\nHarap untuk login sesuai dengan data diatas.\nTerima Kasih`;
                    response = await KirimPesanWA(nomortujuan, pesan);
                }
                return response.success ? { success: true, successwa: false, message: `Data akun (${usernamelama}) berhasil di ubah ke data baru`} : { success: true, successwa: true, message: `Data akun (${usernamelama}) berhasil di ubah ke data baru`};
            } else {
                logg(false, `Data akun (${usernamelama}) gagal di ubah`);
                return { success: false, message: `Data akun (${usernamelama}) gagal di ubah`}
            }
        } catch (err) {
            logg(false, `Terjadi kesalahan edit akun hotspot : ${err.message}`);
            return { success: false, message: `Terjadi kesalahan edit akun hotspot : ${err.message}`}
        }
    } else {
        logg(false, `Mikrotik Tidak Terhubung`);
        return { success: false, message: `Mikrotik Tidak Terhubung`}
    }
}

async function cekbinding(add, mac) {
    const { mikrotikstatus } = Mikrotik;
    try {
        if (mikrotikstatus) {
            const response = await client.write('/ip/hotspot/ip-binding/print', [
                '?address=' + add,
                '?mac-address=' + mac,
            ]);
            if (response.length > 0) {
                logg(true, `Data binding mac (${mac}) ditemukan`);
                return { success: true, id: response[0]['.id'] };
            } else {
                logg(false, `Data binding mac (${mac}) tidak di temukan`);
                return { success: false };
            }
        } else {
            logg(false, `Mikrotik tidak terhubung`);
            return { success: false };
        }
    } catch (err) {
        logg(false, `Terjadi kesalahan cekbinding, error: ${err.message}`);
        return { success: false };
    }
}

module.exports = {
    checkakun,
    addakun,
    editakun,
    cekbinding,
}