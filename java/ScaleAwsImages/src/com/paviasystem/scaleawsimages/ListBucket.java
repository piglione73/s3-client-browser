package com.paviasystem.scaleawsimages;

import java.util.LinkedList;
import java.util.Spliterators.AbstractSpliterator;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import com.amazonaws.services.s3.AmazonS3Client;
import com.amazonaws.services.s3.model.ListObjectsRequest;
import com.amazonaws.services.s3.model.ObjectListing;

public class ListBucket {
	public static Stream<String> stream() {
		return StreamSupport.stream(new ListBucketSpliterator(), false);
	}

	static class ListBucketSpliterator extends AbstractSpliterator<String> {
		AmazonS3Client s3 = null;

		LinkedList<String> queue = new LinkedList<>();
		boolean mustCallS3 = true;
		String marker = null;

		protected ListBucketSpliterator() {
			super(Long.MAX_VALUE, 0);
		}

		@Override
		public boolean tryAdvance(Consumer<? super String> action) {
			if (s3 == null)
				s3 = new AmazonS3Client();

			// If something in queue, return it
			if (!queue.isEmpty()) {
				action.accept(queue.removeFirst());
				return true;
			}

			// If queue is empty, then try to get new values from S3
			// mustCallS3 is true if additional keys are to be read from S3
			// If mustCallS3 is false, then no additional keys are to be read
			// from S3
			if (mustCallS3) {
				ObjectListing listing = s3.listObjects(new ListObjectsRequest().withBucketName(Config.bucketName).withMarker(marker));
				Stream<String> listOfKeys = listing.getObjectSummaries().stream().map(x -> x.getKey());
				queue.addAll(listOfKeys.collect(Collectors.toList()));
				marker = listing.getNextMarker();
				mustCallS3 = listing.isTruncated();

				// Return the first key, if present. If not present, then we are
				// over
				if (queue.isEmpty())
					return false;
				else {
					action.accept(queue.removeFirst());
					return true;
				}
			} else {
				// End of listing
				return false;
			}
		}
	}
}
