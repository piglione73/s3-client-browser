/// <reference path="jpvs-all.js" />
/// <reference path="jpvs-doc.js" />

var Utils = (function () {
    var exports = {};

    exports.loadParamsFromStorage = function () {
        try {
            var params = localStorage["ConnectionParameters"];
            var arr = (params || "").split("|");

            return {
                bucketName: arr[0] || "",
                accessKeyId: arr[1] || "",
                secretAccessKey: arr[2] || "",
                region: arr[3] || "",
                root: arr[4] || ""
            };
        }
        catch (e) {
            return {};
        }
    };

    exports.saveParamsIntoStorage = function (connectionParameters) {
        var arr = [connectionParameters.bucketName, connectionParameters.accessKeyId, connectionParameters.secretAccessKey, connectionParameters.region, connectionParameters.root];
        try {
            localStorage["ConnectionParameters"] = arr.join("|");
        }
        catch (e) {
        }
    };

    exports.progress = function (asyncValue) {
        //Keep the dimscreen until the given asyncValue is ready
        jpvs.showDimScreen(0, 100, template);

        asyncValue.then(function () {
            jpvs.hideDimScreen();
        });

        function template() {
            this.removeClass("DimScreen").addClass("Progress");
        }
    };

    exports.appendCentered = function (div, img) {
        //Image size
        var w = img.naturalWidth;
        var h = img.naturalHeight;

        //Container size
        var W = div.width();
        var H = div.height();

        //Zoom factor to apply to the image
        var kx = W / w;
        var ky = H / h;
        var k = Math.min(kx, ky);

        //We only want to shrink, not magnify
        k = Math.min(1, k);

        //Shrink
        w *= k;
        h *= k;

        //Clone, append and center
        var clonedImg = $(img).clone();
        div.append(clonedImg);

        //Center in container
        var x = (W - w) / 2;
        var y = (H - h) / 2;

        clonedImg.css({
            position: "absolute",
            top: y + "px",
            left: x + "px",
            width: w + "px",
            height: h + "px"
        });
    };

    return exports;
})();
