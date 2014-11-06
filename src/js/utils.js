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

    exports.progress = function (callback) {
        jpvs.showDimScreen(0, 100, template);

        return function () {
            jpvs.hideDimScreen();
            callback.apply(null, arguments);
        };

        function template() {
            this.removeClass("DimScreen").addClass("Progress");
        }
    };

    return exports;
})();
