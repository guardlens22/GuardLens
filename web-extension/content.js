const topWebsites = ['google.com', 'youtube.com', 'amazon.com', 'zoom.us', 'yahoo.com', 'facebook.com', 'reddit.com', 'wikipedia.org', 'myshopify.com', 'ebay.com', 'office.com', 'instructure.com', 'netflix.com', 'cnn.com', 'bing.com', 'live.com', 'microsoft.com', 'nytimes.com', 'twitch.tv', 'apple.com', 'instagram.com', 'microsoftonline.com', 'walmart.com', 'zillow.com', 'espn.com', 'chaturbate.com', 'salesforce.com', 'etsy.com', 'chase.com', 'dropbox.com', 'linkedin.com', 'adobe.com', 'foxnews.com', 'twitter.com', 'okta.com', 'force.com', 'quizlet.com', 'craigslist.org', 'aliexpress.com', 'livejasmin.com', 'bestbuy.com', 'amazonaws.com', 'wellsfargo.com', 'breitbart.com', 'tmall.com', 'indeed.com', 'hulu.com', 'target.com', 'imdb.com', 'homedepot.com'];

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

async function startGuardLens(userId) {

    let ignore = await browser.runtime.sendMessage({'contentScriptQuery': 'checkIgnoreList', obj: getTopDomain()});
    let settings = await browser.runtime.sendMessage({'contentScriptQuery': 'getSettings' });
    console.log(settings);
    // if not in ignorelist, ignore if in Top 50 Alexa US list
    if (!ignore) ignore = topWebsites.indexOf(getTopDomain()) >= 0;
    
    if (typeof(userId) !== 'undefined') {
        new guardLens(userId, true, !ignore, settings);
    } else {
        new guardLens(null, false, !ignore, settings);
    }
}

(async function () {
    let userId = await browser.storage.sync.get(['userId']);
    if (typeof(userId.userId) == 'undefined') userId = undefined;

    let agreement = await browser.storage.sync.get(['agreement']);

    if (agreement.hasOwnProperty('agreement')) {
        startGuardLens(userId);
    } else {
        let head = document.head || document.getElementsByTagName('head')[0];
        let fontLink = document.createElement('link');

        fontLink.setAttribute('rel', 'stylesheet');
        fontLink.setAttribute('href', 'https://fonts.googleapis.com/css?family=Rubik');

        head.appendChild(fontLink);
        // browser.notifications.create({'type': 'basic', 'iconUrl': 'icon-bw.png','title': 'test','message':'hello'})
        let disclosureElm = new DOMParser().parseFromString(`<div role="alertdialog" tabindex="-1" style="z-index: 2147483647;" id="GuardLensDisclosureModal" data-modal
          data-modal-auto
          data-modal-auto-persist
          data-modal-close-class="guardLens-consent-btn"
          data-modal-close-focus style="font-family: Rubik; font-family: 12px; color: #000;">
                <h3 style="color: #000;" data-autofocus><img alt="GuardLens Logo" width="30" src="${browser.runtime.getURL('icon-bw.png')}"/> GuardLens Extension Disclosure</h3>
                <br />
                <div>
                    <p>GuardLens collects user data, such as browsing data with pseudonyms (i.e., a fake name). All data collected by GuardLens will be used solely as part of an approved research investigation, done in connection with the <a style="color: #000; text-decoration: underline; font-weight:bold;" href="http://inclusiveprivacy.org/" target="_blank">Inclusive Privacy Project</a> and in affiliation with the <a style="color: #000;text-decoration: underline; font-weight:bold;" href="https://illinois.edu/" target="_blank">University of Illinois at Urbana-Champaign</a>. GuardLens is an unlisted browser extension, and only recruited research participants will be given a link to download.</p>
                    <h3 style="color: #000;">Data Collected</h3>
                    <p>We collect several different types of information related to our research, including browsing data and extension usage information. Users are given a pseudonym (i.e., a fake name) to protect their identity, and no personally identifiable information is collected. Specific types of information collected include: </p>
                    <ul style="padding-left: 1.28em; list-style-type: disc;"> 
                        <li>Browser information and version</li>
                        <li>Operating system information and version</li>
                        <li>Websites visited</li>
                        <li>Category/topic of websites visited</li>
                        <li>Time spent on each website visited</li>
                        <li>Origin of websites visited (e.g., direct, search engines, etc.)</li>
                        <li>Usage statistics such as 
                            <ul style="padding-left: 1.28em; list-style-type: disc;"> 
                                <li>What websites you use the extension on, including their category or topic</li>
                                <li>System messages shown to you</li> <li>Your engagement with the system (e.g., clicks on messages, time spent reading messages)</li>
                            </ul> 
                        </li> 
                    </ul>
                    <h3 style="color: #000;">Data Use</h3>
                    <p>We only use these data for research purposes and product improvement. We do not share your data with any third parties. We may share anonymized data in the course of publishing and sharing the results of our research. Any information we share will use the above-described pseudonyms to make users anonymous.</p>
                    <h3 style="color: #000;">Privacy Policy</h3>
                    <p>If you want to know more about data collection, use, sharing, security, and retention in GuardLens, please visit our <a style="color: #000; text-decoration: underline; font-weight:bold;" href="https://privacy-policy.natabarbosa.com" target="_blank">Privacy Policy</a>
                    <h3 style="color: #000;">Consent</h3>
                    <p>Please indicate below whether you consent to this data collection and use or you wish to uninstall the browser extension.</p>
                    <br />
                </div>
                <button data-modal-close-btn class="guardLens-consent-btn" id="GuardLensConsentYes" style="display: inline; font-weight: bold; background: #27ae60; color: #fff;padding: 10px;border: none; font-family: 16px;">I consent, start using GuardLens</button>
                <button data-modal-close-btn class="guardLens-consent-btn" id="GuardLensConsentNo" style="display: inline; font-weight: bold; background: #e74c3c; color: #fff; padding: 10px; border: none; font-family: 16px;">I <strong>do not</strong> consent, uninstall the GuardLens extension</button>
                </div>`, 'text/html').body.firstChild;
        
        document.body.appendChild(disclosureElm);

        let modalStyle = document.createElement('link');
        modalStyle.setAttribute('rel', 'stylesheet');
        modalStyle.setAttribute('href', browser.runtime.getURL('aria.modal.css'));
        head.appendChild(modalStyle);


        var s = document.createElement('script');
        s.src = browser.runtime.getURL('inert-polyfill.min.js');
        s.onload = function() {
            this.remove();
        };
        (document.head || document.documentElement).appendChild(s);

            s = document.createElement('script');
        
        s.src = browser.runtime.getURL('aria.modal.min.js');
        s.onload = function() {
            this.remove();
        };
        (document.head || document.documentElement).appendChild(s);

        document.getElementById('GuardLensConsentYes').addEventListener('click', async function () {
            await browser.storage.sync.set({'agreement': true});
            var userId = await browser.storage.sync.get(['userId']);
            if (typeof(userId.userId) == 'undefined') userId = undefined;

            if (typeof(userId) === 'undefined') {
                userId = await browser.runtime.sendMessage({'contentScriptQuery': 'getResearchParticipationStatus'});
            }

            startGuardLens(userId);
        });

        document.getElementById('GuardLensConsentNo').addEventListener('click', function () {
            browser.runtime.sendMessage({'contentScriptQuery': 'uninstallExtension'});
        });


    }

})();

browser.runtime.onMessage.addListener(
  async function(request, sender) {
    if (request.backgroundScriptQuery === "promptParticipantId") {
        return new Promise(function(resolve, reject) {
            let participantId = prompt('Message from GuardLens extension: Do you have a GuardLens research participant ID? If not, please leave blank');
            resolve(participantId);
        });
    } else if (request.backgroundScriptQuery === "alert") {
        alert(request.obj);
    } else if (request.backgroundScriptQuery === "getTopDomain") {
        return new Promise(function(resolve, reject) {
            resolve(getTopDomain());
        });
    } else if (request.backgroundScriptQuery === 'addedToIgnoreList') {
        alert(`Message from GuardLens extension: GuardLens warnings will no longer show for ${request.obj} automatically in the future.`)
    } else if (request.backgroundScriptQuery === 'savedSettings') {
        alert(`Message from GuardLens extension: Settings saved successfully! They will be enforced on websites visited in the future.`)
    }

    return true;
})


