const channels = {};
const channelPattern = /patch\/([0-9]*)\//i;
const osc = new OSC({
    plugin: new OSC.WebsocketClientPlugin({
        host: window.location.hostname,
        port: 8080
    })
});

osc.on('open', () => {
    osc.send(new OSC.Message('/eos/get/patch/count'));
});

osc.on('/eos/out/active/cue', message => {
    if (message.args[0] === 1)
        osc.send(new OSC.Message('/eos/get/patch/count'));
});

osc.on('/eos/out/get/patch/count', message => {
    for (let i = 0; i < message.args[0]; i++)
        osc.send(new OSC.Message(`/eos/get/patch/index/${i}`));
});

osc.on('/eos/out/get/patch/*/list/*', message => {
    if (message.args[4].toLowerCase().includes('non_dim')) return;
    const [, channel] = channelPattern.exec(message.address);
    channels[channel] = message.args[7];
});

osc.on('*', message => {
    const p = document.createElement('p');
    p.innerText = message.address + JSON.stringify(message.args);
    output.append(p); 
});

osc.on('error', (err) => console.error(err));

osc.open();

send.addEventListener('click', (e) => {
    osc.send(new OSC.Message(cmd.value));
});

clear.addEventListener('click', (e) => {
    output.innerHTML = '';
});
