import { request, getTopDomain } from './utils.js';

export default class Logger {
  constructor(userId) {
    this._userId = userId;
  }

  log(data = {}, event) {
    let log = {
      userId: this._userId,
      domain: getTopDomain(),
      event: event,
      data: data
    };

    // request({url: 'http://localhost:3000/log',
    request({url: 'https://guardlens.profiling-transparency.ischool.illinois.edu/log',
      body: JSON.stringify(log),
      method: 'POST',
      headers: {'Content-type': 'application/json;charset=UTF-8',
        'Authorization': 'Basic UZc1x&@QO5Ji@QC!b4ZbAWJ6LsfKo6'}})
    .catch(error => {
      console.log(error);
    });
  }

}
