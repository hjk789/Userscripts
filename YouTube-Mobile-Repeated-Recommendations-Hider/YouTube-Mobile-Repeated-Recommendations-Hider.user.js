// ==UserScript==
// @name            YouTube Mobile Repeated Recommendations Hider
// @description     Hides any videos that are recommended more than 2 times at the mobile homepage
// @version         1.3
// @author          BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @copyright       2020+, BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @homepage        https://github.com/hjk789/Creations/tree/master/JavaScript/Userscripts/YouTube-Mobile-Repeated-Recommendations-Hider
// @license         https://github.com/hjk789/Creations/tree/master/JavaScript/Userscripts/YouTube-Mobile-Repeated-Recommendations-Hider#license
// @match           https://m.youtube.com
// @grant           GM.setValue
// @grant           GM.getValue
// ==/UserScript==

const recommendationsContainer = document.querySelector(".rich-grid-renderer-contents")

const firstVideos = recommendationsContainer.querySelectorAll("ytm-rich-item-renderer")

for (let i=0; i<firstVideos.length; i++)
    processRecommendation(firstVideos[i])


const loadedRecommendedVideosObserver = new MutationObserver(function(mutations) {
	mutations.forEach(function(mutation) {
		processRecommendation(mutation.addedNodes[0])
	})
})

loadedRecommendedVideosObserver.observe(recommendationsContainer, {childList: true})


async function processRecommendation(node)
{
    if (!node) return
    
    const videoTitleText = node.querySelector("h3").textContent

    let value = await GM.getValue(videoTitleText)

    if (typeof value == "undefined")
        value = 1
    else
    {
        if (value >= 1)
            node.style.display = "none"

        value++
    }

    GM.setValue(videoTitleText, value)
}