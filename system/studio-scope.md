# Studio Scope Ceiling

The studio exists for one purpose: triage briefs and renders captured from the public landing.

The studio is NOT:
- A CRM
- A project management tool
- A client portal
- An invoicing system
- A file storage system
- A team collaboration space

Permanent scope:
- View briefs by status (NEW / ACTIVE / COMPLETED)
- View renders captured from landing
- Promote a render to a brief
- Add notes to a brief
- Toggle status
- Soft-delete briefs
- Search and triage indicators

Anything beyond this list belongs in the operator's existing tools (email, Notion, calendar, accounting software) or in a separate product.

Auth upgrade trigger: replace localStorage + header check with proper authentication when ANY of the following occurs:
1. First paid client lead is captured
2. Any client PII beyond what client themselves submitted appears in the system
3. Studio URL is accessed from a device that is not the operator's

Until trigger event: current auth is sufficient.
