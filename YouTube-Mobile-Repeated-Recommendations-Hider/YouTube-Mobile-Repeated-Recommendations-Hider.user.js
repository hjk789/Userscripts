// ==UserScript==
// @name			YouTube Mobile Repeated Recommendations Hider
// @description		Hides any videos that are recommended more than 3 times at the mobile homepage
// @version			1.0
// @author			BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @copyright		2020+, BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @homepage		https://github.com/hjk789/Creations/tree/master/Userscripts/YouTube-Mobile-Repeated-Recommendations-Hider
// @license			https://github.com/hjk789/Creations/tree/master/Userscripts/YouTube-Mobile-Repeated-Recommendations-Hider#license
// @match			https://m.youtube.com
// @grant			GM.setValue
// @grant			GM.getValue
// ==/UserScript==

setInterval(function()
{
	let titlesList = document.querySelectorAll(".large-media-item-metadata h3")
	
	for (let i=0; i < titlesList.length; i++)
	{
		let videoTitle = titlesList[i]
		let videoTitleText = videoTitle.textContent

		GM.getValue(videoTitleText).then(function(value)
		{
			if (typeof value == "undefined")
				value = 1
			else
			{
				if (value > 3)
				{
					let videoItem = videoTitle.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement
					videoItem.style.display = "none"					
				}

				value++
			}

            videoTitle.parentElement.parentElement.className = ""

			GM.setValue(videoTitleText, value)
		})
	}
}, 500)