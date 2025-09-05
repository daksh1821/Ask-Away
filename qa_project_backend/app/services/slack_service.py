from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from typing import Dict, Optional
import json
import logging
from ..config import settings

logger = logging.getLogger(__name__)

class SlackService:
    def __init__(self):
        self.client = None
        if settings.SLACK_BOT_TOKEN:
            self.client = WebClient(token=settings.SLACK_BOT_TOKEN)
    
    async def send_notification(self, channel: str, message: str, blocks: Optional[list] = None) -> bool:
        """Send a notification to Slack channel"""
        if not self.client:
            logger.warning("Slack client not configured")
            return False
        
        try:
            response = self.client.chat_postMessage(
                channel=channel,
                text=message,
                blocks=blocks
            )
            return response["ok"]
        except SlackApiError as e:
            logger.error(f"Slack notification failed: {e}")
            return False
    
    async def notify_new_question(self, question: Dict, user: Dict) -> bool:
        """Notify about new question posted"""
        if not self.client:
            return False
        
        blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"🆕 *New Question Posted*\n\n*{question['title']}*\n\n{question['content'][:200]}{'...' if len(question['content']) > 200 else ''}"
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"Asked by {user['first_name']} {user['last_name']} (@{user['username']})"
                    }
                ]
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "View Question"
                        },
                        "url": f"http://localhost:5173/question/{question['id']}"
                    }
                ]
            }
        ]
        
        return await self.send_notification(
            channel="#qa-platform",
            message=f"New question: {question['title']}",
            blocks=blocks
        )
    
    async def notify_new_answer(self, question: Dict, answer: Dict, user: Dict) -> bool:
        """Notify about new answer posted"""
        if not self.client:
            return False
        
        blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"💬 *New Answer Posted*\n\nFor question: *{question['title']}*\n\n{answer['content'][:200]}{'...' if len(answer['content']) > 200 else ''}"
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"Answered by {user['first_name']} {user['last_name']} (@{user['username']})"
                    }
                ]
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "View Answer"
                        },
                        "url": f"http://localhost:5173/question/{question['id']}"
                    }
                ]
            }
        ]
        
        return await self.send_notification(
            channel="#qa-platform",
            message=f"New answer for: {question['title']}",
            blocks=blocks
        )
    
    async def send_daily_summary(self, stats: Dict) -> bool:
        """Send daily platform summary"""
        if not self.client:
            return False
        
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "📊 Daily Q&A Platform Summary"
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*New Questions:*\n{stats.get('new_questions', 0)}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*New Answers:*\n{stats.get('new_answers', 0)}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Active Users:*\n{stats.get('active_users', 0)}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Total Views:*\n{stats.get('total_views', 0)}"
                    }
                ]
            }
        ]
        
        return await self.send_notification(
            channel="#qa-platform-stats",
            message="Daily platform summary",
            blocks=blocks
        )

# Global instance
slack_service = SlackService()