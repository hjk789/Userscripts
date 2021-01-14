// ==UserScript==
// @name            YouTube Mobile Repeated Recommendations Hider
// @description     Hide from YouTube's mobile browser homepage any videos that are recommended more than twice. You can also hide by channel or by partial title.
// @version         1.8
// @author          BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @copyright       2020+, BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @homepage        https://github.com/hjk789/Creations/tree/master/JavaScript/Userscripts/YouTube-Mobile-Repeated-Recommendations-Hider
// @license         https://github.com/hjk789/Creations/tree/master/JavaScript/Userscripts/YouTube-Mobile-Repeated-Recommendations-Hider#license
// @match           https://m.youtube.com
// @grant           GM.setValue
// @grant           GM.getValue
// @grant           GM.listValues
// @grant           GM.deleteValue
// ==/UserScript==

//******* SETTINGS ********

const maxRepetitions = 2    // The maximum number of times that the same recommended video is allowed to appear on your
                            // homepage before starting to get hidden. Set this to 1 if you want one-time recommendations.
//*************************

let channelsToHide, partialTitlesToHide
let processedVideosList

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

            const recommendationsContainer = document.querySelector(".rich-grid-renderer-contents")

            const firstVideos = recommendationsContainer.querySelectorAll("ytm-rich-item-renderer")    // Because a mutation observer is being used and the script is run after the page is fully
                                                                                                       // loaded, the observer isn't triggered with the recommendations that appear first.
            for (let i=0; i < firstVideos.length; i++)                                                 // This does the processing manually to these first ones.
                processRecommendation(firstVideos[i])


            const loadedRecommendedVideosObserver = new MutationObserver(function(mutations)           // A mutation observer is being used so that all processings happen only
            {                                                                                          // when actually needed, which is when more recommendations are loaded.
                for (let i=0; i < mutations.length; i++)
                    processRecommendation(mutations[i].addedNodes[0])
            })

            loadedRecommendedVideosObserver.observe(recommendationsContainer, {childList: true})
        })
    })
})

async function processRecommendation(node)
{
    if (!node) return

    const videoTitleEll = node.querySelector("h3")
    const videoTitleText = videoTitleEll.textContent.toLowerCase()                    // Convert the title's text to lowercase so that there's no distinction with uppercase letters.
    const videoChannel = videoTitleEll.nextSibling.firstChild.firstChild.textContent
    const videoUrl = videoTitleEll.parentElement.href
    const videoMenuBtn = node.querySelector("ytm-menu")

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

                    menu.firstChild.appendChild(hideChannelButton)
                    menu.firstChild.appendChild(hidePartialTitleButton)


                }

            }, 100, node, videoChannel)
        }
    }

    if (processedVideosList.includes("hide::"+videoUrl) || channelsToHide.includes(videoChannel) || partialTitlesToHide.some(p => videoTitleText.includes(p)))
        node.style.display = "none"
    else
    {
        if (maxRepetitions == 1)                // If the script is set to show only one-time recommendations, to avoid unnecessary processings,
        {                                       // rightaway mark to hide in the next time the page is loaded every video not found in the storage.
            GM.setValue("hide::"+videoUrl,"")
            return
        }
        else
            var value = await GM.getValue(videoUrl)

        if (typeof value == "undefined")
            value = 1
        else
        {
            if (value >= maxRepetitions)
            {
                node.style.display = "none"

                GM.deleteValue(videoUrl)
                GM.setValue("hide::"+videoUrl,"")
                return
            }

            value++
        }

        GM.setValue(videoUrl, value)
    }

}