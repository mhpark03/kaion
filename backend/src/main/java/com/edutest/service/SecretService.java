package com.edutest.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.nio.charset.StandardCharsets;

@Service
@Slf4j
public class SecretService {

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    @Value("${aws.s3.region}")
    private String region;

    @Value("${aws.s3.access-key}")
    private String accessKey;

    @Value("${aws.s3.secret-key}")
    private String secretKey;

    @Value("${aws.s3.secrets-folder}")
    private String secretsFolder;

    private S3Client s3Client;

    @PostConstruct
    public void init() {
        // Skip S3 initialization if credentials are not provided
        if (accessKey == null || accessKey.trim().isEmpty() ||
            secretKey == null || secretKey.trim().isEmpty()) {
            log.warn("AWS credentials not provided. S3 secret storage features will be disabled.");
            log.warn("To enable S3 secrets: Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables");
            return;
        }

        try {
            AwsBasicCredentials awsCredentials = AwsBasicCredentials.create(accessKey, secretKey);

            this.s3Client = S3Client.builder()
                    .region(Region.of(region))
                    .credentialsProvider(StaticCredentialsProvider.create(awsCredentials))
                    .build();

            log.info("S3 Client initialized for bucket: {} in region: {}", bucketName, region);
        } catch (Exception e) {
            log.error("Failed to initialize S3 Client: {}", e.getMessage(), e);
            log.warn("S3 secret storage features will be disabled");
        }
    }

    @PreDestroy
    public void cleanup() {
        if (s3Client != null) {
            s3Client.close();
            log.info("S3 Client closed");
        }
    }

    /**
     * Store a secret in S3
     * @param secretName Name of the secret (e.g., "openai-api-key")
     * @param secretValue The secret value to store
     */
    public void storeSecret(String secretName, String secretValue) {
        if (s3Client == null) {
            throw new RuntimeException("S3 is not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.");
        }

        String s3Key = secretsFolder + secretName;

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .contentType("text/plain")
                    .serverSideEncryption(ServerSideEncryption.AES256)  // Server-side encryption
                    .build();

            s3Client.putObject(putObjectRequest,
                    RequestBody.fromString(secretValue, StandardCharsets.UTF_8));

            log.info("Secret '{}' stored successfully in S3 at: {}", secretName, s3Key);
        } catch (S3Exception e) {
            log.error("Failed to store secret '{}' to S3: {}", secretName, e.getMessage(), e);
            throw new RuntimeException("Failed to store secret to S3: " + e.getMessage(), e);
        }
    }

    /**
     * Retrieve a secret from S3
     * @param secretName Name of the secret (e.g., "openai-api-key")
     * @return The secret value, or null if not found or error occurs
     */
    public String retrieveSecret(String secretName) {
        if (s3Client == null) {
            log.warn("S3 is not configured. Cannot retrieve secret '{}'", secretName);
            return null;
        }

        String s3Key = secretsFolder + secretName;

        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .build();

            byte[] bytes = s3Client.getObjectAsBytes(getObjectRequest).asByteArray();
            String secretValue = new String(bytes, StandardCharsets.UTF_8);

            log.info("Secret '{}' retrieved successfully from S3", secretName);
            return secretValue;
        } catch (NoSuchKeyException e) {
            log.warn("Secret '{}' not found in S3 at: {}", secretName, s3Key);
            return null;
        } catch (S3Exception e) {
            log.error("Failed to retrieve secret '{}' from S3: {}", secretName, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Check if a secret exists in S3
     * @param secretName Name of the secret
     * @return true if secret exists, false otherwise
     */
    public boolean secretExists(String secretName) {
        if (s3Client == null) {
            return false;
        }

        String s3Key = secretsFolder + secretName;

        try {
            HeadObjectRequest headObjectRequest = HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .build();

            s3Client.headObject(headObjectRequest);
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (S3Exception e) {
            log.error("Error checking secret existence: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Delete a secret from S3
     * @param secretName Name of the secret to delete
     */
    public void deleteSecret(String secretName) {
        if (s3Client == null) {
            throw new RuntimeException("S3 is not configured. Cannot delete secret.");
        }

        String s3Key = secretsFolder + secretName;

        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
            log.info("Secret '{}' deleted successfully from S3", secretName);
        } catch (S3Exception e) {
            log.error("Failed to delete secret '{}' from S3: {}", secretName, e.getMessage(), e);
            throw new RuntimeException("Failed to delete secret from S3: " + e.getMessage(), e);
        }
    }
}
