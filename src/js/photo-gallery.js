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

        jpvs.addGestureListener(div, null, onGesture);

        //Show the image
        var img = Utils.appendCentered(div, tileObject.cachedImage || tileObject.cachedImageFast);
        increaseResolutionIfNeeded();

        var isZoomed = false;

        function onGesture(e) {
            if (e.isTap)
                div.remove();
            else if (e.isZoom) {
                //Container size
                var W = div.width();
                var H = div.height();

                //Image position
                var pos = img.position();
                var x = pos.left;
                var y = pos.top;

                //Image size
                var w = img.width();
                var h = img.height();

                //Zoom around the point of the image that is closest to the center of screen (x0, y0)
                var x0 = W / 2;
                var y0 = H / 2;

                var rel_x0 = x0 - x;
                var rel_y0 = y0 - y;

                //Clip (x0, y0) into the image (closest-to-(x0, y0) point of image)
                rel_x0 = Math.max(0, Math.min(w, rel_x0));
                rel_y0 = Math.max(0, Math.min(h, rel_y0));
                x0 = x + rel_x0;
                y0 = y + rel_y0;

                //Now we know around where to zoom.
                //Let's zoom
                var k = e.zoomFactor;
                w *= k;
                h *= k;
                x = x0 - k * rel_x0;
                y = y0 - k * rel_y0;

                img.css({
                    left: x + "px",
                    top: y + "px",
                    width: w + "px",
                    height: h + "px"
                });

                //Determine if image is zoomed (bigger than screen)
                isZoomed = (w > W || h > H);
            }
            else if (e.isDrag) {
                if (isZoomed) {
                    //If the image is in a zoomed state, then drag it around
                    var pos = img.position();
                    var top = e.dragY + pos.top;
                    var left = e.dragX + pos.left;

                    img.css({
                        top: top + "px",
                        left: left + "px"
                    });
                }
            }
            else if (e.isEndDrag && !isZoomed) {
                //If we are not in a zoomed state, then move to next/previous tile
                var threshold = div.width() / 4;
                if (e.totalDragX > threshold) {
                    //Go to previous tile
                    goToNextPrevImage("P");
                }
                else if (e.totalDragX < -threshold) {
                    //Go to next tile
                    goToNextPrevImage("N");
                }
            }
            else if (e.isEndZoom) {
                //At the end of a zooming gesture, let's ensure the image is fine enough
                increaseResolutionIfNeeded();
            }
        }

        function goToNextPrevImage(direction) {
            while (true) {
                //Move
                if (direction == "N")
                    tileObject = tileObject.getNextTile();
                else if (direction == "P")
                    tileObject = tileObject.getPreviousTile();
                else
                    div.remove();

                if (!tileObject) {
                    //End
                    div.remove();
                    return;
                }

                //If image, then remove old image and show new
                if (tileObject.cachedImage) {
                    img.remove();
                    img = Utils.appendCentered(div, tileObject.cachedImage || tileObject.cachedImageFast);
                    increaseResolutionIfNeeded();
                    isZoomed = false;
                    return;
                }
            }
        }

        function increaseResolutionIfNeeded() {
            var imgNaturalWidth = img[0].naturalWidth;
            var imgWidth = img.width();

            if (imgWidth <= imgNaturalWidth) {
                //Resolution is enough for now
                return;
            }

            //Let's fetch a finer-resolution preview or the original image, if necessary
            //We want to see at least imgWidth pixels without blurring
            var key = Utils.findPreview(tileObject.key, tileObject.previews, imgWidth);
            var newImg = Utils.loadImage(key);
            Utils.progress(newImg);

            newImg.then(function (newImg) {
                //Substitute the current "img" and preserve its position/size attributes
                var pos = img.css("position");
                var top = img.css("top");
                var left = img.css("left");
                var width = img.css("width");
                var height = img.css("height");

                //Put newImg
                var oldImg = img;
                div.prepend(newImg);
                img = $(newImg);

                //Keep sizes and coords
                img.css({
                    position: pos,
                    top: top,
                    left: left,
                    width: width,
                    height: height
                });

                //Remove "img"
                oldImg.fadeOut(function () { oldImg.remove(); });
            });
        }
    }

    //Exports
    return {
        show: show
    };
})();
