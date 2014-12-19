package com.paviasystem.scaleawsimages;

import java.awt.Image;
import java.awt.image.RenderedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

import javax.imageio.ImageIO;

import com.amazonaws.services.s3.AmazonS3Client;
import com.amazonaws.services.s3.model.GetObjectRequest;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.services.s3.model.S3Object;

public class BucketFiles {

	private static AmazonS3Client s3 = null;

	private static void ensureS3() {
		if (s3 == null)
			s3 = new AmazonS3Client();
	}

	public static InputStream load(String key) {
		ensureS3();

		S3Object object = s3.getObject(new GetObjectRequest(Config.bucketName, key));
		return object.getObjectContent();
	}

	public static void save(String key, InputStream bytes, ObjectMetadata metadata) {
		ensureS3();
		s3.putObject(new PutObjectRequest(Config.bucketName, key, bytes, metadata));
	}

	public static void save(String key, Image image) throws IOException {
		try (ByteArrayOutputStream bytes = new ByteArrayOutputStream()) {
			ImageIO.write((RenderedImage) image, "jpg", bytes);

			try (ByteArrayInputStream bytes2 = new ByteArrayInputStream(bytes.toByteArray())) {
				save(key, bytes2, null);
			}
		}
	}
}
