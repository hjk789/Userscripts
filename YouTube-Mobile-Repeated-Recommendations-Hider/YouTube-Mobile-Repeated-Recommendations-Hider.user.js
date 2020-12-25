// ==UserScript==
// @name            YouTube Mobile Repeated Recommendations Hider
// @description     Hides any videos that are recommended more than 2 times at the mobile homepage
// @version         1.2
// @author          BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @copyright       2020+, BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @homepage        https://github.com/hjk789/Creations/tree/master/Userscripts/YouTube-Mobile-Repeated-Recommendations-Hider
// @license         https://github.com/hjk789/Creations/tree/master/Userscripts/YouTube-Mobile-Repeated-Recommendations-Hider#license
// @match           https://m.youtube.com
// @grant           GM.setValue
// @grant           GM.getValue
// ==/UserScript==

main()

async function main()
{
    let titlesList = document.getElementsByClassName("large-media-item-metadata")

    while (titlesList.length > 0)
    {
        let videoTitle = titlesList[0].firstChild.firstChild
        let videoTitleText = videoTitle.textContent

        let value = await GM.getValue(videoTitleText)

        if (typeof value == "undefined")
            value = 1
        else
        {
            if (value >= 2)
            {
                let videoItem = videoTitle.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement
                videoItem.style.display = "none"
            }

            value++
        }

        titlesList[0].className = ""

        GM.setValue(videoTitleText, value)
    }

    setTimeout(() => main(), 500)
}