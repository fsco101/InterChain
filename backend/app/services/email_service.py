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
    if settings.smtp_from:
        msg["From"] = f"{settings.smtp_from} <{settings.smtp_user}>"
    else:
        msg["From"] = settings.smtp_user
    msg["To"] = to_email

    html_body = f"""
    <html>
      <body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;line-height:1.6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border:1px solid #334155;border-radius:12px;max-width:600px;margin:0 auto;text-align:left;">
                <tr>
                  <td style="background-color:#0f172a;padding:24px;border-bottom:1px solid #334155;text-align:center;">
                    <h1 style="margin:0;font-size:22px;color:#38bdf8;letter-spacing:1.5px;font-weight:700;text-transform:uppercase;">InterChain</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 24px;">
                    <p style="margin:0 0 16px 0;font-size:16px;">Dear <strong>{recipient_name}</strong>,</p>
                    <p style="margin:0 0 24px 0;font-size:16px;">Please find your internship e-certificate from <strong style="color:#a78bfa;">{company_name}</strong> below.</p>
                    <div style="background-color:#0f172a;padding:16px;border-radius:8px;border:1px solid #334155;margin-bottom:24px;">
                      {cert_html}
                    </div>
                    <p style="margin:0;color:#94a3b8;font-size:14px;font-style:italic;">
                      This certificate is blockchain-verified via InterChain and permanently recorded on the immutable ledger.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#0f172a;padding:24px;border-top:1px solid #334155;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#64748b;">
                      &copy; 2026 InterChain. All rights reserved.<br/>
                      Next-Generation Internship Platform
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """
    msg.attach(MIMEText(html_body, "html"))

    if pdf_bytes:
        part = MIMEBase("application", "octet-stream")
        part.set_payload(pdf_bytes)
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", 'attachment; filename="certificate.pdf"')
        msg.attach(part)

    use_tls = settings.smtp_port == 465
    start_tls = settings.smtp_port == 587

    await aiosmtplib.send(
        msg,
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_user,
        password=settings.smtp_pass,
        use_tls=use_tls,
        start_tls=start_tls,
    )

async def send_verification_email(to_email: str, code: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Verify Your Account - InterChain"
    if settings.smtp_from:
        msg["From"] = f"{settings.smtp_from} <{settings.smtp_user}>"
    else:
        msg["From"] = settings.smtp_user
    msg["To"] = to_email

    html_body = f"""
    <html>
      <body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;line-height:1.6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border:1px solid #334155;border-radius:12px;max-width:600px;margin:0 auto;text-align:left;">
                <tr>
                  <td style="background-color:#0f172a;padding:24px;border-bottom:1px solid #334155;text-align:center;">
                    <h1 style="margin:0;font-size:22px;color:#38bdf8;letter-spacing:1.5px;font-weight:700;text-transform:uppercase;">InterChain</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 24px;">
                    <p style="margin:0 0 16px 0;font-size:16px;">Hello,</p>
                    <p style="margin:0 0 24px 0;font-size:16px;">Please use the following 6-digit code to verify your InterChain account:</p>
                    <div style="background-color:#0f172a;padding:24px;border-radius:8px;border:1px dashed #38bdf8;text-align:center;margin-bottom:24px;">
                      <h2 style="margin:0;color:#38bdf8;font-size:36px;letter-spacing:8px;">{code}</h2>
                    </div>
                    <p style="margin:0;color:#94a3b8;font-size:14px;">
                      This code will expire shortly. If you did not request this, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#0f172a;padding:24px;border-top:1px solid #334155;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#64748b;">
                      &copy; 2026 InterChain. All rights reserved.<br/>
                      Next-Generation Internship Platform
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """
    msg.attach(MIMEText(html_body, "html"))

    use_tls = settings.smtp_port == 465
    start_tls = settings.smtp_port == 587

    await aiosmtplib.send(
        msg,
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_user,
        password=settings.smtp_pass,
        use_tls=use_tls,
        start_tls=start_tls,
    )

async def send_password_reset_email(to_email: str, code: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Password Reset Request - InterChain"
    if settings.smtp_from:
        msg["From"] = f"{settings.smtp_from} <{settings.smtp_user}>"
    else:
        msg["From"] = settings.smtp_user
    msg["To"] = to_email

    html_body = f"""
    <html>
      <body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;line-height:1.6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border:1px solid #334155;border-radius:12px;max-width:600px;margin:0 auto;text-align:left;">
                <tr>
                  <td style="background-color:#0f172a;padding:24px;border-bottom:1px solid #334155;text-align:center;">
                    <h1 style="margin:0;font-size:22px;color:#38bdf8;letter-spacing:1.5px;font-weight:700;text-transform:uppercase;">InterChain</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 24px;">
                    <p style="margin:0 0 16px 0;font-size:16px;">Hello,</p>
                    <p style="margin:0 0 24px 0;font-size:16px;">We received a request to reset your password. Use the code below to proceed:</p>
                    <div style="background-color:#0f172a;padding:24px;border-radius:8px;border:1px dashed #f43f5e;text-align:center;margin-bottom:24px;">
                      <h2 style="margin:0;color:#f43f5e;font-size:36px;letter-spacing:8px;">{code}</h2>
                    </div>
                    <p style="margin:0;color:#94a3b8;font-size:14px;">
                      If you did not request a password reset, please secure your account and ignore this email.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#0f172a;padding:24px;border-top:1px solid #334155;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#64748b;">
                      &copy; 2026 InterChain. All rights reserved.<br/>
                      Next-Generation Internship Platform
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """
    msg.attach(MIMEText(html_body, "html"))

    use_tls = settings.smtp_port == 465
    start_tls = settings.smtp_port == 587

    await aiosmtplib.send(
        msg,
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_user,
        password=settings.smtp_pass,
        use_tls=use_tls,
        start_tls=start_tls,
    )
