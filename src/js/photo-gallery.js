/// <reference path="jpvs-all.js" />
/// <reference path="jpvs-doc.js" />
/// <reference path="utils.js" />

var PhotoGallery = (function () {

    function show(tileObject) {
        //Create a full-viewport div
        var div = jpvs.writeTag("body", "div").css({
            position: "fixed",
            top: "0px",
            left: "0px",
            right: "0px",
            bottom: "0px",
            "z-index": 100000,
            "background-color": "#000"
        });

        div.click(function () {
            div.remove();
        });

        //Show the image
        var img = tileObject.cachedImage;
        var $img = $(tileObject.cachedImage).clone();
        div.append($img);

        //Resize it properly
        var w = img.naturalWidth;
        var h = img.naturalHeight;

        var W = div.width();
        var H = div.height();

        var kx = W / w;
        var ky = H / h;
        var k = Math.min(kx, ky);
        k = Math.min(1, k);

        w *= k;
        h *= k;

        var x = (W - w) / 2;
        var y = (H - h) / 2;

        $img.css({
            position: "fixed",
            top: y + "px",
            left: x + "px",
            width: w + "px",
            height: h + "px"
        });
    }

    //Exports
    return {
        show: show
    };
})();
