const { logg, Mikrotik, readUserFile } = require('./require/main');
const { connect } = require('./require/mikrotik');
const { start, app } = require('./require/server');
const { router } = require('./require/routes');
const { startsocket } = require('./require/socket');

start().then((result) => {
    // console.log(result);
  }).catch((error) => {
    console.error('Terjadi kesalahan:', error);
  });
connect().then((result) => {
//   console.log(result);
    if (result.success) {
        logg(true, `Mikrotik sudah terhubung, mencoba menjalankan socket`)
        startsocket(true)
    }
}).catch((error) => {
  console.error('Terjadi kesalahan:', error);
});

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