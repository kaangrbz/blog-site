let article = document.getElementById('article');
function addElement(classname) {
    switch (classname) {
        case 'texttitle':
            article.value += '<div class="texttitle">   a\n\t  <a href=""> \n\n\t </a>\n </div>\n';
            break;
        case 'textvideo':
            article.value += '<div class="textvideo"> \n\t<iframe src=" " allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen=""> \t</iframe>\n</div>\n';;
            break;
        case 'textp': 
            article.value += '<div class="textp"> \n\t<p>\n\n\t </p>\n</div>\n';
            break;
        case 'textimg':
            article.value += '<img class="textimg" loading="lazy" src="" alt="Error" />';
            break;
        case 'textcode':
            article.value += '<div class="textcode"> \n\t<pre id="MainContent"> <code class="language-"> </code></pre>\n</div>';
            break;
        case 'textquote':
            article.value += '<div class="textquote">\n\t<i class="fas quoteicon"></i> \n\t<blockquote>\n\t</blockquote>\n\t<i class="quoteauthor">Cem Karaca</i>\n</div>';
            break;
        default:
            article.value += '??';
            break;
    }
}