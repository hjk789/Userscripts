// ==UserScript==
// @name            YouTube Clickbait-Buster
// @version         1.0.0
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

const numColumns = 1        // The video storyboard YouTube provides is divided in chunks of frames. Set this to the number of chunks per row you would like. Note that the size
                            // and the number of chunks per row is limited by your device's screen dimensions. You can open the chunk in a new tab to view it in full-size.

//********************************


let selectedVideoURL
let viewStoryboardButton, viewThumbnailButton
const isMobile = !/www/.test(location.hostname)
let isHomepage, isChannelPage, isMenuReady = false

/* Add the styles */
{
    const style = document.createElement("style")
    style.innerHTML = `#viewStoryboardButton:hover, #viewThumbnailButton:hover { background-color: #e7e7e7 !important; }    /* Add the desktop version's hover for the recommendation menu items */
                       #video-title, h3, h4 { max-height: initial !important; -webkit-line-clamp: initial !important; }     /* The full video title style */`
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
    })
}


/* Create the "Peek video content" and "View high-res thumbnail" buttons */
{
    viewStoryboardButton = document.createElement(isMobile ? "button" : "div")
    viewStoryboardButton.id = "viewStoryboardButton"
    viewStoryboardButton.className = "menu-item-button"
    viewStoryboardButton.style = !isMobile ? "background-color: white; font-size: 14px; padding: 9px 0px 9px 56px; cursor: pointer; min-width: max-content;" : ""
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
            container.style = "position: fixed; z-index: 9999; max-height: 100vh; max-width: 100.3vw; overflow-y: scroll; background-color: white; margin: auto; top: 0px; left: 0px; right: 0px;"
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

    viewStoryboardButton.style.borderTop = "solid #ddd 1px"             // Add a separator between Youtube's menu items and the ones added by the script.

}


main()


function main()
{
    const videosSelector = isMobile ? "ytm-rich-item-renderer, ytm-video-with-context-renderer, ytm-compact-video-renderer, ytm-compact-playlist-renderer, ytm-compact-show-renderer"
                                    : "ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-compact-playlist-renderer, ytd-compact-movie-renderer, ytd-video-renderer"

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
        const recommendationMenu = isMobile ? document.getElementById("menu") : document.querySelector("#details #menu yt-icon, .details #menu yt-icon, #title-wrapper #menu yt-icon")

        if (!recommendationMenu)
            return

        clearInterval(waitForRecommendationMenu)

        if (document.getElementById("viewStoryboardButton") || document.getElementById("viewThumbnailButton"))              // Only add the menu items if they aren't present already.
            return


        if (isMobile)
        {
            recommendationMenu.firstChild.appendChild(viewStoryboardButton)
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
                recommendationMenuItem.parentElement.appendChild(viewThumbnailButton)

                if (!isMenuReady)
                {
                    recommendationMenu.click()              // The menu doesn't apply the width and height adjustments the first time it's opened, but it
                    recommendationMenu.click()              // does on the second time. This forces the menu to be opened again and dismisses it immediately.

                    isMenuReady = true
                }

                if ((isChannelPage || location.pathname.includes("/c/")) && !document.querySelector("ytd-guide-signin-promo-renderer"))             // In the channel page, when the user is signed in, Youtube already adds a separator at the bottom of the menu.
                    viewStoryboardButton.style.borderTop = ""                                                                                       // This removes the separator when on these pages.
                else
                    viewStoryboardButton.style.borderTop = "solid #ddd 1px"                                                                         // And adds it back when the user switches to another non-channel page.

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
        if (!isMobile && !container.style.width && container.children.length > 1)
        {
            if (numColumns > 1)
                container.style.width = 21 + this.clientWidth * numColumns + "px"
            else
                container.style.width = "min-content"
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
