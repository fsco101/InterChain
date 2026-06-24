import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle
import os

OUT = "diagrams"
os.makedirs(OUT, exist_ok=True)

def box(ax, x, y, w, h, lines, fontsize=10, bold_first=False):
    """Draw box with multiple text lines, properly fitted"""
    rect = FancyBboxPatch((x - w/2, y - h/2), w, h,
                          boxstyle="round,pad=0.03", linewidth=2,
                          edgecolor="black", facecolor="white", zorder=3)
    ax.add_patch(rect)
    
    n = len(lines)
    line_h = h / (n + 0.5)
    start_y = y + h/2 - line_h * 0.8
    
    for i, txt in enumerate(lines):
        weight = "bold" if (bold_first and i == 0) else "normal"
        ax.text(x, start_y - i * line_h, txt, ha="center", va="center",
                fontsize=fontsize, color="black", fontweight=weight, zorder=4)

def datastore(ax, x, y, w, h, label, fontsize=10):
    """Draw data store symbol"""
    rect = Rectangle((x - w/2, y - h/2), w, h,
                     linewidth=2, edgecolor="black", facecolor="white", zorder=3)
    ax.add_patch(rect)
    ax.plot([x - w/2, x - w/2], [y - h/2, y + h/2], color="black", linewidth=4, zorder=4)
    ax.text(x, y, label, ha="center", va="center", fontsize=fontsize,
            color="black", fontweight="bold", zorder=5)

def process(ax, x, y, r, label, fontsize=10):
    """Draw process circle"""
    circle = plt.Circle((x, y), r, linewidth=2, edgecolor="black",
                        facecolor="white", zorder=3)
    ax.add_patch(circle)
    ax.text(x, y, label, ha="center", va="center", fontsize=fontsize,
            color="black", fontweight="bold", zorder=4, linespacing=0.9)

def arrow(ax, x1, y1, x2, y2, label=""):
    """Draw arrow with label"""
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="->", color="black", lw=1.5,
                               mutation_scale=20, shrinkA=0, shrinkB=0), zorder=2)
    if label:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        ax.text(mx, my + 0.2, label, fontsize=9, color="black",
                ha="center", va="bottom", zorder=5,
                bbox=dict(facecolor="white", edgecolor="none", pad=2))

def line(ax, x1, y1, x2, y2, label=""):
    ax.plot([x1, x2], [y1, y2], color="black", lw=1.5, zorder=2)
    if label:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        ax.text(mx, my, label, fontsize=9, fontweight="bold",
                bbox=dict(facecolor="white", edgecolor="none", pad=2))

def setup(w, h, title):
    fig, ax = plt.subplots(figsize=(w, h))
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")
    ax.set_xlim(0, w)
    ax.set_ylim(0, h)
    ax.axis("off")
    ax.text(w/2, h - 0.3, title, ha="center", va="top", fontsize=18,
            color="black", fontweight="bold")
    return fig, ax


# ══════════════════════════════════════════════════════════════════════════════
# DIAGRAM 1 — ERD
# ══════════════════════════════════════════════════════════════════════════════

fig, ax = setup(20, 16, "InterChain — Entity Relationship Diagram")

# USERS (center-top)
box(ax, 10, 14, 6, 2.5, [
    "USERS",
    "─────────────────────────────────",
    "_id (PK)",
    "full_name, email, password_hash",
    "role, role_id, internship_id",
    "institution, avatar_url",
    "created_at, updated_at"
], fontsize=11, bold_first=True)

# ACTIVITY_LOGS
box(ax, 2.5, 8.5, 5, 3.2, [
    "ACTIVITY_LOGS",
    "─────────────────────────",
    "_id (PK)",
    "user_id (FK) → USERS",
    "record_type, role",
    "payload:",
    "  internship_id, activity_date",
    "  title, description, hours_spent",
    "blockchain (embedded), created_at"
], fontsize=10, bold_first=True)

# STUDENT_REPORTS
box(ax, 7.5, 8.5, 5, 3.2, [
    "STUDENT_REPORTS",
    "─────────────────────────",
    "_id (PK)",
    "user_id (FK) → USERS",
    "record_type, role",
    "payload:",
    "  internship_id, report_title",
    "  summary",
    "blockchain (embedded), created_at"
], fontsize=10, bold_first=True)

# ATTENDANCE_RECORDS
box(ax, 12.5, 8.5, 5, 3.2, [
    "ATTENDANCE_RECORDS",
    "─────────────────────────",
    "_id (PK)",
    "user_id (FK) → USERS",
    "record_type, role",
    "payload:",
    "  internship_id, student_id",
    "  attendance_date, status, notes",
    "blockchain (embedded), created_at"
], fontsize=10, bold_first=True)

# PERFORMANCE_EVALUATIONS
box(ax, 17.5, 8.5, 5, 3.2, [
    "PERFORMANCE_EVALUATIONS",
    "─────────────────────────",
    "_id (PK)",
    "user_id (FK) → USERS",
    "record_type, role",
    "payload:",
    "  internship_id, student_id",
    "  score (1-10), feedback",
    "blockchain (embedded), created_at"
], fontsize=10, bold_first=True)

# COMPLETION_APPROVALS
box(ax, 2.5, 4, 5, 3.2, [
    "COMPLETION_APPROVALS",
    "─────────────────────────",
    "_id (PK)",
    "user_id (FK) → USERS",
    "record_type, role",
    "payload:",
    "  internship_id, student_id",
    "  approval_date, approved, notes",
    "blockchain (embedded), created_at"
], fontsize=10, bold_first=True)

# CERTIFICATES
box(ax, 7.5, 4, 5, 3.2, [
    "CERTIFICATES",
    "─────────────────────────",
    "_id (PK)",
    "employer_id (FK) → USERS",
    "payload:",
    "  recipient_name, recipient_email",
    "  internship_title, company_name",
    "  signatory_name, start_date, end_date",
    "blockchain (embedded), created_at"
], fontsize=10, bold_first=True)

# INSTRUCTOR_ROSTERS
box(ax, 12.5, 4, 5, 3.2, [
    "INSTRUCTOR_ROSTERS",
    "─────────────────────────",
    "_id (PK)",
    "instructor_id (FK) → USERS",
    "students[]:",
    "  user_id, role_id",
    "  full_name, email",
    "  institution"
], fontsize=10, bold_first=True)

# EMPLOYER_ROSTERS
box(ax, 17.5, 4, 5, 3.2, [
    "EMPLOYER_ROSTERS",
    "─────────────────────────",
    "_id (PK)",
    "employer_id (FK) → USERS",
    "instructors[]:",
    "  user_id, role_id",
    "  full_name, email",
    "  institution"
], fontsize=10, bold_first=True)

# NOTIFICATIONS
box(ax, 7.5, 0.8, 5, 1.4, [
    "NOTIFICATIONS",
    "─────────────────────────",
    "_id (PK) | user_id (FK) → USERS",
    "title, message, type, read, created_at"
], fontsize=10, bold_first=True)

# BLOCKCHAIN META
box(ax, 15, 0.8, 5, 1.4, [
    "BLOCKCHAIN METADATA (embedded)",
    "─────────────────────────",
    "tx_hash, explorer_url, network",
    "recorded_at, status, enabled"
], fontsize=10, bold_first=True)

# Relationship lines
for x in [2.5, 7.5, 12.5, 17.5]:
    line(ax, 10, 12.75, x, 10.1, "1:N")

line(ax, 10, 12.75, 7.5, 1.5, "1:N")

plt.tight_layout()
plt.savefig(f"{OUT}/01_ERD.png", dpi=150, bbox_inches="tight", facecolor="white")
plt.close()
print("ERD saved.")


# ══════════════════════════════════════════════════════════════════════════════
# DIAGRAM 2 — DFD Level 0
# ══════════════════════════════════════════════════════════════════════════════

fig, ax = setup(14, 11, "InterChain — DFD Level 0 (Context Diagram)")

# Central process
process(ax, 7, 5.5, 1.5, "InterChain\nSystem", fontsize=14)

# External entities (left)
box(ax, 2, 9, 2.8, 1, ["Student"], fontsize=12, bold_first=True)
box(ax, 2, 7, 2.8, 1, ["Instructor"], fontsize=12, bold_first=True)
box(ax, 2, 4, 2.8, 1, ["Employer"], fontsize=12, bold_first=True)
box(ax, 2, 2, 2.8, 1, ["Admin"], fontsize=12, bold_first=True)

# External stores (right)
box(ax, 12, 9, 2.8, 1, ["MongoDB"], fontsize=11, bold_first=True)
box(ax, 12, 7, 2.8, 1, ["Blockchain\n(SHA-256)"], fontsize=11, bold_first=True)
box(ax, 12, 5, 2.8, 1, ["Cloudinary\n(Avatars)"], fontsize=11, bold_first=True)
box(ax, 12, 3, 2.8, 1, ["Email Service"], fontsize=11, bold_first=True)

# Arrows
arrow(ax, 3.4, 9, 5.5, 6.5, "signup, login, log activity, submit report")
arrow(ax, 5.5, 6, 3.4, 8.5, "JWT, dashboard, records")

arrow(ax, 3.4, 7, 5.5, 5.8, "login, validate attendance, submit evaluation")
arrow(ax, 5.5, 5.2, 3.4, 6.5, "JWT, roster, records")

arrow(ax, 3.4, 4, 5.5, 5.0, "login, approve completion, issue certificate")
arrow(ax, 5.5, 4.5, 3.4, 3.5, "JWT, approvals, certificates")

arrow(ax, 3.4, 2, 5.5, 4.2, "login, manage users, review records")
arrow(ax, 5.5, 4.0, 3.4, 2.5, "JWT, user list, counts")

arrow(ax, 8.5, 6.5, 10.6, 9, "CRUD records/users")
arrow(ax, 8.5, 6.0, 10.6, 7, "SHA-256 tx_hash")
arrow(ax, 8.5, 5.5, 10.6, 5, "upload/delete avatar")
arrow(ax, 8.5, 5.0, 10.6, 3, "send certificate email")

plt.tight_layout()
plt.savefig(f"{OUT}/02_DFD_Level0.png", dpi=150, bbox_inches="tight", facecolor="white")
plt.close()
print("DFD Level 0 saved.")


# ══════════════════════════════════════════════════════════════════════════════
# DIAGRAM 3 — DFD Level 1
# ══════════════════════════════════════════════════════════════════════════════

fig, ax = setup(18, 13, "InterChain — DFD Level 1")

# External entities
box(ax, 1.5, 11, 2.5, 1, ["Student"], fontsize=11, bold_first=True)
box(ax, 1.5, 8.5, 2.5, 1, ["Instructor"], fontsize=11, bold_first=True)
box(ax, 1.5, 6, 2.5, 1, ["Employer"], fontsize=11, bold_first=True)
box(ax, 1.5, 3.5, 2.5, 1, ["Admin"], fontsize=11, bold_first=True)

# Processes
process(ax, 5.5, 11, 0.9, "P1\nAuth &\nUser Mgmt", fontsize=10)
process(ax, 5.5, 8.5, 0.9, "P2\nActivity &\nReport", fontsize=10)
process(ax, 5.5, 6, 0.9, "P3\nAttendance &\nEvaluation", fontsize=10)
process(ax, 5.5, 3.5, 0.9, "P4\nApproval &\nCertificate", fontsize=10)
process(ax, 9, 8.5, 0.9, "P5\nRoster\nMgmt", fontsize=10)
process(ax, 9, 6, 0.9, "P6\nNotification\nDispatch", fontsize=10)
process(ax, 9, 3.5, 0.9, "P7\nBlockchain\nMetadata", fontsize=10)

# Data stores
datastore(ax, 15, 11.5, 3, 0.7, "D1 users", fontsize=10)
datastore(ax, 15, 10.5, 3, 0.7, "D2 activity_logs", fontsize=10)
datastore(ax, 15, 9.5, 3, 0.7, "D3 student_reports", fontsize=10)
datastore(ax, 15, 8.5, 3, 0.7, "D4 attendance_records", fontsize=10)
datastore(ax, 15, 7.5, 3, 0.7, "D5 performance_evaluations", fontsize=10)
datastore(ax, 15, 6.5, 3, 0.7, "D6 completion_approvals", fontsize=10)
datastore(ax, 15, 5.5, 3, 0.7, "D7 certificates", fontsize=10)
datastore(ax, 15, 4.5, 3, 0.7, "D8 instructor_rosters", fontsize=10)
datastore(ax, 15, 3.5, 3, 0.7, "D9 employer_rosters", fontsize=10)
datastore(ax, 15, 2.5, 3, 0.7, "D10 notifications", fontsize=10)

# External services
box(ax, 17.5, 11.5, 1.5, 0.7, ["Cloudinary"], fontsize=9, bold_first=True)
box(ax, 17.5, 3.5, 1.5, 0.7, ["Email"], fontsize=9, bold_first=True)

# Arrows: Entities -> Processes
arrow(ax, 2.75, 11, 4.6, 11, "signup/login/update")
arrow(ax, 4.6, 11, 2.75, 10.5, "JWT, user data")

arrow(ax, 2.75, 8.5, 4.6, 8.7, "log activity")
arrow(ax, 2.75, 8.5, 4.6, 8.3, "submit report")

arrow(ax, 2.75, 6, 4.6, 6.2, "validate attendance")
arrow(ax, 2.75, 6, 4.6, 5.8, "submit evaluation")

arrow(ax, 2.75, 3.5, 4.6, 3.7, "approve completion")
arrow(ax, 2.75, 3.5, 4.6, 3.3, "issue certificate")

arrow(ax, 2.75, 8.5, 8.1, 8.5, "manage roster")
arrow(ax, 2.75, 6, 8.1, 6, "add instructor")

# Processes -> Data Stores
arrow(ax, 6.4, 11, 13.5, 11.5, "create/update user")
arrow(ax, 6.4, 8.7, 13.5, 10.5, "insert activity")
arrow(ax, 6.4, 8.3, 13.5, 9.5, "insert report")
arrow(ax, 6.4, 6.2, 13.5, 8.5, "insert attendance")
arrow(ax, 6.4, 5.8, 13.5, 7.5, "insert evaluation")
arrow(ax, 6.4, 3.7, 13.5, 6.5, "insert approval")
arrow(ax, 6.4, 3.3, 13.5, 5.5, "insert certificate")
arrow(ax, 9.9, 8.5, 13.5, 4.5, "upsert roster")
arrow(ax, 9.9, 6, 13.5, 2.5, "push notification")

# P7 -> stores (blockchain)
for y in [10.5, 9.5, 8.5, 7.5, 6.5, 5.5]:
    arrow(ax, 9.9, 3.5, 13.5, y)

# External services
arrow(ax, 6.4, 11.2, 16.75, 11.5, "upload avatar")
arrow(ax, 6.4, 3.3, 16.75, 3.5, "send email")

plt.tight_layout()
plt.savefig(f"{OUT}/03_DFD_Level1.png", dpi=150, bbox_inches="tight", facecolor="white")
plt.close()
print("DFD Level 1 saved.")


# ══════════════════════════════════════════════════════════════════════════════
# DIAGRAM 4 — DFD Level 2
# ══════════════════════════════════════════════════════════════════════════════

fig, ax = setup(16, 12, "InterChain — DFD Level 2 (Record Creation Process)")

# Lane backgrounds
for y1, y2, label in [(9, 11.5, "CLIENT"), (6.5, 9, "AUTHENTICATION"), (3.5, 6.5, "BUSINESS LOGIC"), (0.5, 3.5, "PERSISTENCE")]:
    ax.axhspan(y1, y2, facecolor="#f5f5f5", edgecolor="black", linewidth=1)
    ax.text(0.5, (y1+y2)/2, label, fontsize=10, fontweight="bold", rotation=90,
            va="center", ha="center")

# CLIENT LAYER
box(ax, 3, 10.2, 2.5, 1, ["User", "(any role)"], fontsize=11, bold_first=True)
box(ax, 7.5, 10.2, 3, 1, ["HTTP Request", "+ JWT Token"], fontsize=11)
process(ax, 12, 10.2, 0.7, "Route\nGuard", fontsize=10)

# AUTH LAYER
process(ax, 3, 7.7, 0.8, "P2.1\nJWT\nDecode", fontsize=10)
process(ax, 6.5, 7.7, 0.8, "P2.2\nRole\nCheck", fontsize=10)
process(ax, 10, 7.7, 0.8, "P2.3\nSchema\nValidate", fontsize=10)
datastore(ax, 14, 7.7, 1.8, 0.6, "users", fontsize=9)

# BUSINESS LAYER
process(ax, 3, 5, 0.8, "P2.4\nBlockchain\nSHA-256", fontsize=10)
process(ax, 7, 5, 0.8, "P2.5\nDocument\nAssembly", fontsize=10)
process(ax, 11.5, 5, 0.8, "P2.6\nNotify", fontsize=10)

# PERSISTENCE LAYER
datastore(ax, 3, 2, 2.5, 0.8, "MongoDB\nRecords", fontsize=10)
datastore(ax, 7, 2, 2.5, 0.8, "MongoDB\nNotifications", fontsize=10)
box(ax, 12, 2, 2.5, 1, ["Response", "JSON"], fontsize=11, bold_first=True)

# CLIENT LAYER FLOW
def arrow_custom(ax, x1, y1, x2, y2, label="", offset_y=0.2):
    """Custom arrow with adjustable label offset"""
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="->", color="black", lw=1.5,
                               mutation_scale=20, shrinkA=0, shrinkB=0), zorder=2)
    if label:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        ax.text(mx, my + offset_y, label, fontsize=8, color="black",
                ha="center", va="bottom", zorder=5,
                bbox=dict(facecolor="white", edgecolor="none", pad=1))

arrow_custom(ax, 4.25, 10.2, 6, 10.2, "submit")
arrow_custom(ax, 9, 10.2, 11.3, 10.2, "POST")
arrow_custom(ax, 12, 9.5, 10, 8.5, "route", 0.15)

# AUTH LAYER FLOW
arrow_custom(ax, 3, 8.5, 3, 6.9, "decode", -0.4)
arrow_custom(ax, 3.8, 7.7, 5.7, 7.7, "user_id", 0.15)
arrow_custom(ax, 7.3, 7.7, 9.2, 7.7, "role OK", 0.15)
arrow_custom(ax, 10, 6.9, 10, 6.5, "valid", -0.4)

# USER LOOKUP
arrow_custom(ax, 6.5, 8.5, 13.1, 7.9, "lookup", 0.3)
arrow_custom(ax, 13.1, 7.5, 7.3, 7.5, "user", -0.15)

# AUTH TO BUSINESS
arrow_custom(ax, 3, 6.9, 3, 5.8, "user", -0.4)
arrow_custom(ax, 7, 6.9, 7, 5.8, "payload", -0.4)
arrow_custom(ax, 10, 6.2, 11.5, 5.8, "notif", 0.15)

# BUSINESS LAYER FLOW
arrow_custom(ax, 3.8, 5, 6.2, 5, "metadata", 0.15)
arrow_custom(ax, 7.8, 5, 10.7, 5, "notif data", 0.15)

# BUSINESS TO PERSISTENCE
arrow_custom(ax, 3, 4.2, 3, 2.8, "insert", -0.4)
arrow_custom(ax, 11.5, 4.2, 7, 2.8, "notify", 0.3)
arrow_custom(ax, 7, 4.2, 7, 2.8, "build", -0.4)

# PERSISTENCE LAYER
arrow_custom(ax, 4.5, 2, 5.75, 2, "inserted", 0.15)
arrow_custom(ax, 8.25, 2, 10.5, 2, "saved", 0.15)
arrow_custom(ax, 12, 2.8, 12, 9, "return", 0.3)

plt.tight_layout()
plt.savefig(f"{OUT}/04_DFD_Level2.png", dpi=150, bbox_inches="tight", facecolor="white")
plt.close()
print("DFD Level 2 saved.")

print("\nAll diagrams saved to ./diagrams/")
