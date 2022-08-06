import { getTopDomain } from './utils.js';
const storageKey = 'guardLensStorage';

export default class Storage {
  constructor(intents) {
    let store = JSON.parse(localStorage.getItem(storageKey));

    if (store === null) {
      store = {};
      store[getTopDomain()] = {};
    }

    this._store = store;

  }

  set(key, value) {
    this._store[getTopDomain()][key] = value;
    this._save();
  }

  _save() {
    localStorage.setItem(storageKey, JSON.stringify(this._store));
  }

  get(key, cb) {
    cb(this._store[getTopDomain()][key] || null);
  }

  remove(key) {
    delete this._store[getTopDomain()][key];
    this._save();
  }
}
