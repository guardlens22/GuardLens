let browser = require('webextension-polyfill');

function getTopDomain() {
  var i, h,
    weirdCookie = 'weird_get_top_level_domain=cookie',
    hostname = document.location.hostname.split('.');

  for (i = hostname.length - 1; i >= 0; i--) {
    h = hostname.slice(i).join('.');
    document.cookie = weirdCookie + ';domain=.' + h + ';';
    if (document.cookie.indexOf(weirdCookie) > -1) {
      document.cookie = weirdCookie.split('=')[0] + '=;domain=.' + h + ';expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      return h;
    }
  }
  return null;
}

function isElemVisible(el) {
  return el.offsetWidth > 0 && el.offsetHeight > 0;
}

async function getScreenshot() {
  const vw = Math.max(document.documentElement.clientWidth || 0, window.clientWidth || 0);
  const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
  let screenshot = await browser.runtime.sendMessage({
    contentScriptQuery: 'getScreenshot',
    obj: {
      'ratio': window.devicePixelRatio || 1,
      'viewportSize': {'width': vw, 'height': vh }
    }
  });

  return Promise.resolve(screenshot);
}

async function getScreenshotImages(screenshot) {
  return browser.runtime.sendMessage({contentScriptQuery: 'getVisibleImages', 'obj': { 'image': screenshot } });
}

async function getPageAreaImage(image, rect) {
  let areaImg = await browser.runtime.sendMessage({ contentScriptQuery: 'getPageAreaImage',
    obj: {'image': image, 'rect': rect } });

  return Promise.resolve(areaImg);
}

function getRandomSubarray(arr, size) {
  var shuffled = arr.slice(0), i = arr.length, temp, index;

  while (i--) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }
  return shuffled.slice(0, size);
}

let request = obj => {
  return new Promise((resolve, reject) => {
    // WebExtensions API
    browser.runtime.sendMessage({contentScriptQuery: 'makeRequest', obj: obj}).then(response => {
      if (response.complete) {
        resolve(response.data);
      } else {
        reject(response.error);
      }
    });

    // Native
    // let xhr = new XMLHttpRequest();

    // xhr.open(obj.method || 'GET', obj.url);
    // if (obj.headers) {
    //   Object.keys(obj.headers).forEach(key => {
    //     xhr.setRequestHeader(key, obj.headers[key]);
    //   });
    // }

    // xhr.setRequestHeader('Cache-Control', 'no-cache');

    // xhr.onload = () => {
    //   if (xhr.status >= 200 && xhr.status < 300) {
    //     resolve(xhr.response);
    //   } else {
    //     reject(xhr.statusText);
    //   }
    // };
    // xhr.onerror = () => reject(xhr.statusText);
    // xhr.send(obj.body);

    // TamperMonkey
    // if (!obj.headers) {
    //   obj.headers = {};
    // }

    // obj.headers['Cache-Control'] = 'no-cache';

    // GM_xmlhttpRequest({
    //   method: obj.method || 'GET',
    //   url: obj.url,
    //   data: obj.body,
    //   headers: obj.headers,
    //   onload: function (response) {
    //     resolve(response.responseText);
    //   },
    //   onerror: function (error) {
    //     reject(error);
    //   }
    // });
  });
};

export {getTopDomain, request, isElemVisible, getScreenshot, getScreenshotImages, getPageAreaImage, getRandomSubarray};
