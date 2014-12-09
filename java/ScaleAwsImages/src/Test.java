import com.amazonaws.services.s3.AmazonS3Client;
import com.amazonaws.services.s3.model.ListObjectsRequest;


public class Test {

	public static void main(String[] args) {
		AmazonS3Client s3 = new AmazonS3Client();
		s3.listObjects(new ListObjectsRequest().withBucketName(""));
	}

}
