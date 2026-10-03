from typing import Optional
from datetime import datetime
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.models.base import Base

class ScoreAuditLog(Base):
    __tablename__ = "score_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entity_type: Mapped[str] = mapped_column(String(20), index=True, nullable=False) # 'contact' or 'company'
    entity_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    
    previous_score: Mapped[int] = mapped_column(Integer, nullable=False)
    point_delta: Mapped[int] = mapped_column(Integer, nullable=False)
    new_score: Mapped[int] = mapped_column(Integer, nullable=False)
    
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True, nullable=False)
