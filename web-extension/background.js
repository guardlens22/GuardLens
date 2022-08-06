// node module hack
var exports = {};
var cv = null;

// firefox won't load the script locally when extension is signed
let openCVPath = browser.runtime.getURL('opencv3.4.0.js');
if (navigator.userAgent.indexOf('Firefox') >= 0) {
  openCVPath = 'https://docs.opencv.org/3.4.0/opencv.js'; 
}

require([openCVPath], function () {
  cv = Module;
});

async function addDomainToIgnoreList(domain) {
  let activeTab = await browser.tabs.query({active: true, currentWindow: true});

  activeTab = activeTab[0];
  let currentIgnoreList = await browser.storage.sync.get(['ignoreList']);
  let currentDomain = await browser.tabs.sendMessage(activeTab.id, {backgroundScriptQuery: 'getTopDomain'});
  let itemsToAdd = [currentDomain];

  if (typeof(currentIgnoreList.ignoreList) === 'undefined') currentIgnoreList.ignoreList = [];

  if (currentIgnoreList.ignoreList.indexOf(currentDomain) === -1) {
      try {
        await browser.storage.sync.set({'ignoreList': [...currentIgnoreList.ignoreList, ...itemsToAdd]});
        browser.tabs.sendMessage(activeTab.id, {backgroundScriptQuery: 'addedToIgnoreList', obj: currentDomain});
      } catch (err) {
        console.log(`Error adding ${currentDomain} to GuardLens ignore list.`);
      }
  }
}

async function saveSettings(settings) {
  let activeTab = await browser.tabs.query({active: true, currentWindow: true});

  activeTab = activeTab[0];

  try {
    await browser.storage.sync.set({'guardLensSettings': settings});
    browser.tabs.sendMessage(activeTab.id, {backgroundScriptQuery: 'savedSettings'});
  } catch (err) {
    console.log(`Error saving settings: ${settings}.`);
  }

}

browser.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.contentScriptQuery == "makeRequest") {
      return new Promise(function (resolve, reject) {
          let obj = request.obj;
          let xhr = new XMLHttpRequest();

          xhr.open(obj.method || 'GET', obj.url);
          if (obj.headers) {
            Object.keys(obj.headers).forEach(key => {
              xhr.setRequestHeader(key, obj.headers[key]);
            });
          }

          xhr.setRequestHeader('Cache-Control', 'no-cache');

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({complete: true, data: xhr.response});
            } else {
              resolve({complete: false, data: xhr.statusText});
            }
          };
          xhr.onerror = () => resolve({complete: false, data: xhr.statusText});
          xhr.send(obj.body);
      });
    } else if (request.contentScriptQuery == "uninstallExtension") {
      browser.management.uninstallSelf();
    } else if (request.contentScriptQuery == 'getScreenshot') {
      return new Promise(function (resolve, reject) {
         browser.tabs.query({active: true}).then(tab => {
          browser.tabs.captureVisibleTab({format: 'jpeg', quality: 70}).then(image => {
            const ratio = request.obj.ratio;
            const viewportSize = request.obj.viewportSize;

            if (ratio > 1) {
              var screenshotImg = new Image();

              screenshotImg.onload = function() {
                // web extensions will not return high density image, so check viewport size
                if (screenshotImg.naturalWidth > viewportSize.width && screenshotImg.naturalHeight > viewportSize.height) {
                  var canvas = document.createElement("canvas");
                  var ctx = canvas.getContext('2d');
                  const newWidth = screenshotImg.naturalWidth / ratio;
                  const newHeight = screenshotImg.naturalHeight / ratio;
                  canvas.width = newWidth;
                  canvas.height = newHeight;
                  ctx.drawImage(screenshotImg, 0, 0, newWidth, newHeight);
                  resolve(canvas.toDataURL("image/jpeg"));
                } else {
                  resolve(image);
                }
              }
              screenshotImg.src = image;
            } else {
              resolve(image);
            }
          })
          .catch(err => {
            console.log(err.message);
            reject(err);
          });
        });
      });
    } else if (request.contentScriptQuery == 'getPageAreaImage') {
      return new Promise(function (resolve, reject) {
        // obj is result of getBoundingClientRect();
        const rect = request.obj.rect;
        const image = request.obj.image;
        var screenshotImg = new Image();
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext('2d');

        screenshotImg.src = image;

        screenshotImg.onload = function(){
            canvas.width = rect.width;
            canvas.height = rect.height;
            ctx.drawImage(screenshotImg,
                rect.x, rect.y,
                rect.width, rect.height,
                0, 0,
                rect.width, rect.height);
            const dataURL = canvas.toDataURL("image/jpeg");
            const base64 = dataURL.replace(/^data:image\/(png|jpeg);base64,/, "")
            resolve(base64);
        }
      });
    } else if (request.contentScriptQuery == 'getVisibleImages') {
      return new Promise(function (resolve, reject) {
        const image = request.obj.image; 
        imageElm = document.createElement('img')
        imageElm.src = image;
        imageElm.onload = () => {
          let img = cv.imread(imageElm);
          let original = img.clone()
          let gray = new cv.Mat();
          cv.cvtColor(img, gray, cv.COLOR_BGR2GRAY);
          let thresh = new cv.Mat();
          cv.adaptiveThreshold(gray, thresh, 127, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 3, 2);
          // cv.threshold(gray, thresh, 127, 255, cv.THRESH_BINARY);
          let cnts = new cv.MatVector();
          let hierarchy = new cv.Mat();
          cv.findContours(thresh, cnts, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
          let images = [];
          for (let i = 0; i < cnts.size(); i++) {
            let rect = cv.boundingRect(cnts.get(i));
            if (rect.width >= 120 && rect.height >= 120) {
              let roi = img.roi(rect)
              let finalImage = new cv.Mat();
              roi.convertTo(finalImage, cv.CV_8U);
              // *** is GRAY, RGB, or RGBA, according to src.channels() is 1, 3 or 4.
              cv.cvtColor(finalImage, finalImage, cv.COLOR_RGB2RGBA);

              let imgData = new ImageData(new Uint8ClampedArray(finalImage.data, finalImage.cols, finalImage.rows), rect.width, rect.height);
              var canvas = document.createElement("canvas");
              var ctx = canvas.getContext("2d");
              canvas.width = rect.width;
              canvas.height = rect.height;
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.putImageData(imgData, 0, 0);
              var dataURL = canvas.toDataURL("image/jpeg");
              var base64 = dataURL.replace(/^data:image\/(png|jpeg);base64,/, "") 
              images.push(base64)
              // let base64 = btoa(roi.data);
              // images.push(dataURL);
            }
          }
          resolve(images);
        }
        // browser.tabs.sendMessage(tab.id, {backgroundScriptQuery: 'getImagesFromScreenshot', 'obj': image}).then(images => {
          // resolve(images);
        // }, error => {
          // reject(error);
        // });
    });
    } else if (request.contentScriptQuery == "closeTab") {
      browser.tabs.remove(sender.tab.id);
    } else if (request.contentScriptQuery == 'showPageAction') {
      browser.pageAction.show(sender.tab.id);
    } else if (request.contentScriptQuery == 'getResearchParticipationStatus') {
      return new Promise(function (resolve, reject) {
        let studyParticipantId = '';

        browser.storage.sync.get(['userId']).then(async function (userId) {
          if (typeof(userId.userId) !== 'undefined') {
            studyParticipantId = userId.userId;
          } else {
            studyParticipantId = await browser.tabs.sendMessage(sender.tab.id, {backgroundScriptQuery: 'promptParticipantId'});
          }

          if (studyParticipantId !== '') {
            // fetch(`http://localhost:3000/participant_lookup?id=${studyParticipantId}`, {
            fetch(`https://guardlens.natabarbosa.com/participant_lookup?id=${studyParticipantId}`, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache', 
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic UZc1x&@QO5Ji@QC!b4ZbAWJ6LsfKo6'
                }
            })
            .then((response) => response.json())
            .then((json) => {
              if (json.exists === true) {
                let userId = studyParticipantId;

                // hack for node module
                require(['node_modules/detect-browser/index.js'], function () {
                    let browserDetect = exports.detect;
                    // fetch('http://localhost:3000/log', {
                    fetch('https://guardlens.natabarbosa.com/log', {
                        method: 'POST',
                        mode: 'cors',
                        cache: 'no-cache', 
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Basic UZc1x&@QO5Ji@QC!b4ZbAWJ6LsfKo6',
                        },
                        body: JSON.stringify(
                         {
                          userId: userId,
                          event: 'installed extension',
                          data: {'system info': browserDetect() }
                        })
                    })
                    .then(() => {
                      browser.storage.sync.set({'userId': userId}).then(() => {

                       // fetch(`http://localhost:3000/installation_date?id=${userId}`, {
                       fetch(`https://guardlens.natabarbosa.com/installation_date?id=${userId}`, {
                          method: 'GET',
                          mode: 'cors',
                          cache: 'no-cache', 
                          headers: {
                              'Content-Type': 'application/json',
                              'Authorization': 'Basic UZc1x&@QO5Ji@QC!b4ZbAWJ6LsfKo6'
                          }
                        })
                        .then((response) => response.json())
                        .then((json) => {
                          browser.tabs.sendMessage(sender.tab.id, {
                            backgroundScriptQuery: 'alert', 
                            obj: `Message from GuardLens extension: You are now a study participant.`
                          });
                          resolve(userId);
                        });
                      });
                    });

                });
              } else {
                browser.tabs.sendMessage(sender.tab.id, {
                  backgroundScriptQuery: 'alert', 
                  obj: 'Message from GuardLens extension: Invalid research participant ID. The browser extension will still work but no data will be collected.'
                });
                resolve(undefined);
              }
            });
          } else {
            resolve(undefined);
          }
        });
      });
    } else if (request.contentScriptQuery == "checkIgnoreList") {
      return new Promise(function (resolve, reject) {
        browser.storage.sync.get(['ignoreList']).then(function (ignoreList) {
            if (typeof(ignoreList.ignoreList) === 'undefined') {
              resolve(false);
            } else {
              resolve(ignoreList.ignoreList.indexOf(request.obj) >= 0);
            }
        });
      });
    } else if (request.contentScriptQuery == 'addToIgnoreList') {
      return new Promise((resolve, reject) => {
        addDomainToIgnoreList().then(() =>{
          resolve(true);
        })
      });
    } else if (request.contentScriptQuery == 'saveSettings') {
      return new Promise((resolve, reject) => {
        saveSettings(request.obj).then(() =>{
          resolve(true);
        })
      });
    } else if (request.contentScriptQuery == "getSettings") {
      return new Promise(function (resolve, reject) {
        browser.storage.sync.get(['guardLensSettings']).then(function (settings) {
            console.log(settings);
            if (typeof(settings.guardLensSettings) === 'undefined') {
              resolve([]);
            } else {
              resolve(settings.guardLensSettings);
            }
        });
      });
    }
  });

// browser.commands.onCommand.addListener(async function (command) {
//   if (command === "add-to-ignore-list") {
//     addDomainToIgnoreList();
//   }
// });

browser.runtime.onInstalled.addListener(async function (details) {
  console.log(details.reason);
  if (details.reason === 'install') {
    await browser.storage.sync.remove('agreement');
    await browser.storage.sync.remove('userId');
    await browser.storage.sync.remove('transitionDate');
    await browser.storage.sync.remove('ignoreList');
    let defaultSettings = ['page_topic',
                          'domain',
                          'image_description',
                          'image_nsfw',
                          'ad_count',
                          'website_encryption',
                          'website_entity',
                          'website_locality',
                          'links_crossdomain'];

    await browser.storage.sync.set({'guardLensSettings': defaultSettings});
  }
});