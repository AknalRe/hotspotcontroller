const { logg, moment, readUserFile, title, author, nomorwa, Mikrotik } = require('./main');
const { KirimPesanWA, kirimNotif } = require('./whatsapp');
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
        const pesan = `Waktu : ${moment().format("DD/MMMM/YYYY - hh:mm:ss")}\nHostname : ${req.hostname}\nUsername : ${req.session.username}\nRole : ${req.session.role}\nMessage : \n\n'Menambahkan akun ${username}-${jenisAkun}'`
        const notif = await kirimNotif(pesan)
        logg(notif.success, notif.success ? `Berhasil mengirimkan notif informasi tambahakun` : `Gagal mengirimkan notif informasi tambahakun`)
    }
    res.json(response);
})

router.use((req, res) => {
  const prevpage = req.session.prevpage || '/';
  res.status(200).render("index", { author, title, page: `404`, halaman: "halaman404", prevpage });
});

module.exports = {
    router,
};