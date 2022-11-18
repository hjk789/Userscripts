// ==UserScript==
// @name            Reddit Distributed Top Posts
// @version         0.1.0
// @description     An alternative, account-less, media-only and minimalist feed for Reddit that lists the top posts from all the specified subreddits equally, regardless of the community's size. Even if the sub is small it will appear in the same frequency as all other subs.
// @author          BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @copyright       2022+, BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @homepage        https://github.com/hjk789/Userscripts/tree/master/Reddit-Distributed-Top-Posts
// @license         https://github.com/hjk789/Userscripts/tree/master/Reddit-Distributed-Top-Posts#license
// @match           https://*.reddit.com/
// @include         /https://\w+\.reddit\.com/(r|user)/\w+/?$/
// @grant           none
// ==/UserScript==


//*********** SETTINGS ***********

let subs = ["memes", "gifs", "aww"]         // The list of subreddits to gather the posts from. You must use the sub's id (the one after the r/).
                                            // You can specify as many communities as you want, you just need to follow the syntax ["Sub1", "Sub2"]

let users = []                              // Same as above, but for user pages (the ones at reddit.com/user/<username>).

let timeWindow = "day"                      // The time frame to get the top posts from. Accepted values are "hour", "day", "week", "month", "year" and "alltime".

const maxVideoQuality = 720                 // Reddit provides multiple resolutions for the same video. The script will load the videos in
                                            // the quality you specified (if available). Accepted qualities are 240, 360, 480, 720 and 1080.

const maxImageHeight = 1000                 // Reddit provides multiple resolutions for the same image. You can specify
                                            // any size and the script will load the image in the closest size available.

const includeNSFW = false                   // When false, posts set as NSFW are filtered from the list and won't be included. Set to true to disable the filtering.

//********************************



const responsesPerSource = {}
let loading = false
const duplicateMediaSamples = []

const container = document.createElement("div")
container.style = "position: fixed; z-index: 999; inset: 0px; margin: auto; height: 100vh; width: min(900px,100vw); overflow-y: scroll; background: white; text-align: center;"
container.onscroll = async function()
{
    if (!loading && this.scrollTop > this.scrollHeight - window.innerHeight * 4)
    {
        loading = true

        loadNextPage()
    }
}

const timeFrames = ["hour", "day", "week", "month", "year", "alltime"]

const timeWindowContainer = document.createElement("div")
timeWindowContainer.style = "position: sticky; top: 0px; background: white; padding: 4px;"

const label = document.createElement("span")
label.innerText = "Top posts since a "
timeWindowContainer.appendChild(label)

const timeWindowDropdown = document.createElement("select")
timeWindowDropdown.onchange = function() 
{
    timeWindow = this.value
    duplicateMediaSamples.length = 0
    sourceNames = subs.concat(users)
    
    container.innerHTML = ""
    container.appendChild(timeWindowContainer)
    timeWindowDropdown.value = timeWindow
    
    loadPosts()    
}

for (let i=0; i < timeFrames.length; i++)
{
    const option = document.createElement("option")
    option.value = timeFrames[i]
    option.innerText = timeFrames[i].charAt(0).toUpperCase() + timeFrames[i].slice(1)
    timeWindowDropdown.appendChild(option)
}

timeWindowDropdown.value = timeWindow

timeWindowContainer.appendChild(timeWindowDropdown)
container.appendChild(timeWindowContainer)
      
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

}, {threshold: 0.8})


if (/\/(r|user)\//.test(location.pathname))
{
    const subOrUserName = location.pathname.split("/")[2]

    if (location.pathname.includes("/user/"))
    {
        subs = []
        users = [subOrUserName]
    }
    else
    {
        subs = [subOrUserName]
        users = []
    }
}


let sourceNames = subs.concat(users)
const pageSize = sourceNames.length == 1 ? 10 : 3

loadPosts()



async function loadPosts()
{
    for (let i=0; i < subs.length; i++)
        responsesPerSource[subs[i]] = { type: "subreddit:", response: await fetchSubredditPostsPromise("subreddit:"+subs[i]) }
    
    for (let i=0; i < users.length; i++)
        responsesPerSource[users[i]] = { type: "author:", response: await fetchSubredditPostsPromise("author:"+users[i]) }

    processPosts()
}

function fetchSubredditPostsPromise(sourceUrlString, after)
{
    return new Promise(resolve => fetchSubredditPosts(sourceUrlString, after, resolve))
}

function fetchSubredditPosts(sourceUrlString, after, resolve)
{
    const xhr = new XMLHttpRequest()
    xhr.open("GET", "/search.json?q="+(!includeNSFW ? "nsfw:no+" : "")+sourceUrlString+"&limit="+pageSize+"&sort=top&t="+timeWindow+"&after="+after)
    xhr.onload = ()=> resolve(JSON.parse(xhr.responseText.replaceAll("&amp;", "&")))
    xhr.onerror = ()=> setTimeout(()=> fetchSubredditPosts(sourceUrlString, after, resolve), 5000)

    xhr.send()
}

function processPosts()
{
    const style = "max-width: calc(100% - 6px); max-height: min(92vh,720px); object-fit: contain; inset: 0; margin: 15px auto; border: 3px lightgray solid; border-radius: 25px; display: block;"
    let postPromises = []

    for (let i=0; i < pageSize; i++)
    {
        for (let j=0; j < sourceNames.length; j++)
        {
            postPromises.push(new Promise((resolve)=>
            {
                const response = responsesPerSource[sourceNames[j]].response
                let post = response.data.children[i]?.data
                let crosspost

                if (post && post.crosspost_parent_list)
                {
                    crosspost = post
                    post = post.crosspost_parent_list[0]
                }

                if (!post || post.is_self && !post.preview && !post.media || post.media && ["twitter.com", "youtube.com"].includes(post.media.type))
                    return resolve()

                if (post.media?.reddit_video || post.preview?.reddit_video_preview || post.preview?.images[0].variants.mp4)
                {
                    const videoRoot = post.preview.reddit_video_preview || post.media?.reddit_video
                    let videoUrl              

                    if (videoRoot)
                        videoUrl = videoRoot.height > maxVideoQuality ? videoRoot.scrubber_media_url.replace("_96.", "_"+maxVideoQuality+".") : videoRoot.fallback_url
                    else
                        videoUrl = post.preview.images[0].variants.mp4.source.url

                    const xhr = new XMLHttpRequest()
                    xhr.open('GET', videoUrl)
                    xhr.onload = function()
                    {
                        const hash = stringToHash(this.response)

                        if (duplicateMediaSamples.includes(hash))
                            return resolve()

                        duplicateMediaSamples.push(hash)

                        const video = document.createElement("video")
                        video.src = videoUrl
                        video.style = style
                        video.controls = true
                        video.onloadeddata = function() { checkAndResize(this, true) }
                        container.appendChild(video)

                        if (post.is_video)
                        {
                            const audio = document.createElement("audio")
                            audio.src = videoRoot.scrubber_media_url.replace("_96.", "_audio.")
                            container.appendChild(audio)

                            video.onplay = ()=> { audio.play(); audio.currentTime = video.currentTime }
                            video.onpause = ()=> audio.pause()
                        }

                        onViewObserver.observe(video)

                        createPostMetadata(post, crosspost, container)

                        resolve()
                    }
                    xhr.send()
                }
                else if (/\.(jpg|png)/.test(post.url) || post.domain == "imgur.com") //post.domain == "i.redd.it" ||
                {
                    if (post.preview)
                    {
                        const image = post.preview.images[0]
                        let mediaUrl = image.source.url

                        if (image.source.height > maxImageHeight)
                        {
                            for (let k=0; k < image.resolutions.length; k++)
                            {
                                if (image.resolutions[k].height > maxImageHeight)
                                {
                                    mediaUrl = image.resolutions[k].url
                                    break
                                }
                            }
                        }

                        const xhr = new XMLHttpRequest()
                        xhr.open('GET', mediaUrl)
                        xhr.onload = function()
                        {
                            const hash = stringToHash(this.response)

                            if (duplicateMediaSamples.includes(hash))
                                return resolve()

                            duplicateMediaSamples.push(hash)

                            const img = document.createElement("img")
                            img.src = mediaUrl
                            img.style = style
                            img.onload = function() { checkAndResize(this) }
                            container.appendChild(img)

                            createPostMetadata(post, crosspost, container)

                            resolve()
                        }
                        xhr.send()
                    }
                    else
                    {
                        const imageExtensions = ["jpg", "png", "gif"]
                        const videoExtensions = ["gifv", "mp4"]

                        const sourceUrlSplit = post.url.split(".")
                        const sourceExtension = sourceUrlSplit[sourceUrlSplit.length-1]

                        post.url = post.url.replace("https://imgur", "https://i.imgur")

                        const xhr = new XMLHttpRequest()
                        xhr.open('GET', post.url)
                        xhr.onload = function()
                        {
                            const hash = stringToHash(this.response)

                            if (duplicateMediaSamples.includes(hash))
                                return resolve()

                            duplicateMediaSamples.push(hash)

                            if (imageExtensions.includes(sourceExtension))
                            {
                                const img = document.createElement("img")
                                img.src = post.url
                                img.style = style
                                img.onload = function() { checkAndResize(this) }
                                container.appendChild(img)
                            }
                            else if (videoExtensions.includes(sourceExtension))
                            {
                                const video = document.createElement("video")
                                video.src = post.url.replace("gifv", "mp4")
                                video.style = style
                                video.controls = true
                                video.onloadeddata = function() { checkAndResize(this, true) }
                                container.appendChild(video)

                                onViewObserver.observe(video)
                            }

                            createPostMetadata(post, crosspost, container)

                            resolve()
                        }
                        xhr.send()
                    }
                }
                else if (post.is_gallery || post.url.includes("/gallery/"))
                {
                    const mediaUrls = []

                    Object.getOwnPropertyNames(post.media_metadata).forEach((p)=>
                    {
                        const mediaMetadata = post.media_metadata[p]
                        let mediaUrl = mediaMetadata.s.u

                        if (mediaMetadata.s.y > maxImageHeight)
                        {
                            for (let k=0; k < mediaMetadata.p.length; k++)
                            {
                                if (mediaMetadata.p[k].y > maxImageHeight)
                                {
                                    mediaUrl = mediaMetadata.p[k].u
                                    break
                                }
                            }
                        }

                        mediaUrls.push(mediaUrl)
                    })

                    const imagesPromises = []

                    for (let k=0; k < mediaUrls.length; k++)
                    {
                        imagesPromises.push(new Promise((resolveImg,reject) =>
                        {
                            const xhr = new XMLHttpRequest()
                            xhr.open('GET', mediaUrls[k])
                            xhr.onload = function()
                            {
                                const hash = stringToHash(this.response)

                                if (duplicateMediaSamples.includes(hash))
                                    return reject()

                                duplicateMediaSamples.push(hash)

                                resolveImg()
                            }
                            xhr.send()
                        }))
                    }

                    Promise.all(imagesPromises).then(()=>
                    {
                        for (let k=0; k < mediaUrls.length; k++)
                        {
                            const img = document.createElement("img")
                            img.src = mediaUrls[k]
                            img.style = style
                            img.onload = function() { checkAndResize(this) }
                            container.appendChild(img)
                        }

                        createPostMetadata(post, crosspost, container)

                        resolve()
                    })
                }
                else{ 
                    console.log(post)
                    resolve()
                }

            }))
        }
    }

    /*Promise.all(postPromises).then(()=>
    {
        if (container.children.length < 13)
        { console.log(container.children); alert(container.children.length);}
    })*/

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
    for (let i=0; i < sourceNames.length; i++)
    {
        const response = responsesPerSource[sourceNames[i]]

        if (!response.response.data.after)
        {
            delete responsesPerSource[sourceNames[i]]
            sourceNames.splice(i, 1)
            i--
            continue
        }

        response.response = await fetchSubredditPostsPromise(response.type + sourceNames[i], response.response.data.after)
    }

    if (sourceNames.length)
        processPosts()

    loading = false
}

function createPostMetadata(post, crosspost, container)
{
    if (crosspost)
        post = crosspost
    
    const subname = document.createElement("a")
    subname.style = "margin-top: -10px; margin-right: 50px; display: ruby-text;"
    subname.innerText = post.subreddit_name_prefixed
    subname.href = "/./"+subname.innerText
    container.appendChild(subname)  

    const username = document.createElement("a")
    username.style = "margin-top: -10px; margin-right: 50px; display: ruby-text;"
    username.innerText = "u/"+post.author
    username.href = "/"+username.innerText
    container.appendChild(username)

    const commentCount = document.createElement("a")
    commentCount.style = "margin-top: -10px; display: ruby-text;"
    commentCount.innerText = post.num_comments +" comments"
    commentCount.href = post.permalink
    container.appendChild(commentCount)
}

function stringToHash(string)
{
    let hash = 0

    for (let i=0; i < string.length; i++)
    {
        const char = string.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash &= hash
    }

    return new Uint32Array([hash])[0].toString(36)
}
