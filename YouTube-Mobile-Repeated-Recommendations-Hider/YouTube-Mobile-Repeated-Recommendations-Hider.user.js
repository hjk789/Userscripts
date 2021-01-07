// ==UserScript==
// @name            YouTube Mobile Repeated Recommendations Hider
// @description     Hides any videos that are recommended more than 2 times at the mobile homepage
// @version         1.7
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

//**********************

const maxRepetitions = 2    // The maximum number of times that the same recommended video is allowed to appear on your
                            // homepage before starting to get hidden. Set this to 1 if you want one-time recommendations.
//**********************

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
                                       
        GM.listValues().then(function(GmList) 
        {
            processedVideosList = GmList

            const recommendationsContainer = document.querySelector(".rich-grid-renderer-contents")

            const firstVideos = recommendationsContainer.querySelectorAll("ytm-rich-item-renderer")

            for (let i=0; i < firstVideos.length; i++)
                processRecommendation(firstVideos[i])


            const loadedRecommendedVideosObserver = new MutationObserver(function(mutations) 
            {
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
    const videoTitleText = videoTitleEll.textContent.toLowerCase()
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
        if (maxRepetitions == 1)
        {
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