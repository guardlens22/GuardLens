import { getTopDomain } from './utils.js';

export default class Storage {
  constructor(intents) {
    this._iframe = document.createElement('iframe');
    this._iframe.src = getTopDomain();
    this._iframe.style.display = 'none';
    document.body.appendChild(this._iframe);

    this._iframeWindow = this._iframe.contentWindow;

    let script = document.createElement('script');

    script.text = `
            document.domain = '${getTopDomain()}';
            window.onmessage = function (e) {
              console.log('from inside iframe:')
              console.log(e.data);
              let msg = JSON.parse(e.data);

              switch (msg.method) {
                case 'set':
                  localStorage.setItem(msg.key, JSON.stringify(msg.value));
                  break;
                case 'get':
                  var parent = window.parent;
                  parent.postMessage(localStorage.getItem(msg.key), '*');
                  break;
                case 'remove':
                  localStorage.removeItem(msg.key);
                  break;
              }
            }`;
    this._iframeWindow.document.body.appendChild(script);
  }

  set(key, value) {
    this._iframeWindow.postMessage(JSON.stringify({ method: 'set', key: key, value: value}), '*');
  }

  get(key, cb) {
    window.onmessage = (e) => {
      if (e.origin !== window.location.protocol + '//' + getTopDomain()) {
        return;
      }
      console.log('from outside:');
      console.log(e);
      cb(JSON.parse(e.data));
    };
    this._iframeWindow.postMessage(JSON.stringify({ method: 'get', key: key }), '*');
  }

  remove(key) {
    this._iframeWindow.postMessage(JSON.stringify({ method: 'remove', key: key }), '*');
  }
}
