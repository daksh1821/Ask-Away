from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime, timedelta
from .. import database, auth, models, crud
from ..services.slack_service import slack_service
from ..services.aws_service import aws_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/integrations", tags=["integrations"])

@router.post("/slack/notify")
async def send_slack_notification(
    channel: str,
    message: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Send a custom notification to Slack"""
    try:
        success = await slack_service.send_notification(channel, message)
        return {
            "success": success,
            "channel": channel,
            "message": message,
            "sent_by": current_user.username
        }
    except Exception as e:
        logger.error(f"Slack notification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send Slack notification"
        )

@router.post("/slack/daily-summary")
async def send_daily_summary(
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Send daily platform summary to Slack"""
    try:
        # Calculate yesterday's stats
        yesterday = datetime.utcnow() - timedelta(days=1)
        start_of_yesterday = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_yesterday = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        new_questions = db.query(models.Question).filter(
            models.Question.created_at >= start_of_yesterday,
            models.Question.created_at <= end_of_yesterday
        ).count()
        
        new_answers = db.query(models.Answer).filter(
            models.Answer.created_at >= start_of_yesterday,
            models.Answer.created_at <= end_of_yesterday
        ).count()
        
        active_users = db.query(models.User).filter(
            models.User.updated_at >= start_of_yesterday,
            models.User.updated_at <= end_of_yesterday
        ).count()
        
        total_views = db.query(models.QuestionView).filter(
            models.QuestionView.created_at >= start_of_yesterday,
            models.QuestionView.created_at <= end_of_yesterday
        ).count()
        
        stats = {
            "new_questions": new_questions,
            "new_answers": new_answers,
            "active_users": active_users,
            "total_views": total_views
        }
        
        # Send to Slack in background
        background_tasks.add_task(slack_service.send_daily_summary, stats)
        
        return {
            "message": "Daily summary scheduled for sending",
            "stats": stats
        }
        
    except Exception as e:
        logger.error(f"Daily summary failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send daily summary"
        )

@router.post("/aws/backup")
async def backup_platform_data(
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Backup platform data to AWS S3"""
    try:
        # Prepare backup data
        backup_data = {
            "backup_timestamp": datetime.utcnow().isoformat(),
            "backup_by": current_user.username,
            "stats": crud.get_platform_stats(db),
            "recent_questions": [
                {
                    "id": q.id,
                    "title": q.title,
                    "created_at": q.created_at.isoformat(),
                    "views_count": q.views_count
                }
                for q in crud.list_questions(db, limit=100)
            ]
        }
        
        backup_key = f"platform_backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        
        # Schedule backup in background
        background_tasks.add_task(aws_service.backup_data_to_s3, backup_data, backup_key)
        
        return {
            "message": "Backup scheduled",
            "backup_key": backup_key,
            "data_size": len(str(backup_data))
        }
        
    except Exception as e:
        logger.error(f"Backup scheduling failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to schedule backup"
        )

@router.post("/aws/metrics")
async def send_platform_metrics(
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Send platform metrics to AWS CloudWatch"""
    try:
        # Gather metrics
        stats = crud.get_platform_stats(db)
        
        # Calculate additional metrics
        avg_answers_per_question = stats['total_answers'] / max(stats['total_questions'], 1)
        
        metrics = {
            "TotalUsers": float(stats['total_users']),
            "TotalQuestions": float(stats['total_questions']),
            "TotalAnswers": float(stats['total_answers']),
            "TotalStars": float(stats['total_stars']),
            "TotalViews": float(stats['total_views']),
            "AvgAnswersPerQuestion": avg_answers_per_question
        }
        
        # Send metrics in background
        background_tasks.add_task(aws_service.send_platform_metrics, metrics)
        
        return {
            "message": "Metrics scheduled for sending to CloudWatch",
            "metrics": metrics
        }
        
    except Exception as e:
        logger.error(f"Metrics sending failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send metrics"
        )

@router.get("/status")
async def get_integrations_status(
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get status of all integrations"""
    try:
        return {
            "slack": {
                "configured": bool(slack_service.client),
                "status": "active" if slack_service.client else "not_configured"
            },
            "aws": {
                "s3_configured": bool(aws_service.s3_client),
                "cloudwatch_configured": bool(aws_service.cloudwatch_client),
                "status": "active" if aws_service.s3_client and aws_service.cloudwatch_client else "partial"
            },
            "ai": {
                "openai_configured": bool(ai_service and hasattr(ai_service, 'encoding')),
                "status": "active" if ai_service else "not_configured"
            }
        }
    except Exception as e:
        logger.error(f"Integration status check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check integration status"
        )