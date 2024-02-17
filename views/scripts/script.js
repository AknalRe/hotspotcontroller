// function showNotification(success, message) {
//     let notif = document.getElementById('notifAll');
//     notif.innerText = message;
//     notif.classList.remove('show');
//     if (success) {
//         notif.classList.add('success');
//     } else {
//         notif.classList.add('error');
//     }

//     setTimeout(function() {
//         notif.classList.add('show');
//     }, 100);
// }
function showNotification(success, message) {
    let notif = document.getElementById('notifAll');
    notif.innerText = message;
    if (success) {
        notif.classList.add('success');
    } else {
        notif.classList.add('error');
    }
    notif.classList.add('show');

    setTimeout(function() {
        notif.classList.remove('show');
    }, 5000);
}

document.addEventListener('DOMContentLoaded', function() {

    // showNotification(true, 'Ini adalah notifikasi');
    // showNotification(false, 'Ini adalah notifikasi');
    // test()
});