// ==UserScript==
// @name            Reddit Distributed Top Posts
// @version         0.1.0
// @description     An alternative, account-less, media-only and minimalist feed for Reddit that lists the top posts from all the specified subreddits equally, regardless of the community's size. Even if the sub is small it will appear in the same frequency as all other subs.
// @author          BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @copyright       2022+, BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @homepage        https://github.com/hjk789/Userscripts/tree/master/Reddit-Distributed-Top-Posts
// @license         https://github.com/hjk789/Userscripts/tree/master/Reddit-Distributed-Top-Posts#license
// @match           https://*.reddit.com/
// @grant           none
// ==/UserScript==


//*********** SETTINGS ***********

const subs = ["funny", "videos", "aww"]     // The list of subreddits to gather the posts from. You must use the sub's id (the one after the r/). 
                                            // You can specify as many communities as you want, you just need to follow the syntax ["Sub1", "Sub2"] 

const maxQuality = 720                      // Reddit provides multiple resolutions for the same video or image. The script will load the videos and images 
                                            // in a quality as close as possible to the one you specified. Accepted qualities are 240, 360, 480, 720 and 1080.
//********************************



main()

async function main()
{	
	const responsesPerSub = []

	for (let i=0; i < subs.length; i++)
    {
        await new Promise(resolve =>
		{
            const xhr = new XMLHttpRequest()
            xhr.open("GET", "https://gateway.reddit.com/desktopapi/v1/subreddits/"+subs[i]+"?t=day&sort=top")
            xhr.onload = function()
            {
                const response = JSON.parse(xhr.responseText)

                response.postIds = response.postIds.filter((a)=> !a.includes("="))

                responsesPerSub.push(response)

                resolve()
            }
            xhr.send()
        })
    }


	const container = document.createElement("div")
	container.style = "position: fixed; z-index: 999; inset: 0px; margin: auto; height: 100vh; width: min(900px,100vw); overflow-y: scroll; background: white;"
	document.body.appendChild(container)

	const style = "max-width: calc(100% - 6px); max-height: min(100vh,720px); object-fit: contain; inset: 0; margin: 15px auto; border: 3px lightgray solid; border-radius: 25px; display: block;"

	for (let i=0; i < 30; i++)
	{
		for (let j=0; j < responsesPerSub.length; j++)
		{
			const response = responsesPerSub[j]

			const post = response.posts[response.postIds[i]]

			if (!post || !post.media || post.media.type == "text")
				continue

			if (post.media.type == "image")
			{
				let mediaUrl = post.media.content

				if (post.media.height > maxResolution)
				{
					for (let k=0; k < post.media.resolutions.length; k++)
					{
						if (post.media.resolutions[k].height > maxResolution)
						{
							mediaUrl = post.media.resolutions[k].url
							break
						}
					}
				}

				const img = document.createElement("img")
				img.src = mediaUrl
				img.style = style
				img.onload = ()=> checkAndResize(this)
				container.appendChild(img)
			}
			else if (post.media.type == "gallery")
			{
				Object.getOwnPropertyNames(post.media.mediaMetadata).forEach((p)=>
				{
					let mediaUrl = post.media.mediaMetadata[p].s.u

					if (post.media.mediaMetadata[p].s.y > maxResolution)
					{
						for (let k=0; k < post.media.mediaMetadata[p].p.length; k++)
						{
							if (post.media.mediaMetadata[p].p[k].y > maxResolution)
							{
								mediaUrl = post.media.mediaMetadata[p].p[k].u
								break
							}
						}
					}

					const img = document.createElement("img")
					img.src = mediaUrl
					img.style = style
					img.onload = ()=> checkAndResize(this)
					container.appendChild(img)
				})
			}
			else if (post.media.type == "video" || post.media.type == "gifvideo")
			{
				const isGifv = post.media.type == "gifvideo"
				const videoRoot = isGifv ? post.media.videoPreview : post.media

				const video = document.createElement("video")
				video.src = videoRoot.scrubberThumbSource.replace("_96.", (videoRoot.height > maxResolution ? "_"+ maxResolution +"." : "_"+videoRoot.height+"."))
				video.style = style
				video.controls = true
				video.onloadeddata = ()=> checkAndResize(this, true)

				if (!isGifv)
				{
					video.onplay = ()=> { audio.play(); audio.currentTime = video.currentTime }
					video.onpause = ()=> audio.pause()

					const audio = document.createElement("audio")
					audio.src = post.media.scrubberThumbSource.replace("_96.", "_audio.")
					container.appendChild(audio)
				}

				container.appendChild(video)
			}
			else
			{
				const iframe = document.createElement("iframe")
				iframe.src = post.media.content
				iframe.style = style
				iframe.style.height = post.media.height+4 +"px"
				iframe.width = post.media.width
				container.appendChild(iframe)
			}
		}
	}

    function checkAndResize(element, isVideo)
    {
        if (screen.width + screen.height > 1400)
        {
            if ((isVideo ? element.videoWidth + element.videoHeight : element.naturalWidth + element.naturalHeight) < 1090)
            	element.style.height = "65vh"
        }
        else if (screen.width < screen.height)
            element.style.width = "98%"
    }
}