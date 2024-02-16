function showNotification(success, message) {
    let notif = document.getElementById('notifAll');
    notif.innerText = message;
    if (success) {
        notif.classList.add('success');
    } else {
        notif.classList.add('error');
    }

    setTimeout(function() {
        notif.classList.add('show');
    }, 100);
}

document.addEventListener('DOMContentLoaded', function() {

    // showNotification(true, 'Ini adalah notifikasi');
    // showNotification(false, 'Ini adalah notifikasi');
    // test()
});