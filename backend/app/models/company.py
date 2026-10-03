from typing import List, Optional
from datetime import datetime
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, TimestampMixin

class Company(Base, TimestampMixin):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    domain: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    headcount_range: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Firmographic Fit Score (Static ICP match: 0 - 100)
    fit_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Behavioral Intent Score (Dynamic rolling sum: 0 - 500+)
    intent_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Total Consolidated Account Score
    total_score: Mapped[int] = mapped_column(Integer, default=0, index=True, nullable=False)

    tier: Mapped[str] = mapped_column(String(20), default="low", index=True, nullable=False) # 'low', 'medium', 'high', 'hot'
    last_activity_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    contacts: Mapped[List["Contact"]] = relationship("Contact", back_populates="company", lazy="selectin")
    events: Mapped[List["EventLog"]] = relationship("EventLog", back_populates="company", lazy="selectin")
