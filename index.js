const path = require('path');
const os = require('os');
const express = require('express');
const OSC = require('osc-js');

let addr;
for (const interf of Object.values(os.networkInterfaces())) {
    if (interf[0].internal) continue;
    for (const network of interf) {
        if (network.family !== 'IPv4' && network.family !== 4) continue;
        addr = network.address;
        break;
    }
    if (addr) break;
}
if (!addr) {
    console.error('No network address found.');
    process.exit(1);
}

const osc = new OSC({
    plugin: new OSC.BridgePlugin({
        receiver: 'udp',
        udpServer: {
            host: addr,
            port: 4704
        },
        udpClient: {
            host: addr,
            port: 4703
        },
        wsServer: {
            host: 'localhost',
            port: 8080
        }
    })
});

osc.on('open', () => {
    console.log(`OSC server running on ${addr}:4704`)
    osc.send(new OSC.Message('/eos/subscribe', 1));
});

osc.on('error', (e) => console.error(e));

osc.open();

const app = express();

const static = express.static(path.join(__dirname, '/public'));
app.use(static);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'))
});

app.get('/osc.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'node_modules/osc-js/lib/osc.min.js'))
});

app.listen(80, () => console.log('Server online at http://localhost/.'));
