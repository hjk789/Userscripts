const collapsables = document.querySelectorAll(".collapsable")
const heights = [ "400px", "430px" ]

for (let i=0; i < collapsables.length; i++)
{
    const elem = collapsables[i]

    elem.firstElementChild.onclick = function()
    {
        if (elem.className == "expanded")
        {
            elem.lastElementChild.style.display = 'none'
            elem.className = ""

            if (!document.querySelectorAll(".expanded").length)
                document.documentElement.style.height = "280px"
            else if (document.documentElement.style.height == "480px")
                document.documentElement.style.height = "360px"
        }
        else
        {
            elem.lastElementChild.style.display = "block"
            elem.className = "expanded"

            if (+document.documentElement.style.height.split("px")[0] <= 360)
            {
                if (elem.id == "open-website")
                    document.documentElement.style.height = "360px"
                //else
                    //document.documentElement.style.height = "480px"
            }
        }
    }

    elem.lastElementChild.onclick = ()=> event.stopPropagation()
}