const channels = {};
const channelElements = [];
const channelsContainer = document.getElementById('channels');
let activeChannel = null;
let lastSelected = null;

const channelPattern = /patch\/([0-9]*)\//i;
const osc = new OSC({
    plugin: new OSC.WebsocketClientPlugin({
        host: window.location.hostname,
        port: 8080
    })
});

osc.on('open', () => {
    osc.send(new OSC.Message('/eos/subscribe', 1));
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
    updateChannel(channel, message.args[7]);
});

osc.on('/eos/out/active/chan', message => {
    activeChannel = +message.args[0].split(' ')[0];
});

osc.on('/eos/out/active/wheel/1', message => {
    if(activeChannel === null) return;
    updateChannel(activeChannel, message.args[2]);
});

osc.on('error', (err) => console.error(err));

osc.open();

const channelInput = document.getElementById('channel-input');
channelInput.addEventListener('change', () => {
    if (lastSelected !== null)
        channelElements[lastSelected].classList.remove('active');

    for (let i = 0; i < channelElements.length; i++) {
        if (channelInput.value !== +channelElements[i].getAttribute('data-chan'))
            continue;

        channelElements[i].classList.add('active');
        lastSelected = i;
        return;
    }
});

const channelValInput = document.getElementById('channel-val-input');
channelValInput.addEventListener('change', () => {
    if (channelValInput.value < 0) channelValInput.value = 0;
    else if (channelValInput.value > 100) channelValInput.value = 100;
});

document.getElementById('send').addEventListener('click', () => {
    if (!channelInput.value || channels[channelInput.value] === undefined)
        return alert(`No known channel '${channelInput.value}'`);
    if (channelValInput.value < 0 || channelValInput > 100)
        return alert('Channel value must be between 0 and 100, inclusive.');
    updateChannel(+channelInput.value, +channelValInput.value);
    osc.send(new OSC.Message(`/eos/chan/${channelInput.value}/at`, +channelValInput.value));
});

const insertChannel = (chan, chanVal) => {
    const name = document.createElement('p');
    name.innerText = chan;
    const val = document.createElement('p');
    val.innerText = chanVal;
    const el = document.createElement('div');
    el.setAttribute('data-chan', chan);
    el.addEventListener('click', () => {
        channelInput.value = chan;
        channelInput.dispatchEvent(new Event('change'));
    });
    el.append(name, val);

    if (!channelElements.length) {
        channelElements.unshift(el)
        channelsContainer.prepend(el);
        return;
    }

    for (let i = 0; i < channelElements.length; i++) {
        if (chan > +channelElements[i].getAttribute('data-chan'))
            continue;

        channelElements[i].before(el);
        channelElements.splice(i, 0, el);
        return;
    }

    channelElements.push(el)
    channelsContainer.append(el);
};

const updateChannel = (chan, val) => {
    if (chan in channels) {
        for (let i = 0; i < channelElements.length; i++) {
            if (chan !== +channelElements[i].getAttribute('data-chan'))
                continue;
    
            channelElements[i].children[1].innerText = val;
            return;
        }
    } else {
        insertChannel(chan, val);
    }
    channels[chan] = val;
};
