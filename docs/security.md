# AttendX — Security Architecture & Threat Mitigation

**Institute:** GCRG Group of Institutions, Lucknow  
**Standard:** Enterprise Academic Governance & Zero-Trust Architecture  

---

## 1. Authentication & Credential Storage

### Argon2id Password Hashing
All user passwords are encrypted using **Argon2id** (`Type.ID`), the password hashing algorithm recommended by OWASP:
- **Salt:** Cryptographically random 16-byte salt per password.
- **Memory Hardness:** Enforces multi-megabyte memory cost to resist parallelized ASIC and GPU brute-force attacks.
- **First-Login Policy:** The provisioned initial administrator (`ADM-001`) and newly registered accounts carry a mandatory `must_change_password=True` flag, preventing persistent default credential risks.

### JSON Web Tokens (JWT)
- **Algorithm:** HMAC-SHA256 with an environment-configured secret key.
- **Payload:** Contains `sub` (user ID), `code` (user code), `role` (`ADMIN`, `TEACHER`, `STUDENT`), and an expiration timestamp `exp`.
- **Validation:** Every incoming request resolves the user directly against the active database state, ensuring revoked or deactivated users are rejected instantly even if their token has not expired.

---

## 2. Biometric Privacy & Vector Storage

Biometric data governance complies with modern privacy principles:

1. **Zero Raw Frame Persistence:** Uploaded camera frames are received in memory, decoded using OpenCV, and immediately discarded after vector calculation. Neither student face photos nor raw JPEG files are stored on disk or database.
2. **Normalized 128-Dimensional Embeddings:** Biometric identity is represented as a 128-dimensional floating-point mathematical vector. It is mathematically irreversible—an original facial image cannot be reconstructed from the vector.
3. **Template Invalidation:** When an administrator or student re-enrolls or resets biometric templates, prior templates are marked inactive (`is_active=False`) and excluded from subsequent matching operations.

---

## 3. Dynamic Cryptographic QR Tokens

QR code attendance prevents classroom proxy attendance and remote sharing:

- **HMAC-SHA256 Signed Payload:** Generated QR codes contain a signed payload: `session_id:timestamp:nonce:signature`.
- **Short Validity Window:** Tokens automatically expire after an administratively configured duration (default: 30 minutes).
- **Single-Use Student Nonce:** Students cannot scan the same QR session multiple times; the backend enforces a unique composite constraint on `(lecture_session_id, student_id)`.

---

## 4. GPS Geofencing & Anti-Spoofing

Attendance verification couples biometrics/QR with geospatial verification:

- **Haversine Spherical Distance:** Computes great-circle distance between the student's device coordinates and the Lucknow campus center (`26.8467° N, 80.9462° E`):
  $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1 \cos\phi_2 \sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
- **Campus Radius Restriction:** Check-ins occurring beyond the configured boundary radius (default: 200m) are rejected.
- **Accuracy Threshold Filter:** GPS coordinates with an accuracy radius exceeding 100 meters (indicating coarse cellular triangulation or simulated location software) are rejected.

---

## 5. Defense Against Formula Injection (CSV / Excel)

Exported reports are vulnerable to formula injection when opened in spreadsheet software like Microsoft Excel or LibreOffice Calc. AttendX sanitizes all string fields before export:

```python
def sanitize_cell_value(val: Any) -> Any:
    if isinstance(val, str) and val.startswith(("=", "+", "-", "@")):
        return f"'{val}"
    return val
```
This guarantees that student names, roll numbers, or remarks cannot execute arbitrary macros or external DDE commands.

---

## 6. Immutable Security Audit Logging

All privileged and sensitive operations generate tamper-evident audit records in the `audit_logs` table:

- **Audited Actions:** Logins, failed authentication attempts, biometric enrollment, biometric resets, manual attendance entries, audited attendance corrections, notification broadcasts, and geofence updates.
- **Context Recorded:** Actor user ID, actor role, timestamp (UTC), IP address, targeted resource type, target resource ID, and detailed textual justification.
