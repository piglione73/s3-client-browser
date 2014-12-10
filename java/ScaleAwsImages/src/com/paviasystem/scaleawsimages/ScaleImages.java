package com.paviasystem.scaleawsimages;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class ScaleImages {

	public static void main(String[] args) {
		try {
			Map<String, List<String>> images = ListBucket.stream().filter(ScaleImages::isImage).collect(Collectors.groupingBy(ScaleImages::getUnscaledKey));
			Map<String, List<String>> imagesToBeScaled = images.entrySet().stream().filter(x -> x.getValue().size() == 1).collect(Collectors.toMap(x -> x.getKey(), x -> x.getValue()));

			imagesToBeScaled.entrySet().forEach(x -> System.out.println(x.getKey() + "-->" + String.join(", ", x.getValue())));

			System.out.println("Total = " + imagesToBeScaled.size());
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

}
