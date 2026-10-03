from typing import Optional, List
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, TimestampMixin

class Contact(Base, TimestampMixin):
    __tablename__ = "contacts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    first_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    title: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # External Integration IDs
    lemlist_lead_id: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    apollo_id: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)

    company_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("companies.id"), nullable=True)
    
    # Contact Behavioral Score
    score: Mapped[int] = mapped_column(Integer, default=0, index=True, nullable=False)
    engagement_status: Mapped[str] = mapped_column(String(30), default="uncontacted", nullable=False) # 'uncontacted', 'warm', 'hot', 'meeting_booked'
    last_active_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    company: Mapped[Optional["Company"]] = relationship("Company", back_populates="contacts")
    events: Mapped[List["EventLog"]] = relationship("EventLog", back_populates="contact", lazy="selectin")
    visitor_links: Mapped[List["VisitorIdentityLink"]] = relationship("VisitorIdentityLink", back_populates="contact", lazy="selectin")


class VisitorIdentityLink(Base, TimestampMixin):
    """Maps anonymous browser cookie/visitor_ids to a known contact profile"""
    __tablename__ = "visitor_identity_links"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    visitor_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    contact_id: Mapped[int] = mapped_column(Integer, ForeignKey("contacts.id"), nullable=False)

    contact: Mapped["Contact"] = relationship("Contact", back_populates="visitor_links")
