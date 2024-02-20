const { logg, moment, readUserFile, title, author, nomorwa, Mikrotik } = require('./main');
const { KirimPesanWA, kirimNotif, notif } = require('./whatsapp');
const { router, isAuthenticated } = require('./server');
const { addakun, editakun, cekbinding } = require('./mikrotikfunction');
const { client } = require('./mikrotik');
const fs = require('fs');
const path = require('path');
const qr = require('qrcode');

// GET Route

router.get('/', isAuthenticated, async (req, res) => {
    const { mikrotikstatus } = Mikrotik;
    const { username, role, name } = req.session;
    req.session.prevpage = req.path;
    res.render("index", { author, title, username, role, mikrotikstatus, nomorwa, name, page: "Home", halaman: "halamanindex", message: "" })
});

router.get('/editakunhotspot/:id', isAuthenticated, async (req, res) => {
    const { mikrotikstatus } = Mikrotik;
    const { username, role, name } = req.session;
    const { id } = req.params;

    try {
        if (mikrotikstatus) {
            const response = await client.write('/ip/hotspot/user/print', [
                '?.id=' + id,
            ]);

            // console.log(response);

            const responseData = response.length > 1 ? response : response[0];

            // console.log(responseData);
            
            res.render("index", { author, title, halaman: "halamaneditakunhotspot", page: `Edit (${responseData.name})`, message: "", username, role, mikrotikstatus, nomorwa, name, success: true, response: responseData});
        } else {
            res.render("index", { author, title, halaman: "halamaneditakunhotspot", page: "", message: "", username, role, mikrotikstatus, nomorwa, name, success: false, response: `Mikrotik Tidak Terkoneksi` });
        }
    } catch (err) {
        res.render("index", { author, title, halaman: "halamaneditakunhotspot", page: "", message: "", username, role, mikrotikstatus, nomorwa, name, success: false, error: err.message });
    }
});

router.get('/editqueue/:id', isAuthenticated, async (req, res) => {
    const { mikrotikstatus } = Mikrotik;
    const { username, role, name } = req.session;
    const { id } = req.params;

    try {
        if (mikrotikstatus) {
            const response = await client.write('/queue/simple/print', [
                '?.id=' + id,
            ]);

            const responseData = response.length > 1 ? response : response[0];
            
            res.render("index", { author, title, halaman: "halamaneditqueuehotspot", page: `Edit Queue (${responseData.name})`, message: "", username, role, mikrotikstatus, nomorwa, name, success: true, response: responseData});
        } else {
            res.render("index", { author, title, halaman: "halamaneditqueuehotspot", page: `Edit Queue`, message: "", username, role, mikrotikstatus, nomorwa, name, success: true, response: `Mikrotik Tidak Terkoneksi` });
        }
    } catch (err) {
        res.render("index", { author, title, halaman: "halamaneditqueuehotspot", page: `Edit Queue`, message: "", username, role, mikrotikstatus, nomorwa, name, success: true, error: err.message });
    }
})

router.get('/generateqr', isAuthenticated, async (req, res) => {
    const { mikrotikstatus } = Mikrotik;
    const { username, role, name } = req.session;
    res.render('index', { author, title, halaman: "halamangenerateqr", page: `Generate QRcode`, message: "", username, role, mikrotikstatus})
});

// POST Route

router.post('/test', async (req, res) => {
    res.send({ success:true, message: "Hello World!" });
})

router.post('/login', async (req, res) => {
    const ip = req.headers['x-forwarded-for']
    ? `${req.headers['x-forwarded-for']}`
    : `${req.ip == "::1" ? "127.0.0.1" : req.ip.replace("::ffff:", "") }`
    try {
        const { username, password } = req.body;

        const userData = await readUserFile();

        const user = Object.values(userData.users).find(
            (user) => user.username === username && user.password === password
        );

        if (user) {
            // Pastikan req.session sudah ada sebelum mengatur propertinya
            req.session = req.session || {};

            // Atur properti user pada req.session
            req.session.username = username;
            req.session.role = user.role;
            req.session.name = user.name;
            // console.log(req.session);
            logg(true, `${ip} - Berhasil login username : ${username}`);
            await notif(req.hostname, req.session.username, req.session.role, `${ip} - Berhasil login username : ${username}`);
            res.json({ success: true, message: 'Login berhasil!' });
        } else {
            logg(false, `${ip} - Gagal login username : ${username}`);
            res.json({ success: false, message: 'Login gagal. Periksa username dan password!' });
        }
    } catch (error) {
        console.error(error);
        logg(false, `${ip} - Terjadi kesalahan pada server, error : ${error.message}`)
        res.json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
});

router.post("/logout", isAuthenticated, async (req, res) => {
    const ip = req.headers['x-forwarded-for']
    ? `${req.headers['x-forwarded-for']}`
    : `${req.ip == "::1" ? "127.0.0.1" : req.ip.replace("::ffff:", "") }`
    const username = req.session.username;
    try {
        req.session.destroy();
        logg(true, `(${username}) Berhasil Logout`)
        res.json({ success: true, message: `(${username}) Berhasil Logout`})
    } catch(err) {
        logg(false, `(${username}) Gagal Logout : ${err}`)
        res.json({ success: false, message: `(${username}) Gagal Logout`})
    }
})

router.post('/infoprofilhotspot', isAuthenticated, async (req, res) => {
    const { mikrotikstatus } = Mikrotik;
    const { username, role, name } = req.session;
    try {
        if (mikrotikstatus) {
            const response = await client.write('/ip/hotspot/user/profile/print');
            const filteredData = response.filter(item => {
                if (role === "Administrator") {
                    return item.name !== "default";
                } else {
                    return item.name == "Tamu";
                }
            });
            res.json({ success: true, response: filteredData});
        } else {
            res.json({ success: false, response: `Mikrotik tidak terhubung`})
        }
    } catch (err) {
        res.json({ success: false, response: err})
    }
});

router.post('/tambahakunhotspot', isAuthenticated, async (req, res) => {
    const { username, password, jenisAkun } = req.body;
    const response = password ? await addakun(username, jenisAkun, password) : await addakun(username, jenisAkun);
    if (response.success) {
        const notifres = await notif(req.hostname, req.session.username, req.session.role, `Menambahkan akun ${username}-${jenisAkun}`)
        logg(notif.success, notifres.success ? `Berhasil mengirimkan notif informasi tambahakun` : `Gagal mengirimkan notif informasi tambahakun`)
    }
    res.json(response);
})

router.post("/hotspotuserlist", isAuthenticated, async (req, res) => {
    const { mikrotikstatus } = Mikrotik;
    const role = req.session.role;
    try {
        if (mikrotikstatus) {
            const response = await client.write("/ip/hotspot/user/print");
            
            const filteredData = response.filter(item => {
                if (role === "Administrator") {
                    return item[".id"] !== "*0" && item[".id"] !== "*2";
                } else {
                    return item.profile && item.profile.includes("Tamu") && item[".id"] !== "*0" && item[".id"] !== "*2";
                }
            });
            res.json(filteredData);
        } else {
            res.json({ success: false, message: `Mikrotik tidak terhubung`})
        }
    } catch (err) {
        res.json({success: false, message: err})
    }
});

router.post('/nonaktifkanakunhotspot', isAuthenticated, async (req, res) => {
    const { mikrotikstatus } = Mikrotik;
    const { id, status, nama } = req.body;
    let message;
    if (status == "true") {
        message = "menonaktifkan";
    } else {
        message = "mengaktifkan";
    }
    if (mikrotikstatus == true) {
        try {
            await client.write("/ip/hotspot/user/set", [
                "=.id=" + id,
                "=disabled=" + status,
            ])
            await notif(req.hostname, req.session.username, req.session.role, `Berhasil ${message} akun ${nama}`)
            logg(true, `(${req.session.username}) Berhasil ${message} user (${nama})`);
            res.json({success: true, message: `Berhasil ${message} user (${nama})`});
        } catch (err) {
            logg(false, `(${req.session.username}) Gagal ${message} user (${nama})`);
            res.json({success: false, message: `Gagal ${message} user (${nama})`})
        }
    } else {
        res.json({success: false, message: "Mikrotik Tidak Terkoneksi"});
    }
})

router.post('/deleteakunhotspot', isAuthenticated, async (req, res) => {
    const { mikrotikstatus } = Mikrotik;
    const { id, nama } = req.body;
    if (mikrotikstatus == true) {
        try {
            await client.write("/ip/hotspot/user/remove", [
                "=.id=" + id,
            ]);
            await notif(req.hostname, req.session.username, req.session.role, `Berhasil menghapus user ${nama}`);
            logg(true, `(${req.session.username}) Berhasil menghapus user (${nama})`);
            res.json({success: true, message: `Berhasil menghapus user (${nama})`});
        } catch (err) {
            logg(false, `(${req.session.username}) Gagal menghapus user (${nama})`);
            res.json({success: false, message: `Gagal menghapus user (${nama})`, response: err});
        };
    } else {
        res.json({success: false, message: "Mikrotik Tidak Terkoneksi"});
    }
})

router.post('/editakunhotspot', isAuthenticated, async (req, res) => {
    const { mikrotikstatus } = Mikrotik;
    const { usernamelama, id, username, password, jenisAkun } = req.body;
    // console.log(usernamelama, id, username, password, jenisAkun)
    const ip = req.headers['x-forwarded-for']
    ? `${req.headers['x-forwarded-for']}`
    : `${req.ip == "::1" ? "127.0.0.1" : req.ip.replace("::ffff:", "") }`;
    const response = await editakun(usernamelama, id, username, jenisAkun, password);
    console.log(response)
    if (response.success) {
        await notif(req.hostname, req.session.username, req.session.role, `Berhasil mengubah data akun ${usernamelama} menjadi ${username}-${jenisAkun}`);
        res.json(response);
    } else {
        res.json(response);
    }
})

router.post('/logoutkansemua', isAuthenticated, async (req, res) => {
    const { mikrotikstatus } = Mikrotik;
    try {
        if (mikrotikstatus) {
            let aktifuser;

            aktifuser = await client.write('/ip/hotspot/active/print');

            let count = 0;
            await Promise.all(aktifuser.map(async user => {
                // console.log(`${count}. ${user['.id']}`);
                await client.write('/ip/hotspot/active/remove', [
                        '=.id=' + user['.id'],
                    ]);
                count++;
            }));
            logg(true, `Berhasil melogout (${count}) user`);
            await notif(req.hostname, req.session.username, req.session.role, `Berhasil melogout (${count}) user`);
            res.json({ success: true, message: `Berhasil melogout (${count}) user`});
        } else {
            logg(false, `Mikrotik tidak terhubung`)
            res.json({ success: false, message: `Mikrotik tidak terhubung`});
        }
    } catch(err) {
        logg(false, `Error melogout semua user, error: ${err.message}`)
        res.json({ success: false, message: `Error melogout semua user, error: ${err.message}` });
    }
})

router.post('/logoutakunhotspot', isAuthenticated, async (req, res) => {
    const { mikrotikstatus } = Mikrotik;
    const { id, nama } = req.body;
    try {
        if (mikrotikstatus) {
            let aktifuser;

            aktifuser = await client.write('/ip/hotspot/active/remove', [
                "=.id=" + id,
            ])
            logg(true, `Berhasil melogout (${nama}) user`);
            await notif(req.hostname, req.session.username, req.session.role, `Berhasil melogout (${nama}) user`);
            res.json({ success: true, message: `Berhasil melogout (${nama}) user`});
        } else {
            logg(false, `Mikrotik tidak terhubung`);
            res.json({ success: false, message: `Mikrotik tidak terhubung`});
        }
    } catch(err) {
        logg(false, `Error melogout (${nama}) user, error: ${err.message}`);
        res.json({ success: false, message: `Error melogout (${nama}) user, error: ${err.message}`});
    }
})

router.post('/editqueue', isAuthenticated, async (req, res) => {
    const { mikrotikstatus } = Mikrotik;
    const { nama, id, prio, maxlimit } = req.body;

    try {
        if (mikrotikstatus) {
            await client.write('/queue/simple/set', [
                "=.id=" + id,
                "=priority=" + prio,
                "=max-limit=" + maxlimit,
            ])
            logg(true, `Berhasil mengubah queue (${nama} : ${id})`)
            res.json({ success: true, message: `Berhasil mengubah queue (${nama} : ${id})` });
        } else {
            logg(false, `Mikrotik tidak terhubung` )
            res.json({ success: false, message: `Mikrotik tidak terhubung` });
        }
    } catch (err) {
        logg(false, `Error mengedit queue ${nama}, error: ${err.message}`);
        res.json({ success: false, message: `Error mengedit queue ${nama}, error: ${err.message}` });
    }
});

router.post('/binding', isAuthenticated, async (req, res) => {
    const { mikrotikstatus } = Mikrotik;
    const { username, role, name } = req.session;
    const { action, id, add, toadd, mac, server } = req.body;
    try {
        if (mikrotikstatus) {
            const response = await cekbinding(add, mac);
            if (!response.success) {
                await client.write('/ip/hotspot/ip-binding/add', [
                    "=comment=" + `${moment().format("DD/MMMM/YYYY - hh:mm:ss")} - ${name}/${role}`,
                    "=address=" + add,
                    "=to-address=" + toadd,
                    '=mac-address=' + mac,
                    '=server=' + server,
                    '=type=bypassed',
                    '=disabled=false',
                ]);
                logg(true, `Berhasil binding akun ${add}-${mac}`);
                await notif(req.hostname, req.session.username, req.session.role, `Berhasil binding akun ${add}-${mac}`);
                res.json({ success: true, message: `Berhasil binding akun ${add}-${mac}`});
            } else {
                if (action) {
                    await client.write('/ip/hotspot/ip-binding/set', [
                        '=.id=' + response.id,
                        "=disabled=true",
                    ])
                    logg(true, `Berhasil nonaktifkan binding akun ${add}-${mac}`);
                    await notif(req.hostname, req.session.username, req.session.role, `Berhasil nonaktifkan binding akun ${add}-${mac}`);
                    res.json({ success: true, message: `Berhasil nonaktifkan binding akun ${add}-${mac}`});
                } else {
                    await client.write('/ip/hotspot/ip-binding/set', [
                        '=.id=' + response.id,
                        "=disabled=false",
                    ])
                    logg(true, `Berhasil mengaktifkan binding akun ${add}-${mac}`);
                    await notif(req.hostname, req.session.username, req.session.role, `Berhasil mengaktifkan binding akun ${add}-${mac}`);
                    res.json({ success: true, message: `Berhasil mengaktifkan binding akun ${add}-${mac}`});
                }
            }
        } else {
            logg(false, `Mikrotik tidak terhubung`)
            res.json({ success: false, message: `Mikrotik tidak terhubung`});
        }
    } catch (err) {
        logg(false, `Terjadi kesalahan saat mencoba binding akun, error: ${err.message}`);
        res.json({ success: false, message: `Error binding akun ${add}-${mac}`, response: err});
    }
});

// router.post('/generateQRCode', isAuthenticated, async(req, res) => {
//     const { ssid, password } = req.body;
//     const wifiUri = `WIFI:T:WPA;S:${ssid};P:${password};;`;
//     qr.toDataURL(wifiUri, function (err, url) {
//         if (err) {
//             console.error('Error:', err);
//             return res.status(500).json({ error: 'Internal Server Error' });
//         }
//         res.json({ url });
//     });
// });

router.post('/generateQRCode', isAuthenticated, async(req, res) => {
    const { ssid, password } = req.body;
    let wifiUri;
    if (password) {
        wifiUri = `WIFI:T:WPA;S:${ssid};P:${password};;`;
    } else {
        wifiUri = `WIFI:T:NONE;S:${ssid};;`;
    }
    const nama = `${ssid}_QRCode`;
    const path = `./views/images/${nama}.png`;
    try {
        qr.toFile(
            path,
            wifiUri,
            { errorCorrectionLevel: 'H', scale: 8 }, // Mengatur resolusi dengan opsi scale
            function (err) {
                if (err) throw err;
                logg(true, `QR Code berhasil disimpan sebagai ${ssid}_QRCode.png`);
            }
        );
        logg(true, `Berhasil generate QR WiFi (${ssid})`);
        res.json({ success: true, message: `Berhasil generate QR WiFi (${ssid})`, url: `${nama}`});
    } catch (err) {
        logg(false, `Gagal generate QR WiFi (${ssid}), error: ${err.message}`);
        res.json({ success: false, message: `Gagal generate QR WiFi (${ssid}), error: ${err.message}`, url: `${nama}`});
    }
});

router.post('/deleteQRCode', isAuthenticated, async (req, res) => {
    const { fileName } = req.body;
    // console.log(fileName);
    const imagePath = path.join(__dirname, '..', 'views', 'images', `${fileName}.png`);

    try {
        // Periksa apakah file ada sebelum menghapusnya
        if (fs.existsSync(imagePath)) {
            // Hapus file
            fs.unlinkSync(imagePath);
            logg(true, `Gambar QR Code ${fileName} berhasil dihapus`);
            res.json({ success: true, message: `Gambar QR Code ${fileName} berhasil dihapus` });
        } else {
            logg(false, `Gambar QR Code ${fileName} tidak ditemukan`)
            res.json({ success: false, message: `Gambar QR Code ${fileName} tidak ditemukan` });
        }
    } catch (err) {
        logg(false, `Gagal menghapus gambar QR Code ${fileName}, error: ${err.message}`)
        res.json({ success: false, message: `Gagal menghapus gambar QR Code ${fileName}` });
    }
});

router.use((req, res) => {
  const prevpage = req.session.prevpage || '/';
  res.status(200).render("index", { author, title, page: `404`, halaman: "halaman404", prevpage });
});

module.exports = {
    router,
};