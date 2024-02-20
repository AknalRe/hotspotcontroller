const { io } = require('./server');
const { client } = require('./mikrotik');
const { logg, timeout1, timeout2 } = require('./main');

async function fetchDataMikrotik1() {
  try {
    const identity = await client.write('/system/identity/print');
    const resource = await client.write('/system/resource/print');
    const interface = await client.write('/interface/print');
    let useraktif = await client.write('/ip/hotspot/active/print');
    useraktif = useraktif.length > 1 ? useraktif : useraktif[0];
    let user = await client.write('/ip/hotspot/user/print');
    user = user.length > 1 ? user : user[0];
    let queue = await client.write('/queue/simple/print');
    queue = queue.length > 1 ? queue : queue[0];
    let host = await client.write('/ip/hotspot/host/print');
    host = host.length > 1 ? host : host[0];
    let binding = await client.write('/ip/hotspot/ip-binding/print');
    binding = binding.length > 1 ? binding : binding[0];
    let loghotspot = await client.write('/log/print');
    io.sockets.emit('identity', identity[0]);
    io.sockets.emit('resource', resource[0]);
    io.sockets.emit('interface', interface);
    io.sockets.emit('useraktif', useraktif);
    io.sockets.emit('userhotspot', user);
    io.sockets.emit('queue', queue);
    io.sockets.emit('host', host);
    io.sockets.emit('binding', binding);
    io.sockets.emit('loghotspot', loghotspot);
  } catch (err) {
      console.error('Kesalahan:', err);
  }
};

async function fetchDataMikrotik2() {
  try {
    const monitortraffic = await client.write('/interface/monitor-traffic', [
        '=interface=ether1',
        '=duration=1',
      ]);
    io.sockets.emit('monitortraffic', monitortraffic[0]);
  } catch (err) {
      console.error('Kesalahan:', err);
  }
};

let interval1;
let interval2;

async function startsocket(status) {
    try {
        if (status) {
            logg(true, `Memulai socketio dengan interval`);
            // const response = await client.write('/interface/print')
            interval1 = setInterval(fetchDataMikrotik1, timeout1 * 1000);
            interval2 = setInterval(fetchDataMikrotik2, timeout2 * 1000);
        } else {
            logg(true, `Menghentikan socketio`);
            clearInterval(interval1);
            clearInterval(interval2);
        }
    } catch (err) {
        logg(false, `Gagal memulai atau menghentikan socketio, kesalahan : ${err.message}`);
    }
}

module.exports = {
    startsocket,
}