const isChrome = typeof browser == "undefined"

if (isChrome)
    chrome.storage.onChanged.addListener(loadYCBsettings)
else
    browser.storage.onChanged.addListener(loadYCBsettings)


function loadYCBsettings()
{
    return new Promise(resolve =>
    {
        readSetting("YCBsettings", function(obj)
        {
            if (!obj.YCBsettings)        // If it's running for the first time, store the following default settings.
            {
                YCBsettings =
                {
                    numberChunkColumns: 1,
                    fullTitles: true,
                    sortByTopComments: true,
                    preferredTranscriptLanguage: ""
                }

                saveSettings()
            }
            else
                YCBsettings = obj.YCBsettings

            resolve()
        })
    })
}

function saveSettings()
{
    if (isChrome)
        chrome.storage.local.set({YCBsettings: YCBsettings})
    else
        browser.storage.local.set({YCBsettings: YCBsettings})
}

function readSetting(settingName, callback)
{
    if (isChrome)
        chrome.storage.local.get(settingName, callback)
    else
        browser.storage.local.get(settingName).then(callback)
}