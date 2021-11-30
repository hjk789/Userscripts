// ==UserScript==
// @name            YouTube Mobile Repeated Recommendations Hider
// @description     Hide from YouTube's mobile browser any videos that are recommended more than twice. You can also hide by channel or by partial title.
// @version         1.12.1
// @author          BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @copyright       2020+, BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @homepage        https://github.com/hjk789/Userscripts/tree/master/YouTube-Mobile-Repeated-Recommendations-Hider
// @license         https://github.com/hjk789/Userscripts/tree/master/YouTube-Mobile-Repeated-Recommendations-Hider#license
// @match           https://m.youtube.com
// @match           https://m.youtube.com/?*
// @match           https://m.youtube.com/watch?v=*
// @grant           GM.setValue
// @grant           GM.getValue
// @grant           GM.listValues
// @grant           GM.deleteValue
// ==/UserScript==


//********** SETTINGS ***********

const maxRepetitions = 2      // The maximum number of times that the same recommended video is allowed to appear on your
                              // homepage before starting to get hidden. Set this to 1 if you want one-time recommendations.

const filterPremiere = false  // Whether to include in the filtering repeated videos yet to be premiered. If set to false, the recommendation won't get "remembered"
                              // until the video is finally released, then it will start counting as any other video. Set this to true if you want to hide them anyway.

const filterRelated = true    // Whether the related videos (the ones below the video you are watching) should also be filtered. Set this to false if you want to keep them untouched.

const countRelated = false    // When false, new related videos are ignored in the countings and are allowed to appear any number of times, as long as they don't appear in the
                              // homepage recommendations. If set to true, the related videos are counted even if they never appeared in the homepage.

const dimFilteredHomepage = false  // Whether the repeated recommendations in the homepage should get dimmed (partially faded) instead of completely hidden.
const dimFilteredRelated = true    // Same thing, but for the related videos.

const dimWatchedVideos = false    // Whether the title of videos already watched should be dimmed, to differentiate from the ones you didn't watched yet. The browser itself is responsible for checking whether the
                                  // link was already visited or not, so if you delete a video from the browser history it will be treated as "not watched", the same if you watch them in a private window (incognito).
//*******************************


let channelsToHide, partialTitlesToHide
let processedVideosList


if (dimWatchedVideos)
{
    // Add the style for dimming watched videos
    const style = document.createElement("style")
    style.innerHTML = ":visited { color: #aaa !important; }"
    document.head.appendChild(style)
}


GM.getValue("channels").then(function(value)
{
    if (!value)
    {
        value = JSON.stringify([])
        GM.setValue("channels", value)
    }

    channelsToHide = JSON.parse(value)

    GM.getValue("partialTitles").then(function(value)
    {
        if (!value)
        {
            value = JSON.stringify([])
            GM.setValue("partialTitles", value)
        }

        partialTitlesToHide = JSON.parse(value)

        GM.listValues().then(function(GmList)                                                          // Get in an array all the items currently in the script's storage. Searching for a value in
        {                                                                                              // an array is much faster and lighter than calling GM.getValue for every recommendation.
            processedVideosList = GmList

            const isHomepage = !/watch/.test(location.href)

            if (isHomepage)
            {
                waitForRecommendationsContainer = setInterval(function()
                {
                    const recommendationsContainer = document.querySelector(".rich-grid-renderer-contents")

                    if (!recommendationsContainer)
                        return

                    clearInterval(waitForRecommendationsContainer)

                    const firstVideos = recommendationsContainer.querySelectorAll("ytm-rich-item-renderer")    // Because a mutation observer is being used and the script is run after the page is fully
                                                                                                               // loaded, the observer isn't triggered with the recommendations that appear first.
                    for (let i=0; i < firstVideos.length; i++)                                                 // This does the processing manually to these first ones.
                        processRecommendation(firstVideos[i], isHomepage)

                    const loadedRecommendedVideosObserver = new MutationObserver(function(mutations)           // A mutation observer is being used so that all processings happen only
                    {                                                                                          // when actually needed, which is when more recommendations are loaded.
                        for (let i=0; i < mutations.length; i++)
                            processRecommendation(mutations[i].addedNodes[0], isHomepage)
                    })

                    loadedRecommendedVideosObserver.observe(recommendationsContainer, {childList: true})

                }, 100)
            }
            else
            {
                waitForRelatedVideosContainer = setInterval(function()
                {
                    const relatedVideosContainer = document.querySelector("ytm-video-with-context-renderer").parentElement

                    if (!relatedVideosContainer)
                        return

                    clearInterval(waitForRelatedVideosContainer)


                    const firstRelatedVideos = document.querySelectorAll("ytm-video-with-context-renderer")

                    for (let i=0; i < firstRelatedVideos.length; i++)
                        processRecommendation(firstRelatedVideos[i], isHomepage)


                    const loadedRelatedVideosObserver = new MutationObserver(function(mutations)           // A mutation observer is being used so that all processings happen only
                    {                                                                                      // when actually needed, which is when more recommendations are loaded.
                        for (let i=0; i < mutations.length; i++)
                        {
                            const relatedVideo = mutations[i].addedNodes[0]

                            if (!relatedVideo)  return

                            if (relatedVideo.className == "spinner")
                                continue

                            processRecommendation(relatedVideo, isHomepage)
                        }
                    })

                    loadedRelatedVideosObserver.observe(relatedVideosContainer, {childList: true})

                }, 500)

            }

        })
    })
})



async function processRecommendation(node, isHomepage)
{
    if (!node) return

    const videoTitleEll = node.querySelector("h3")
    const videoTitleText = videoTitleEll.textContent.toLowerCase()                    // Convert the title's text to lowercase so that there's no distinction with uppercase letters.
    const videoChannel = videoTitleEll.nextSibling.firstChild.firstChild.textContent
    const videoUrl = videoTitleEll.parentElement.href
    const videoMenuBtn = node.querySelector("ytm-menu")
    const timeLabelEll = node.querySelector("ytm-thumbnail-overlay-time-status-renderer")
    const isNotPremiere = timeLabelEll ? /\d/.test(timeLabelEll.textContent) : true        // Check whether the video is still to be premiered. The same element that shows the video time
                                                                                           // length is the one that says "PREMIERE", so if there's a digit in there, then it's not a premiere.
    if (videoMenuBtn)
    {
        videoMenuBtn.onclick = function()
        {
            waitForMenu = setInterval(function(node, videoChannel)
            {
                const menu = document.getElementById("menu")

                if (menu)
                {
                    clearInterval(waitForMenu)

                    const hideChannelButton = document.createElement("button")
                    hideChannelButton.id = "hideChannelButton"
                    hideChannelButton.className = "menu-item-button"
                    hideChannelButton.innerText = "Hide videos from this channel"
                    hideChannelButton.onclick = function()
                    {
                        if (confirm("Are you sure you want to hide all videos from the channel ''" + videoChannel + "''?"))
                        {
                            channelsToHide.push(videoChannel)
                            GM.setValue("channels", JSON.stringify(channelsToHide))
                        }
                    }

                    const hidePartialTitleButton = document.createElement("button")
                    hidePartialTitleButton.id = "hidePartialTitleButton"
                    hidePartialTitleButton.className = "menu-item-button"
                    hidePartialTitleButton.innerText = "Hide videos that include a text"
                    hidePartialTitleButton.onclick = function()
                    {
                        const partialText = prompt("Specify the partial title of the videos to hide. All videos that contain this text in the title will get hidden.")

                        if (partialText)
                        {
                            partialTitlesToHide.push(partialText.toLowerCase())
                            GM.setValue("partialTitles", JSON.stringify(partialTitlesToHide))
                        }
                    }


                    if (!document.getElementById("hideChannelButton") && !document.getElementById("hidePartialTitleButton"))
                    {
                        menu.firstChild.appendChild(hideChannelButton)
                        menu.firstChild.appendChild(hidePartialTitleButton)
                    }


                }

            }, 100, node, videoChannel)
        }
    }

    if (channelsToHide.includes(videoChannel) || partialTitlesToHide.some(p => videoTitleText.includes(p)))
    {
        node.style.display = "none"
    }
    else if (processedVideosList.includes("hide::"+videoUrl))
    {
        if (!isHomepage && !filterRelated)
            return

        hideOrDimm(node, isHomepage)
    }
    else
    {
        if (maxRepetitions == 1)                // If the script is set to show only one-time recommendations, to avoid unnecessary processings,
        {                                       // rightaway mark to hide, in the next time the page is loaded, every video not found in the storage.
            if (!isHomepage && !countRelated)
                return

            if (isNotPremiere || filterPremiere)
            {
                GM.setValue("hide::"+videoUrl,"")
                return
            }

        }
        else
            var value = await GM.getValue(videoUrl)

        if (typeof value == "undefined")
        {
            if (!isHomepage && !countRelated)
                return

            value = 1
        }
        else
        {
            if (value >= maxRepetitions)
            {
                if (!isHomepage && !filterRelated)
                    return

                hideOrDimm(node, isHomepage)

                GM.deleteValue(videoUrl)
                GM.setValue("hide::"+videoUrl,"")
                return
            }

            if (!isHomepage && !countRelated)
                return

            value++
        }

        if (isNotPremiere || filterPremiere)
            GM.setValue(videoUrl, value)
    }

}


function hideOrDimm(node, isHomepage)
{
    if (isHomepage && dimFilteredHomepage || !isHomepage && dimFilteredRelated)
        node.style.opacity = 0.4
    else
        node.style.display = "none"
}
