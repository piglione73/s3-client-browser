package com.paviasystem.scaleawsimages;

import java.awt.Image;
import java.awt.image.BufferedImage;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.imageio.ImageIO;

public class ScaleImages {

	public static void main(String[] args) {
		try {
			Map<String, List<String>> images = ListBucket.stream().filter(ScaleImages::isImage).collect(Collectors.groupingBy(ScaleImages::getUnscaledKey));
			Map<String, List<String>> imagesToBeScaled = images.entrySet().stream().filter(x -> x.getValue().size() == 1).collect(Collectors.toMap(x -> x.getKey(), x -> x.getValue()));
			imagesToBeScaled.entrySet().forEach(ScaleImages::scaleImage);
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

	private static void scaleImage(Map.Entry<String, List<String>> entry) {
		String imageKey = entry.getKey();

		// Load image
		System.out.println("Loading " + imageKey);
		try (InputStream imgBytes = BucketFiles.load(imageKey)) {
			BufferedImage img = ImageIO.read(imgBytes);

			// Scale
			Image img800 = img.getScaledInstance(800, -1, Image.SCALE_SMOOTH);
			Image img400 = img800.getScaledInstance(400, -1, Image.SCALE_SMOOTH);
			Image img200 = img800.getScaledInstance(200, -1, Image.SCALE_SMOOTH);
			Image img100 = img800.getScaledInstance(100, -1, Image.SCALE_SMOOTH);

			// Save
			BucketFiles.save(imageKey + "$800", img800);
			BucketFiles.save(imageKey + "$400", img400);
			BucketFiles.save(imageKey + "$200", img200);
			BucketFiles.save(imageKey + "$100", img100);
		} catch (Exception exc) {
			exc.printStackTrace();
		}

	}

}
