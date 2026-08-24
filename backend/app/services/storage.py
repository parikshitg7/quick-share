import boto3
from botocore.config import Config
from app.config import settings

def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )

def upload_file_bytes(file_bytes: bytes, object_key: str, content_type: str = "application/octet-stream"):
    s3 = get_s3_client()
    s3.put_object(
        Bucket=settings.R2_BUCKET_NAME,
        Key=object_key,
        Body=file_bytes,
        ContentType=content_type,
    )

def get_file_stream(object_key: str):
    s3 = get_s3_client()
    response = s3.get_object(
        Bucket=settings.R2_BUCKET_NAME,
        Key=object_key,
    )
    return response["Body"], response.get("ContentType", "application/octet-stream")

def delete_file_object(object_key: str):
    s3 = get_s3_client()
    s3.delete_object(
        Bucket=settings.R2_BUCKET_NAME,
        Key=object_key,
    )

# Healthcheck helper functions from Phase 1.3
def upload_test_object(key: str = "_healthcheck/test.txt", content: str = "healthcheck-ok") -> bool:
    s3 = get_s3_client()
    s3.put_object(
        Bucket=settings.R2_BUCKET_NAME,
        Key=key,
        Body=content.encode("utf-8"),
        ContentType="text/plain"
    )
    return True

def download_test_object(key: str = "_healthcheck/test.txt") -> str:
    s3 = get_s3_client()
    response = s3.get_object(
        Bucket=settings.R2_BUCKET_NAME,
        Key=key
    )
    return response["Body"].read().decode("utf-8")