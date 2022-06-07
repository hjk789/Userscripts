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

const subs = ["memes", "gifs", "aww"]       // The list of subreddits to gather the posts from. You must use the sub's id (the one after the r/).
                                            // You can specify as many communities as you want, you just need to follow the syntax ["Sub1", "Sub2"]

const timeWindow = "day"                    // The time window of the top posts. Accepted values are "hour", "day", "week", "month", "year" and "alltime".

const maxQuality = 720                      // Reddit provides multiple resolutions for the same video or image. The script will load the videos and images
                                            // in a quality as close as possible to the one you specified. Accepted qualities are 240, 360, 480, 720 and 1080.
//********************************



const responsesPerSub = []
let loading = false

const container = document.createElement("div")
container.style = "position: fixed; z-index: 999; inset: 0px; margin: auto; height: 100vh; width: min(900px,100vw); overflow-y: scroll; background: white;"
container.onscroll = async function()
{
    if (!loading && this.scrollTop > this.scrollTopMax - window.innerHeight * 3)
    {
        loading = true

        loadNextPage()
    }
}
document.body.appendChild(container)


const onViewObserver = new IntersectionObserver((entries) =>            // when the user actually sees them on the screen, instead of when they are loaded.
{
    entries.forEach(entry =>
    {
        if (entry.isIntersecting)
            entry.target.play()
        else
            entry.target.pause()
    })

}, {threshold: 0.9})


loadPosts()



async function loadPosts()
{
    for (let i=0; i < subs.length; i++)
        responsesPerSub.push(await fetchSubredditPosts(subs[i]))

    processPosts()
}

function fetchSubredditPosts(subName, after)
{
    return new Promise(resolve =>
    {
        const xhr = new XMLHttpRequest()
        xhr.open("GET", "https://gateway.reddit.com/desktopapi/v1/subreddits/"+subName+"?limit=3&sort=top&t="+timeWindow+"&after="+after)
        xhr.onload = function()
        {
            const response = JSON.parse(xhr.responseText)

            response.postIds = response.postIds.filter((a)=> !a.includes("="))

            resolve(response)
        }
        xhr.send()
    })
}

function processPosts()
{
    const style = "max-width: calc(100% - 6px); max-height: min(100vh,720px); object-fit: contain; inset: 0; margin: 15px auto; border: 3px lightgray solid; border-radius: 25px; display: block;"

    for (let i=0; i < 3; i++)
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

                if (post.media.height > maxQuality)
                {
                    for (let k=0; k < post.media.resolutions.length; k++)
                    {
                        if (post.media.resolutions[k].height > maxQuality)
                        {
                            mediaUrl = post.media.resolutions[k].url
                            break
                        }
                    }
                }

                const img = document.createElement("img")
                img.src = mediaUrl
                img.style = style
                img.onload = function() { checkAndResize(this) }
                container.appendChild(img)
            }
            else if (post.media.type == "gallery")
            {
                Object.getOwnPropertyNames(post.media.mediaMetadata).forEach((p)=>
                {
                    let mediaUrl = post.media.mediaMetadata[p].s.u

                    if (post.media.mediaMetadata[p].s.y > maxQuality)
                    {
                        for (let k=0; k < post.media.mediaMetadata[p].p.length; k++)
                        {
                            if (post.media.mediaMetadata[p].p[k].y > maxQuality)
                            {
                                mediaUrl = post.media.mediaMetadata[p].p[k].u
                                break
                            }
                        }
                    }

                    const img = document.createElement("img")
                    img.src = mediaUrl
                    img.style = style
                    img.onload = function() { checkAndResize(this) }
                    container.appendChild(img)
                })
            }
            else if (post.media.type.includes("video") || post.media.type == "embed")
            {
                const isVideo = post.media.type == "video"
                const videoRoot = isVideo ? post.media : post.media.videoPreview
                let videoUrl

                if (!videoRoot)
                    videoUrl = post.media.content
                else
                    videoUrl = videoRoot.scrubberThumbSource.replace("_96.", (videoRoot.height > maxQuality ? "_"+ maxQuality +"." : "_"+videoRoot.height+"."))

                const video = document.createElement("video")
                video.src = videoUrl
                video.style = style
                video.controls = true
                video.onloadeddata = function() { checkAndResize(this, true) }
                video.onerror = function()
                {
                    video.onerror = function()
                    {
                        video.onerror = function()
                        {
                            video.onerror = function() { this.remove() }

                            this.src = this.src.replace(/_\d+\./, "_240.")
                        }

                        this.src = this.src.replace(/_\d+\./, "_360.")
                    }

                    this.src = this.src.replace(/_\d+\./, "_480.")
                }

                if (isVideo)
                {
                    const audio = document.createElement("audio")
                    audio.src = post.media.scrubberThumbSource.replace("_96.", "_audio.")
                    container.appendChild(audio)

                    video.onplay = ()=> { audio.play(); audio.currentTime = video.currentTime }
                    video.onpause = ()=> audio.pause()
                }

                container.appendChild(video)

                onViewObserver.observe(video)
            }

            const commentCount = document.createElement("a")
            commentCount.style = "margin: auto; margin-top: -10px; display: table;"
            commentCount.innerText = post.numComments +" comments"
            commentCount.href = post.permalink
            container.appendChild(commentCount)
        }
    }
}

function checkAndResize(element, isVideo)
{
    if (screen.width + screen.height > 1400)
    {
        if ((isVideo ? element.videoWidth + element.videoHeight : element.naturalWidth + element.naturalHeight) < 1090)
        {
            if ((isVideo ? element.videoHeight / element.videoWidth : element.naturalHeight / element.naturalWidth) > 0.6)
                element.style.height = "65vh"
            else
                element.style.width = "98%"
        }
    }
    else if (screen.width < screen.height)
        element.style.width = "98%"
}

async function loadNextPage()
{
    for (let i=0; i < subs.length; i++)
    {
        if (!responsesPerSub[i].token)
        {
            responsesPerSub.splice(i, 1)
            subs.splice(i, 1)
            i--
            continue
        }

        responsesPerSub[i] = await fetchSubredditPosts(subs[i], responsesPerSub[i].token)
    }

    processPosts()

    loading = false
}
