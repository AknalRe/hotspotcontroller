const { logg, moment, readUserFile, title, author, nomorwa, Mikrotik } = require('./main')
const { router, isAuthenticated } = require('./server');

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
    const ip = req ? req.ip : 'unknown';
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
            logg(true, `Berhasil login username : ${username} - IP : ${req.ip}`)
            res.json({ success: true, message: 'Login berhasil!' });
        } else {
            logg(false, `Gagal login username : ${username} - IP : ${req.ip}`)
            res.json({ success: false, message: 'Login gagal. Periksa username dan password.' });
        }
    } catch (error) {
        console.error(error);
        logg(false, `Terjadi kesalahan pada server. : ${error} - IP : ${req.ip}`)
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

router.use((req, res) => {
  const prevpage = req.session.prevpage || '/';
  res.status(200).render("index", { author, title, page: `404`, halaman: "halaman404", prevpage });
});

module.exports = {
    router,
};