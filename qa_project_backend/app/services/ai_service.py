import openai
import tiktoken
from typing import List, Dict, Optional
from ..config import settings
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        if settings.OPENAI_API_KEY:
            openai.api_key = settings.OPENAI_API_KEY
        self.encoding = tiktoken.get_encoding("cl100k_base")
    
    def count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        return len(self.encoding.encode(text))
    
    async def summarize_question(self, title: str, content: str, answers: List[Dict] = None) -> str:
        """Generate AI summary of a question and its answers"""
        if not settings.OPENAI_API_KEY:
            return "AI summarization not configured"
        
        try:
            # Prepare context
            context = f"Question: {title}\n\nDetails: {content}"
            
            if answers:
                context += "\n\nAnswers:\n"
                for i, answer in enumerate(answers[:3], 1):  # Limit to top 3 answers
                    context += f"{i}. {answer.get('content', '')[:500]}...\n"
            
            # Check token count and truncate if necessary
            if self.count_tokens(context) > 3000:
                context = context[:3000] + "..."
            
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that summarizes Q&A discussions. Provide a concise, informative summary that captures the key points of the question and any provided answers."
                    },
                    {
                        "role": "user",
                        "content": f"Please summarize this Q&A discussion:\n\n{context}"
                    }
                ],
                max_tokens=200,
                temperature=0.3
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"AI summarization failed: {e}")
            return "Summary generation failed"
    
    async def suggest_tags(self, title: str, content: str) -> List[str]:
        """Suggest relevant tags for a question using AI"""
        if not settings.OPENAI_API_KEY:
            return []
        
        try:
            text = f"{title}\n{content}"
            if self.count_tokens(text) > 2000:
                text = text[:2000] + "..."
            
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that suggests relevant tags for programming and technical questions. Return only a comma-separated list of 3-5 relevant tags, no explanations."
                    },
                    {
                        "role": "user",
                        "content": f"Suggest relevant tags for this question:\n\n{text}"
                    }
                ],
                max_tokens=50,
                temperature=0.2
            )
            
            tags_text = response.choices[0].message.content.strip()
            tags = [tag.strip().lower() for tag in tags_text.split(',')]
            return tags[:5]  # Limit to 5 tags
            
        except Exception as e:
            logger.error(f"Tag suggestion failed: {e}")
            return []
    
    async def generate_answer_quality_score(self, answer_content: str, question_context: str) -> float:
        """Generate a quality score for an answer (0-1)"""
        if not settings.OPENAI_API_KEY:
            return 0.5  # Default neutral score
        
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at evaluating answer quality. Rate the answer on a scale of 0-1 based on accuracy, completeness, clarity, and helpfulness. Return only a number between 0 and 1."
                    },
                    {
                        "role": "user",
                        "content": f"Question context: {question_context[:500]}\n\nAnswer to evaluate: {answer_content[:1000]}\n\nQuality score (0-1):"
                    }
                ],
                max_tokens=10,
                temperature=0.1
            )
            
            score_text = response.choices[0].message.content.strip()
            try:
                score = float(score_text)
                return max(0, min(1, score))  # Ensure 0-1 range
            except ValueError:
                return 0.5
                
        except Exception as e:
            logger.error(f"Answer quality scoring failed: {e}")
            return 0.5

# Global instance
ai_service = AIService()