import { request } from './utils.js';
import topWebsitesContent from './top_websites_content.js';
let browser = require('webextension-polyfill');

// import * as nsfwjs from 'nsfwjs';

export default class Controller {

  async getCertificate(url) {
    try {
      // let data = await request({url: `http://localhost:3000/cert?url=${url}`, method: 'GET'});
      let data = await request({url:
        `https://guardlens.profiling-transparency.ischool.illinois.edu/cert?url=${url}`, method: 'GET'});

      return Promise.resolve(JSON.parse(data));
    } catch (error) {
      return Promise.reject(new Error(error));
    }
  }

  async getClickbait(links) {
    try {
      let data = await request({url: 'https://webtasks.natabarbosa.com/predict_clickbait',
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(links)
      });

      return Promise.resolve(JSON.parse(data));
    } catch (error) {
      return Promise.reject(new Error(error));
    }
  }

  async getImageAnalyses(images) {
    try {
      let data = await request({
        // url: 'http://localhost:3000/screenshot',
        url: 'https://guardlens.profiling-transparency.ischool.illinois.edu/screenshot',
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({'images': images})
      });

      return Promise.resolve(JSON.parse(data));
    } catch (error) {
      return Promise.reject(new Error(error));
    }
  }

  async getInterest() {
    let keywords = document.querySelector("meta[name='keywords']");
    let description = document.querySelector("meta[name='description']");

    if (keywords == null) {
      keywords = document.querySelector("meta[name='Keywords']");
    }

    if (description == null) {
      description = document.querySelector("meta[name='Description']");
    }

    if (keywords != null) {
      keywords = keywords.content;
    } else {
      keywords = '';
    }

    if (description != null) {
      description = description.content;
    } else {
      description = '';
    }

    let pageContent = [...document.querySelectorAll('a, h1, h2, h3, h4, h5, h6, p')].map(x => x.innerText)
                    .join(' ').replace(/\n/g, ' ');
    // let imageAlts = Array.from(document.querySelectorAll('img:not([alt=""])')).map(x => x.getAttribute('alt'));
    // let tfidfDocs = pageText.concat(imageAlts);
    let doc = `${description} ${keywords} ${pageContent}`;

    // console.log(JSON.stringify(topWebsitesContent.concat(doc)));

    try {
      let tfidfTerms = await request({url: 'https://guardlens.profiling-transparency.ischool.illinois.edu/tfidf',
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 'docs': topWebsitesContent.concat(doc) })
      });

      tfidfTerms = JSON.parse(tfidfTerms)[topWebsitesContent.length];
      // console.log(`${document.title} ${description} ${keywords} ${tfidfTerms}`);

      let content = `${document.title} ${tfidfTerms.join(' ')}`;

      try {
        let data = await request({url:
          'https://guardlens.profiling-transparency.ischool.illinois.edu/interest?withPath=1',
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ 'content': content })
        });

        return Promise.resolve(JSON.parse(data)['interest']);
      } catch (error) {
        return Promise.reject(new Error(error));
      }
      // browser.runtime.onMessage.addListener(
      //   function (request, sender) {
      //     if (request.backgroundScriptQuery === 'inferenceComplete') {
      //     }
      //   });

      // browser.runtime.sendMessage({contentScriptQuery: 'getUSEEmbeddings', obj: sentences});
    } catch (error) {
      return Promise.reject(new Error(error));
    }
    // browser.runtime.sendMessage({contentScriptQuery: 'getUSEModel'}).then(model => {
    // use.load().then(model => {
      // console.log(extractTextFromNode(document.body));
  }

  async isAd(image) {
    try {
      let data = await request({url:
        'https://ad-detect.profiling-transparency.ischool.illinois.edu/is_ad',
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 'image': image, 'skip_logos': true })
      });

      return Promise.resolve(JSON.parse(data));
    } catch (error) {
      return Promise.reject(new Error(error));
    }
  }

  async addDomainToIgnoreList() {
    browser.runtime.sendMessage({contentScriptQuery: 'addToIgnoreList'}).then(() => {
      return Promise.resolve(true);
    });
  }

  async saveSettings(settings) {
    browser.runtime.sendMessage({contentScriptQuery: 'saveSettings', obj: settings}).then(() => {
      return Promise.resolve(true);
    });
  }
}
