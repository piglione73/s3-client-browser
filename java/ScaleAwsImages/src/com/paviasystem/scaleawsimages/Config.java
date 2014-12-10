package com.paviasystem.scaleawsimages;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.Properties;

public class Config {
	public static String bucketName;

	static {
		try {
			// Load config file
			Properties properties = new Properties();
			InputStream stream = Thread.currentThread().getContextClassLoader().getResourceAsStream("ScaleAwsImages.properties");
			if (stream == null)
				throw new Exception("Config file ScaleAwsImages.properties not found in classpath");

			properties.load(stream);
			stream.close();

			// Load all
			Field[] fields = Config.class.getDeclaredFields();
			for (Field field : fields) {
				if (Modifier.isStatic(field.getModifiers()) && Modifier.isPublic(field.getModifiers())) {
					// Field is public + static: find matching property and set
					// it
					String value = properties.getProperty(field.getName());
					if (value != null)
						field.set(null, value);
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
}
