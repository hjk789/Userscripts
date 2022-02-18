// ==UserScript==
// @name            YouTube Clickbait-Buster
// @version         1.2.0
// @description     Check whether it's worth watching a video by peeking it's content, viewing the thumbnail in full-size and displaying the full title. Works on both YouTube's desktop and mobile layouts.
// @author          BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @copyright       2022+, BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @homepage        https://github.com/hjk789/Userscripts/tree/master/YouTube-Clickbait-Buster
// @license         https://github.com/hjk789/Userscripts/tree/master/YouTube-Clickbait-Buster#license
// @match           https://www.youtube.com/*
// @match           https://m.youtube.com/*
// @grant           none
// ==/UserScript==


//*********** SETTINGS ***********

const numColumns = 1                     // The video storyboard YouTube provides is divided in chunks of frames. Set this to the number of chunks per row you would like. Note that the size
                                         // and the number of chunks per row is limited by your device's screen dimensions. You can open the chunk in a new tab to view it in full-size.

const fullTitles = true                  // Whether the videos' title should be forced to be displayed in full, without any trimmings. In case you are using any other userscript
                                         // or extension that changes YouTube's layout, set this to false if you see anything wrong in the layout, such as titles overlapping.

const preferredTranscriptLanguage = ""   // The two letters language-country code of the language you want the transcriptions to always be in. Examples: for US English, en-US,
                                         // for Spain's Spanish, es-ES, and so on. If there's no subtitles in the specified language, another language (if any) will be selected
                                         // and then translated to the specified language. If left blank, the language most likely to be the original is selected.

//********************************


let selectedVideoURL
let viewStoryboardButton, viewThumbnailButton, viewTranscriptButton
const isMobile = !/www/.test(location.hostname)
let isMenuReady = false

/* Add the styles */
{
    const style = document.createElement("style")
    style.innerHTML = "#viewStoryboardButton:hover, #viewThumbnailButton:hover, #viewTranscriptButton:hover { background-color: var(--yt-spec-10-percent-layer) !important; }" +            // Add the desktop version's hover for the recommendation menu items
                      "#transcriptTextContainer transcript { width: max-content; max-width: 96vw; display: block; left: 0; right: 0; position: relative; margin: auto; }" +
                      "transcript text { display: block; margin-top: 10px; }"

    if (fullTitles)
        style.innerHTML += "#video-title, h3, h4 { max-height: initial !important; -webkit-line-clamp: initial !important; }"                // The full video title style

    document.head.appendChild(style)
}


/* Remove the storyboard and thumbnail when the page is clicked */
{
    document.body.addEventListener("click", function()
    {
        const storyboard = document.getElementById("storyboard")

        if (storyboard)  storyboard.remove()


        const thumbnail = document.getElementById("highresThumbnail")

        if (thumbnail)  thumbnail.remove()


        const transcript = document.getElementById("transcriptTextContainer")

        if (transcript)  transcript.parentElement.remove()
    })
}


/* Create the "Peek video content" and "View high-res thumbnail" buttons */
{
    viewStoryboardButton = document.createElement(isMobile ? "button" : "div")
    viewStoryboardButton.id = "viewStoryboardButton"
    viewStoryboardButton.className = "menu-item-button"
    viewStoryboardButton.style = !isMobile ? "background-color: var(--yt-spec-brand-background-solid); font-size: 14px; padding: 9px 0px 9px 56px; cursor: pointer; min-width: max-content;" : ""
    viewStoryboardButton.innerHTML = "Peek video content"
    viewStoryboardButton.onclick = function()
    {
        const xhr = new XMLHttpRequest()
        xhr.open('GET', selectedVideoURL)
        xhr.onload = function()
        {
            const fullStoryboardURL = xhr.responseText.match(/playerStoryboardSpecRenderer.+?"(https.+?)"}/)

            if (!fullStoryboardURL || fullStoryboardURL[1].includes("googleadservices"))                // It can happen sometimes that the storyboard provided is of the ad, instead of the video itself.
            {                                                                                           // But this seems to only happen on videos that don't have a storyboard available anyway.
                alert("Storyboard not available for this video!")

                return
            }

            const urlSplit = fullStoryboardURL[1].split("|")
            let mode = urlSplit[3] ? 3 : 1                                  // YouTube provides 2 modes of storyboards: one with 25 frames per chunk and another one with 60 frames per chunk. I've choose the former mode,
                                                                            // as in the second one the frames are too tiny to see anything. But in short videos with less than 30 seconds, only the latter is available.
            if (!urlSplit[mode])                                            // There's also a third mode, videos that have only one mode and ongoing lives storyboards, but I couldn't find any way to make them work.
            {
                alert("Storyboard not available for this video yet! Try again some hours later.")

                return
            }

            const storyboardId = urlSplit[mode].replace(/.+#rs/, "&sigh=rs")

            const container = document.createElement("div")
            container.id = "storyboard"
            container.style = "position: fixed; z-index: 9999; width: min-content; max-height: 100vh; max-width: 100.3vw; overflow-y: scroll; background-color: white; margin: auto; top: 0px; left: 0px; right: 0px;"
            container.contentEditable = !isMobile                // Make the storyboards container focusable on the desktop layout. From all the other methods to achieve this, this is the only one that works reliably.
            container.onmousedown = function() { window.getSelection().removeAllRanges() }            // Because contentEditable is true, the storyboards become selectable. This prevents that by immediately deselecting them.

            document.body.appendChild(container)

            if (mode == 3)  mode--

            let num = 0

            createStoryboardImg(num, container, urlSplit, storyboardId, mode)
        }
        xhr.send()

        document.body.click()     // Dismiss the menu.
    }

    viewTranscriptButton = document.createElement(isMobile ? "button" : "div")
    viewTranscriptButton.id = "viewTranscriptButton"
    viewTranscriptButton.className = viewStoryboardButton.className
    viewTranscriptButton.style = viewStoryboardButton.style.cssText
    viewTranscriptButton.innerHTML = "Peek audio transcription"
    viewTranscriptButton.onclick = function()
    {
        const xhr = new XMLHttpRequest()
        xhr.open('GET', selectedVideoURL)
        xhr.onload = function()
        {
            let transcriptObj = xhr.responseText.match(/"playerCaptionsTracklistRenderer":({"captionTracks":\[{"baseUrl".+?}\].+?}.+?\].+?})},"videoDetails"/)

            if (!transcriptObj)
            {
                alert("Transcript not available for this video!")

                return
            }

            transcriptObj = JSON.parse(unescape(decodeURI(transcriptObj[1])).replaceAll("\\u0026","&"))

            const backgroundColor = "var(--yt-spec-brand-background-solid, "+ getComputedStyle(document.documentElement).backgroundColor +")"

            const transcriptContainer = document.createElement("div")
            transcriptContainer.style = "position: fixed; z-index: 9999; background-color: " + backgroundColor + "; color: var(--paper-listbox-color); font-size: 15px;" +
                                        "max-height: 98vh; width: max-content; max-width: 94vw; overflow: scroll; top: 0; left: 0; right: 0; margin: auto; padding: 10px;"
            transcriptContainer.onclick = function() { event.stopPropagation() }

            const transcriptLanguageLabel = document.createElement("div")
            transcriptLanguageLabel.innerText = "Transcript language: "
            transcriptLanguageLabel.style = "margin-bottom: 5px; width: max-content;"
            transcriptContainer.appendChild(transcriptLanguageLabel)

            const transcriptLanguageDropdown = document.createElement("select")
            transcriptLanguageDropdown.style = "background-color: " + backgroundColor + "; color: var(--paper-listbox-color); border: 1px solid lightgray; border-radius: 5px; padding: 3px;"
            transcriptLanguageDropdown.onchange = function() { loadTranscript(transcriptObj.captionTracks[this.selectedIndex].baseUrl) }
            transcriptLanguageLabel.appendChild(transcriptLanguageDropdown)

            for (let i=0; i < transcriptObj.captionTracks.length; i++)
            {
                const option = document.createElement("option")
                option.innerText = isMobile ? transcriptObj.captionTracks[i].name.runs[0].text : transcriptObj.captionTracks[i].name.simpleText
                option.value = transcriptObj.captionTracks[i].languageCode

                transcriptLanguageDropdown.appendChild(option)
            }

            transcriptLanguageDropdown.value = preferredTranscriptLanguage

            if (preferredTranscriptLanguage && !transcriptLanguageDropdown.value)
                transcriptLanguageDropdown.value = preferredTranscriptLanguage.split("-")[0]

            if (!transcriptLanguageDropdown.value)
            {
                if (transcriptObj.captionTracks.length > 1)
                {
                    const index = transcriptObj.audioTracks[0].captionTrackIndices[transcriptObj.audioTracks[0].captionTrackIndices.length-1]
                    const autogen = transcriptObj.captionTracks[index]

                    if (autogen.vssId[0] == "a")
                    {
                        const a = autogen.vssId.split(".")[1]

                        if (transcriptObj.captionTracks[index+1] && transcriptObj.captionTracks[index+1].vssId.includes(a))
                            transcriptLanguageDropdown.value = transcriptObj.captionTracks[index+1].languageCode
                        else if (transcriptObj.captionTracks[index-1])
                            transcriptLanguageDropdown.value = transcriptObj.captionTracks[index-1].languageCode
                        else
                            transcriptLanguageDropdown.value = transcriptObj.captionTracks[transcriptObj.audioTracks[0].captionTrackIndices[0]].languageCode
                    }
                }
                else transcriptLanguageDropdown.value = transcriptLanguageDropdown.options[0].value
            }


            const transcriptTranslationLabel = document.createElement("div")
            transcriptTranslationLabel.innerText = "Translate to: "
            transcriptTranslationLabel.style = "margin-top: 10px; padding-bottom: 10px;"
            transcriptContainer.appendChild(transcriptTranslationLabel)

            const transcriptTranslationDropdown = document.createElement("select")
            transcriptTranslationDropdown.style = "margin-left: 53px; background-color: " + backgroundColor + "; color: var(--paper-listbox-color); border: 1px solid lightgray; border-radius: 5px; padding: 3px;"
            transcriptTranslationDropdown.onchange = function() { loadTranscript(transcriptObj.captionTracks[transcriptLanguageDropdown.selectedIndex].baseUrl + "&tlang=" + this.value) }
            transcriptTranslationLabel.appendChild(transcriptTranslationDropdown)

            const emptyOption = document.createElement("option")
            transcriptTranslationDropdown.appendChild(emptyOption)

            for (let i=0; i < transcriptObj.translationLanguages.length; i++)
            {
                const option = document.createElement("option")
                option.innerText = isMobile ? transcriptObj.translationLanguages[i].languageName.runs[0].text : transcriptObj.translationLanguages[i].languageName.simpleText
                option.value = transcriptObj.translationLanguages[i].languageCode

                transcriptTranslationDropdown.appendChild(option)
            }

            transcriptTranslationDropdown.value = preferredTranscriptLanguage

            if (!transcriptTranslationDropdown.value)
                transcriptTranslationDropdown.value = preferredTranscriptLanguage.split("-")[0]


            const transcriptTextContainer = document.createElement("div")
            transcriptTextContainer.id = "transcriptTextContainer"
            transcriptTextContainer.style = "min-width: max-content; max-width: 94vw; border-top: 1px solid lightgray;"
            transcriptContainer.appendChild(transcriptTextContainer)

            if (isMobile)
            {
                const closeButton = document.createElement("div")
                closeButton.innerText = "X"
                closeButton.style = "position: sticky; width: 25px; float: right; bottom: 0px; background-color: #f0f0f0ab; border-radius: 7px; padding: 10px 15px; text-align: center; font-size: 25px;"
                closeButton.onclick = function() { document.body.click() }
                transcriptContainer.appendChild(closeButton)
            }


            document.body.appendChild(transcriptContainer)


            loadTranscript(transcriptObj.captionTracks[transcriptLanguageDropdown.selectedIndex].baseUrl + "&tlang=" + transcriptTranslationDropdown.value)
        }
        xhr.send()

        document.body.click()
    }

    viewThumbnailButton = document.createElement(isMobile ? "button" : "div")
    viewThumbnailButton.id = "viewThumbnailButton"
    viewThumbnailButton.className = viewStoryboardButton.className
    viewThumbnailButton.style = viewStoryboardButton.style.cssText
    viewThumbnailButton.innerHTML = "View high-res thumbnail"
    viewThumbnailButton.onclick = function()
    {
        event.stopPropagation()             // Prevent the click event from reaching the body, otherwise the thumbnail is removed right after.

        if (!isMobile)
            document.body.click()
        else
            this.parentElement.click()              // On mobile, the menu creates a backdrop above the body which is only dismissed when clicked. Clicking the body element doesn't work in this case.

        const videoId = cleanVideoUrl(selectedVideoURL).split("=")[1]

        const img = document.createElement("img")
        img.id = "highresThumbnail"
        img.src = "https://i.ytimg.com/vi_webp/" + videoId + "/maxresdefault.webp"
        img.style = "position: fixed; z-index: 9999; max-height: 100vh; max-width: 100vw; margin: auto; top: 0px; left: 0px; right: 0px;"
        img.onload = function()
        {
            if (this.clientWidth == 120)                // The default thumbnail URL points to the biggest size and highest quality. But sometimes it can happen that this kind of thumbnail is not available (especially on older videos). When this
            {                                           // happens, YouTube responds with a small placeholder image with 120 width. This checks if it's the placeholder, and if so, tries again with a lower quality version and then a smaller size.
                this.onload = function()
                {
                    if (this.clientWidth == 120)
                    {
                        this.onload = function()
                        {
                            if (this.clientWidth == 120)
                            {
                                this.onload = function()
                                {
                                    if (this.clientWidth == 120)
                                    {
                                        alert("Thumbnail not found!")

                                        this.onload = undefined
                                    }
                                }

                                this.src = "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg"
                            }
                        }

                        this.src = "https://i.ytimg.com/vi_webp/" + videoId + "/hqdefault.webp"
                    }
                }

                this.src = "https://i.ytimg.com/vi/" + videoId + "/maxresdefault.jpg"
            }
        }

        document.body.appendChild(img)

    }


    viewStoryboardButton.style.borderTop = "solid 1px var(--yt-spec-10-percent-layer, #ddd)"             // Add a separator between Youtube's menu items and the ones added by the script.

}


main()


function main()
{
    const videosSelector = isMobile ? "ytm-rich-item-renderer, ytm-video-with-context-renderer, ytm-compact-video-renderer, ytm-compact-playlist-renderer, ytm-compact-show-renderer, ytm-playlist-video-renderer"
                                    : "ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-compact-playlist-renderer, ytd-compact-movie-renderer, ytd-playlist-video-renderer, ytd-video-renderer, ytd-compact-radio-renderer"

    addRecommendationMenuItems()

    document.body.addEventListener("mousedown", function()                // Process all video items every time the user clicks anywhere on the page. Although not
    {                                                                     // ideal, it's the most guaranteed way of working reliably regardless of the situation.
        const videoItems = document.querySelectorAll(videosSelector)

        for (let i=0; i < videoItems.length; i++)
            processVideoItem(videoItems[i])
    })
}

function addRecommendationMenuItems()
{
    const waitForRecommendationMenu = setInterval(function()
    {
        const recommendationMenu = isMobile ? document.getElementById("menu") : document.querySelector("#details #menu yt-icon, .details #menu yt-icon, #title-wrapper #menu yt-icon, ytd-playlist-video-renderer #menu yt-icon")

        if (!recommendationMenu)
            return

        clearInterval(waitForRecommendationMenu)

        if (document.getElementById("viewStoryboardButton") || document.getElementById("viewThumbnailButton"))              // Only add the menu items if they aren't present already.
            return


        if (isMobile)
        {
            recommendationMenu.firstChild.appendChild(viewStoryboardButton)
            recommendationMenu.firstChild.appendChild(viewTranscriptButton)
            recommendationMenu.firstChild.appendChild(viewThumbnailButton)
        }
        else
        {
            if (!document.querySelector("ytd-menu-popup-renderer"))
            {
                recommendationMenu.click()
                recommendationMenu.click()              // The recommendation menu doesn't exist in the HTML before it's clicked for the first time. This forces it to be created and dismisses it immediately.
            }

            const optionsParent = document.querySelector("ytd-menu-popup-renderer")
            optionsParent.style = "max-height: max-content !important; max-width: max-content !important; height: max-content !important; width: 260px !important;"                // Change the max width and height so that the new items fit in the menu.
            optionsParent.firstElementChild.style = "width: inherit;"

            const waitForRecommendationMenuItem = setInterval(function()
            {
                const recommendationMenuItem = optionsParent.querySelector("ytd-menu-service-item-renderer")

                if (!recommendationMenuItem)
                    return

                clearInterval(waitForRecommendationMenuItem)


                recommendationMenuItem.parentElement.appendChild(viewStoryboardButton)
                recommendationMenuItem.parentElement.appendChild(viewTranscriptButton)
                recommendationMenuItem.parentElement.appendChild(viewThumbnailButton)

                if (!isMenuReady)
                {
                    recommendationMenu.click()              // The menu doesn't apply the width and height adjustments the first time it's opened, but it
                    recommendationMenu.click()              // does on the second time. This forces the menu to be opened again and dismisses it immediately.

                    isMenuReady = true
                }

                const isChannelOrPlaylistPage = location.pathname.includes("/channel/") || location.pathname.includes("/user/") || location.pathname.includes("/c/") || location.pathname == "/playlist"

                if (isChannelOrPlaylistPage && document.querySelector("ytd-topbar-menu-button-renderer #avatar-btn"))             // In the channel page, when the user is signed in, Youtube already adds a separator at the bottom of the menu.
                    viewStoryboardButton.style.borderTop = ""                                                                     // This removes the separator when on these pages.
                else
                    viewStoryboardButton.style.borderTop = "solid 1px var(--yt-spec-10-percent-layer, #ddd)"                      // And adds it back when the user switches to another non-channel page.

            }, 100)
        }

    }, 100)
}

function processVideoItem(node)
{
    const videoTitleEll = node.querySelector(isMobile ? "h3, h4" : "#video-title, #movie-title")

    if (!videoTitleEll)
        return


    let videoUrl = videoTitleEll.href

    if (!videoUrl)
    {
        videoUrl = videoTitleEll.parentElement.href

        if (!videoUrl)
            videoUrl = videoTitleEll.parentElement.parentElement.href
    }


    const videoMenuBtn = node.querySelector(isMobile ? "ytm-menu" : "ytd-menu-renderer")

    // Because the recommendation's side-menu is separated from the recommendations container, this listens to clicks on each three-dot
    // button and store in a variable in what recommendation it was clicked, to then be used to load the storyboards or thumbnail.

    if (videoMenuBtn)
    {
        videoMenuBtn.parentElement.onclick = function()
        {
            selectedVideoURL = videoUrl

            addRecommendationMenuItems()
        }
    }
}

function createStoryboardImg(num, container, urlSplit, param, mode)
{
    const base = urlSplit[0].replace("L$L/$N","L"+mode+"/M"+num++)              // The storyboard URL uses the "L#/M#" parameter to determine the type and part of the storyboard to load. L1 is the
    const img = document.createElement("img")                                   // storyboard chunk with 60 frames, and L2 is the one with 25 frames. M0 is the first chunk, M1 the second, and so on.
    img.src = base+param
    img.style = "vertical-align: top; max-width: 100vw;"
    img.style.margin = !isMobile && numColumns > 1 ? "1px" : ""             // Add a space between the storyboard chunks to make it easier to know where each chunk starts and ends.
    img.onload = function()
    {
        if (!isMobile && container.children.length == 2)
        {
            if (numColumns > 1)
                container.style.width = 21 + this.clientWidth * numColumns + "px"
        }

        container.focus()

        createStoryboardImg(num, container, urlSplit, param, mode)              // Keep loading the storyboard chunks until there's no more left.
    }
    img.onerror = function()
    {
        if (container.clientHeight < document.documentElement.clientHeight)
            container.style.overflowY = "auto"

        container.contentEditable = false

        if (container.children.length == 1)
        {
            alert("Storyboard not available for this video!")

            container.remove()
        }

        this.remove()
    }

    container.appendChild(img)

}

function loadTranscript(url)
{
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url)
    xhr.onload = function()
    {
        const transcriptTextContainer = document.getElementById("transcriptTextContainer")

        transcriptTextContainer.innerHTML = xhr.responseText.replaceAll("&amp;#39;", "'").replaceAll("&amp;quot;", '"')

        const lines = transcriptTextContainer.firstElementChild.children

        for (let i=0; i < lines.length; i++)
        {
            const seconds = lines[i].attributes.start.value.split(".")[0]

            const date = new Date(null)
            date.setSeconds(seconds)
            const time = seconds >= 3600 ? date.toISOString().substr(11, 8) : date.toISOString().substr(14, 5)

            const timestamp = document.createElement("a")
            timestamp.href = selectedVideoURL + "&t=" + seconds
            timestamp.style = "background-color: var(--yt-spec-10-percent-layer); color: var(--paper-listbox-color); padding: 2px 5px 1px 5px; margin-right: 10px; text-decoration: none;"
            timestamp.innerText = time

            lines[i].insertBefore(timestamp, lines[i].firstChild)
        }
    }
    xhr.send()
}

function cleanVideoUrl(fullUrl)
{
    const urlSplit = fullUrl.split("?")                 // Separate the page path from the parameters.
    const paramsSplit = urlSplit[1].split("&")          // Separate each parameter.

    for (let i=0; i < paramsSplit.length; i++)
    {
        if (paramsSplit[i].includes("v="))              // Get the video's id.
            return urlSplit[0]+"?"+paramsSplit[i]       // Return the cleaned video URL.
    }
}
