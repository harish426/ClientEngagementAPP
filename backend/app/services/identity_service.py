from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.company import Company
from backend.app.models.contact import Contact, VisitorIdentityLink
from backend.app.schemas.track import IdentityPayload

GENERIC_MAIL_PROVIDERS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "protonmail.com"
}

class IdentityService:
    def extract_corporate_domain(self, email: Optional[str]) -> Optional[str]:
        if not email or "@" not in email:
            return None
        domain = email.split("@")[1].strip().lower()
        if domain in GENERIC_MAIL_PROVIDERS:
            return None
        return domain

    async def get_or_create_company(
        self, db: AsyncSession, domain: str, name: Optional[str] = None
    ) -> Company:
        domain = domain.strip().lower()
        stmt = select(Company).where(Company.domain == domain)
        result = await db.execute(stmt)
        company = result.scalar_one_or_none()

        if not company:
            company = Company(
                domain=domain,
                name=name or domain.split(".")[0].capitalize(),
                fit_score=20, # Baseline default fit score
                intent_score=0,
                total_score=20,
                tier="low"
            )
            db.add(company)
            await db.flush()
            await db.refresh(company)
        elif name and not company.name:
            company.name = name
            await db.flush()

        return company

    async def resolve_identity(
        self, db: AsyncSession, identity: IdentityPayload
    ) -> Tuple[Optional[Contact], Optional[Company]]:
        """
        Stitches visitorId -> Contact -> Company:
        1. If email is provided, find or create Contact and link visitorId.
        2. If visitorId was previously linked, retrieve existing Contact.
        3. Match or create Company and attach to Contact.
        """
        contact: Optional[Contact] = None
        company: Optional[Company] = None

        # 1. Check if email is supplied directly in this request (e.g. from Lemlist URL link)
        if identity.email:
            email = identity.email.strip().lower()
            stmt = select(Contact).where(Contact.email == email)
            result = await db.execute(stmt)
            contact = result.scalar_one_or_none()

            # Determine company domain
            corp_domain = identity.companyDomain or self.extract_corporate_domain(email)
            if corp_domain:
                company = await self.get_or_create_company(db, corp_domain, identity.companyName)

            if not contact:
                contact = Contact(
                    email=email,
                    lemlist_lead_id=identity.campaignLeadId,
                    company_id=company.id if company else None,
                    score=0,
                    engagement_status="warm"
                )
                db.add(contact)
                await db.flush()
                await db.refresh(contact)
            else:
                if company and not contact.company_id:
                    contact.company_id = company.id
                if identity.campaignLeadId and not contact.lemlist_lead_id:
                    contact.lemlist_lead_id = identity.campaignLeadId
                await db.flush()

            # Ensure visitor_id link is saved for future anonymous pageviews
            if identity.visitorId:
                link_stmt = select(VisitorIdentityLink).where(
                    VisitorIdentityLink.visitor_id == identity.visitorId,
                    VisitorIdentityLink.contact_id == contact.id
                )
                link_res = await db.execute(link_stmt)
                if not link_res.scalar_one_or_none():
                    link = VisitorIdentityLink(visitor_id=identity.visitorId, contact_id=contact.id)
                    db.add(link)
                    await db.flush()

            return contact, company

        # 2. If no email in request, check if visitor_id was previously linked to a Contact
        if identity.visitorId:
            link_stmt = select(VisitorIdentityLink).where(
                VisitorIdentityLink.visitor_id == identity.visitorId
            )
            link_res = await db.execute(link_stmt)
            link = link_res.scalar_one_or_none()
            if link:
                contact_stmt = select(Contact).where(Contact.id == link.contact_id)
                c_res = await db.execute(contact_stmt)
                contact = c_res.scalar_one_or_none()
                if contact and contact.company_id:
                    comp_stmt = select(Company).where(Company.id == contact.company_id)
                    comp_res = await db.execute(comp_stmt)
                    company = comp_res.scalar_one_or_none()
                return contact, company

        # 3. If only companyDomain is passed without email
        if identity.companyDomain:
            company = await self.get_or_create_company(db, identity.companyDomain, identity.companyName)

        return contact, company
