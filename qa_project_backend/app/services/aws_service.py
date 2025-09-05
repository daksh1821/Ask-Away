import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from typing import Optional, Dict, Any
import json
import logging
from datetime import datetime
from ..config import settings

logger = logging.getLogger(__name__)

class AWSService:
    def __init__(self):
        self.s3_client = None
        self.cloudwatch_client = None
        
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            try:
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_REGION
                )
                
                self.cloudwatch_client = boto3.client(
                    'cloudwatch',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_REGION
                )
            except NoCredentialsError:
                logger.warning("AWS credentials not properly configured")
    
    async def upload_file_to_s3(self, file_content: bytes, file_key: str, content_type: str = 'application/octet-stream') -> Optional[str]:
        """Upload file to S3 and return URL"""
        if not self.s3_client or not settings.AWS_S3_BUCKET:
            logger.warning("S3 not configured")
            return None
        
        try:
            self.s3_client.put_object(
                Bucket=settings.AWS_S3_BUCKET,
                Key=file_key,
                Body=file_content,
                ContentType=content_type
            )
            
            # Generate URL
            url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{file_key}"
            return url
            
        except ClientError as e:
            logger.error(f"S3 upload failed: {e}")
            return None
    
    async def backup_data_to_s3(self, data: Dict[str, Any], backup_key: str) -> bool:
        """Backup platform data to S3"""
        if not self.s3_client:
            return False
        
        try:
            # Convert data to JSON
            json_data = json.dumps(data, default=str, indent=2)
            
            # Upload to S3
            self.s3_client.put_object(
                Bucket=settings.AWS_S3_BUCKET,
                Key=f"backups/{backup_key}",
                Body=json_data.encode('utf-8'),
                ContentType='application/json'
            )
            
            logger.info(f"Data backup successful: {backup_key}")
            return True
            
        except ClientError as e:
            logger.error(f"S3 backup failed: {e}")
            return False
    
    async def send_metric_to_cloudwatch(self, metric_name: str, value: float, unit: str = 'Count', namespace: str = 'QAPlatform') -> bool:
        """Send custom metric to CloudWatch"""
        if not self.cloudwatch_client:
            return False
        
        try:
            self.cloudwatch_client.put_metric_data(
                Namespace=namespace,
                MetricData=[
                    {
                        'MetricName': metric_name,
                        'Value': value,
                        'Unit': unit,
                        'Timestamp': datetime.utcnow()
                    }
                ]
            )
            return True
            
        except ClientError as e:
            logger.error(f"CloudWatch metric failed: {e}")
            return False
    
    async def send_platform_metrics(self, metrics: Dict[str, float]) -> bool:
        """Send multiple platform metrics to CloudWatch"""
        if not self.cloudwatch_client:
            return False
        
        try:
            metric_data = []
            for metric_name, value in metrics.items():
                metric_data.append({
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                })
            
            # CloudWatch allows max 20 metrics per call
            for i in range(0, len(metric_data), 20):
                batch = metric_data[i:i+20]
                self.cloudwatch_client.put_metric_data(
                    Namespace='QAPlatform',
                    MetricData=batch
                )
            
            return True
            
        except ClientError as e:
            logger.error(f"CloudWatch metrics batch failed: {e}")
            return False

# Global instance
aws_service = AWSService()