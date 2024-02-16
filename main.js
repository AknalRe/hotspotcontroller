const { logg, Mikrotik, readUserFile } = require('./require/main');
const { connect, client } = require('./require/mikrotik');
const { start, app } = require('./require/server');
const { router } = require('./require/routes');

connect();
start();

app.use('/', router);

// readUserFile()
//     .then(data => {
//         console.log('Data pengguna:', data);
//     })
//     .catch(err => {
//         console.error('Error saat membaca file pengguna:', err);
//         // Lanjutkan eksekusi program setelah menangani kesalahan
//         console.log('Melanjutkan eksekusi program...');
//     });