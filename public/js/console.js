const showMessage = (msg) => {
    const p = document.createElement('p');
    p.innerText = msg;
    output.append(p);
}

let closed = true;
const osc = new OSC({
    plugin: new OSC.WebsocketClientPlugin({
        host: window.location.hostname,
        port: 8080
    })
});

osc.on('open', () => {
    showMessage('Connected.');
    closed = false
});

osc.on('*', message => {
    showMessage(message.address + JSON.stringify(message.args));
});

osc.on('error', (err) => showMessage(err.message));

osc.on('close', () => {
    showMessage('Connection closed.');
    closed = true;
})

osc.open();

send.addEventListener('click', (e) => {
    if (closed) return alert('No active connection to send messages.');
    let args = cmd.value.split(' ');
    const addr = args.shift();
    args = args.map((arg) => isNaN(+arg) ? arg : +arg);
    osc.send(new OSC.Message(addr, ...args));
});

clear.addEventListener('click', (e) => {
    output.innerHTML = '';
});
