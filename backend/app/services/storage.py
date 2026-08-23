import boto3
from botocore.config import Config
from app.config import settings

def get_s3_client():
    endpoint_url = f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto"
    )

s3_client = get_s3_client()

def upload_test_object(key: str = "_healthcheck/test.txt", content: str = "healthcheck-ok") -> bool:
    s3_client.put_object(
        Bucket=settings.R2_BUCKET_NAME,
        Key=key,
        Body=content.encode("utf-8"),
        ContentType="text/plain"
    )
    return True

def download_test_object(key: str = "_healthcheck/test.txt") -> str:
    response = s3_client.get_object(
        Bucket=settings.R2_BUCKET_NAME,
        Key=key
    )
    return response["Body"].read().decode("utf-8")