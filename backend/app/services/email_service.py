from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email import encoders

import aiosmtplib

from app.core.config import settings


async def send_certificate_email(
    to_email: str,
    recipient_name: str,
    company_name: str,
    cert_html: str,
    pdf_bytes: bytes | None = None,
) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Internship Certificate – {company_name}"
    msg["From"] = settings.smtp_from or settings.smtp_user
    msg["To"] = to_email

    html_body = f"""
    <html><body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:24px;">
      <p>Dear <strong>{recipient_name}</strong>,</p>
      <p>Please find your internship e-certificate from <strong>{company_name}</strong> below.</p>
      {cert_html}
      <p style="color:#94a3b8;font-size:0.85rem;margin-top:24px;">
        This certificate is blockchain-verified via InterChain.
      </p>
    </body></html>
    """
    msg.attach(MIMEText(html_body, "html"))

    if pdf_bytes:
        part = MIMEBase("application", "octet-stream")
        part.set_payload(pdf_bytes)
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", 'attachment; filename="certificate.pdf"')
        msg.attach(part)

    await aiosmtplib.send(
        msg,
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_user,
        password=settings.smtp_pass,
        start_tls=True,
    )
