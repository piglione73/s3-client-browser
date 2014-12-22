package com.paviasystem.scaleawsimages;

import java.awt.image.BufferedImage;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.imageio.ImageIO;

public class ScaleImages {

	public static void main(String[] args) {
		try {
			// List all images, grouped by "unscaled key" (i.e., the original
			// image file name)
			Map<String, List<String>> images = ListBucket.stream().filter(ScaleImages::isImage).collect(Collectors.groupingBy(ScaleImages::getUnscaledKey));

			// Determine groups which have less than five elements (i.e., which
			// don't have all 4 scaled-down versions)
			Map<String, List<String>> imagesToBeScaled = images.entrySet().stream().filter(x -> x.getValue().size() < 5).collect(Collectors.toMap(x -> x.getKey(), x -> x.getValue()));

			// Scale them in parallel, so we go full-CPU-power
			System.out.println("Found " + imagesToBeScaled.size() + " images to be scaled");
			imagesToBeScaled.keySet().parallelStream().forEach(ScaleImages::scaleImage);
		} catch (Exception exc) {
			exc.printStackTrace();
		}
	}

	private static boolean isImage(String key) {
		key = key.toLowerCase();
		return key.endsWith(".jpg") || key.endsWith(".jpeg") || key.endsWith(".png") || key.endsWith(".gif");
	}

	private static String getUnscaledKey(String key) {
		// The part before "$" is the unscaled key; previews/scaled versions
		// have the $ sign
		int i = key.indexOf('$');
		if (i < 0)
			return key;
		else
			return key.substring(0, i);
	}

	private static void scaleImage(String imageKey) {
		// Load image
		System.out.println("Loading " + imageKey);
		try (InputStream imgBytes = BucketFiles.load(imageKey)) {
			BufferedImage img = ImageIO.read(imgBytes);

			// Aspect ratio
			int w = img.getWidth();
			int h = img.getHeight();
			double k = (double) h / w;

			// Save, scaled
			BucketFiles.save(imageKey + "$800.jpg", img, 800, 800 * k);
			BucketFiles.save(imageKey + "$400.jpg", img, 400, 400 * k);
			BucketFiles.save(imageKey + "$200.jpg", img, 200, 200 * k);
			BucketFiles.save(imageKey + "$100.jpg", img, 100, 100 * k);
		} catch (Exception exc) {
			exc.printStackTrace();
		}

	}

}
