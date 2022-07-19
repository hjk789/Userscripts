// ==UserScript==
// @name            Facebook Posts Filter
// @version         0.1.0
// @description     Filter the posts in your feed with keywords, and also hide all ads.
// @author          BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @copyright       2022+, BLBC (github.com/hjk789, greasyfork.org/users/679182-hjk789)
// @homepage        https://github.com/hjk789/Userscripts/tree/master/Facebook-Posts-Filter
// @license         https://github.com/hjk789/Userscripts/tree/master/Facebook-Posts-Filter#license
// @match           https://www.facebook.com
// @match           https://www.facebook.com/?*
// @grant           none
// ==/UserScript==

const filters =
[
    // Guide:
    //[
    //    [
    //        ["keyword" or /regex/insensitive]
    //    ], "where in the post to look for", "whether all regexes/keywords must match (AND) or just any one (OR)", "filter name (press Ctrl+Shift+J to view all matched posts and what filters matched)"
    //],
    [
        [
            [/rumour/i]
        ], "content", "OR", "hide posts containing 'rumour' anywhere (regardless whether it's uppercase or lowercase), except in the author's name"
    ],
    [
        [
            [/\b(promises|might have)/i],
            [/trailer/i, "NOT"]
        ], "title", "AND", "filter out posts with unclear possibilities in the title, except trailers"
    ],
    [
        [
            ["www.example.com/irrelevant-category"]
        ], "url", "OR", "hide posts that link to somewhere you find irrelevant"
    ],
    [
        [
            ["Some Page"],
            ["reviews"]
        ], "author+body+title+url+imgDesc", "AND", "hide reviews posted by the 'Some Page' page, searching everywhere in the post for the word 'review' in lowercase"
    ],
    [
        [
            [/covid/i]
        ], "all", "OR", "hide posts which contain 'covid' anywhere in the post, regardless of the case"
    ],
    [
        [
            ["May be an image of one person"]
        ], "imgDesc", "OR", "hide posts which the image description say it's of one person"
    ]
]



const feedObserver = new MutationObserver(function(mutations)
{
    for (let i=0; i < mutations.length; i++)
    {
        if (mutations[i].addedNodes)
        {
            for (let j=0; j < mutations[i].addedNodes.length; j++)
            {
                const post = mutations[i].addedNodes[j]

                processPost(post)
            }
        }
    }
})

const feed = document.querySelector("[role='feed']")

feedObserver.observe(feed, {childList: true})

for (let i=1; i<feed.children.length-3; i++)
	processPost(feed.children[i])


function processPost(post)
{
    if (post.innerHTML == "")
        return

    console.log(post)

    const a = post.querySelector("a")

    if (a && a.href.length > 340)
    {
         hidePost(post)
         return false
    }

    const targetElems =
    {
        "author" : post.querySelector("a strong span, strong a span span")?.textContent,
        "body"   : post.querySelector("div span[dir] > div")?.textContent, //span div div[dir]
        "title"  : post.querySelector("span span[dir], div:last-child > div > div > div > div+div > span > span")?.textContent,
        "url"    : post.querySelector("[rel^=nofollow]")?.href,
        "imgDesc": post.querySelector("a img, div:last-child > img")?.alt
    }

    if (targetElems.url)
        targetElems.url = unescape(targetElems.url)

    for (let i=0; i < filters.length; i++)
    {
        const regexs = filters[i][0]
        let targetNames = filters[i][1].split("+")
        const operator = filters[i][2]
        const filterName = filters[i][3]
        let matched

        if (targetNames[0] == "content")
            targetNames = Object.keys(targetElems).splice(1)
        else if (targetNames[0] == "all")
            targetNames = Object.keys(targetElems)


        for (let j=0; j < regexs.length; j++)
        {
            const regex = regexs[j][0]
            const negate = regexs[j][1]
            matched = false

            for (let k=0; k < targetNames.length; k++)
            {
                const target = targetElems[targetNames[k]]

                if (!target)
                    continue

                const resTarget = target.match(regex)

                if (resTarget)
                {
                    console.log("target: "+target)
                    console.log("match: "+resTarget[0])

                    if (operator == "OR")
                    {
                        console.log("filter OR: "+filterName)
                        hidePost(post)
                        return //true
                    }
                    else
                    {
                        matched = true
                        break
                    }
                }
            }

            if (negate)
            {
                matched = !matched
                console.log("NOT: "+regex)
            }

            if (operator == "AND" && !matched)
                break
        }

        if (matched)
        {
            console.log("filter AND: "+filterName)
            hidePost(post)
            return //true
        }
    }
}

function hidePost(post)
{
    post.style.display = "none"
}