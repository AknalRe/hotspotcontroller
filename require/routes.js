const { logg, moment, readUserFile, title, author, nomorwa, Mikrotik } = require('./main');
const { KirimPesanWA, kirimNotif, notif } = require('./whatsapp');
const { router, isAuthenticated } = require('./server');
const { addakun } = require('./mikrotikfunction');
const { client } = require('./mikrotik');

// GET Route

router.get('/', isAuthenticated, async (req, res) => {
    const { mikrotikstatus } = Mikrotik;
    const { username, role, name } = req.session;
    req.session.prevpage = req.path;
    res.render("index", { author, title, username, role, mikrotikstatus, nomorwa, name, page: "Home", halaman: "halamanindex", message: "" })
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
            logg(true, `${ip} - Berhasil login username : ${username}`)
            res.json({ success: true, message: 'Login berhasil!' });
        } else {
            logg(false, `${ip} - Gagal login username : ${username}`)
            res.json({ success: false, message: 'Login gagal. Periksa username dan password.' });
        }
    } catch (error) {
        console.error(error);
        logg(false, `Terjadi kesalahan pada server. : ${error} - IP : ${ip}`)
        res.json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
});

router.post("/logout", isAuthenticated, async (req, res) => {
    const ip = req ? req.ip : 'unknown';
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
            await notif(req.hostname, req.session.username, req.session.role, `Berhasil menghapus user ${nama}`)
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

router.use((req, res) => {
  const prevpage = req.session.prevpage || '/';
  res.status(200).render("index", { author, title, page: `404`, halaman: "halaman404", prevpage });
});

module.exports = {
    router,
};