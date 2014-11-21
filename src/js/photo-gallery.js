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
        Utils.appendCentered(div, tileObject.cachedImage);
    }

    //Exports
    return {
        show: show
    };
})();
