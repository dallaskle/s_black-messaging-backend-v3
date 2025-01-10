# Workspace System Architecture

## 📁 Folder Structure & Components

### 1. `workspaceRoutes.ts`
- **Purpose:** Main router for all workspace-related endpoints.
- **Defined Routes:**
  - `POST /workspaces`: Create new workspace.
  - `GET /workspaces`: List user's workspaces.
  - `GET /workspaces/:id`: Get workspace details.
  - `PUT /workspaces/:id`: Update workspace.
  - `DELETE /workspaces/:id`: Delete workspace.
  - `POST /workspaces/:id/members`: Add/invite members.
  - `GET /workspaces/:id/members`: List members.
  - `DELETE /workspaces/:id/members/:userId`: Remove member.
  - `GET /workspaces/channels`: Get workspace with its channels.

### 2. Controllers

#### `workspaceController.ts`
- **Handles:** Workspace CRUD operations.
- **Key Features:**
  - Creates workspaces with unique URLs.
  - Validates workspace ownership.
  - Manages workspace settings.
  - Retrieves workspace details with associated channels
  - Validates user membership
  - Returns combined workspace and channel data
- **Returns:**
  - Workspace data.
  - Member information.
- **Error Handling:**
  - Permission checks.
  - Duplicate URL handling.
  - Resource not found cases.

#### `memberController.ts`
- **Handles:** Workspace membership operations.
- **Key Features:**
  - Manages member additions/removals.
  - Handles role assignments.
  - Updates member display names.
- **Returns:**
  - Updated member lists.
  - Role information.
  - Comprehensive permission checking.

#### `invitationController.ts`
- **Handles:** Workspace invitations.
- **Key Features:**
  - Generates invitation tokens.
  - Manages invitation expiry.
  - Handles invitation acceptance.
- **Returns:**
  - Invitation links.
  - Invitation status.
  - Proper validation and security checks.

### 3. Services

#### `workspaceService.ts`
- **Purpose:** Core workspace management logic.
- **Key Features:**
  - Workspace creation/deletion.
  - URL validation.
  - Member management.
- **Database Operations:**
  - Workspace CRUD.
  - Member relationship management.
  - Permission checks.

#### `memberService.ts`
- **Purpose:** Member management logic.
- **Key Operations:**
  - Add/remove members.
  - Update roles.
  - Manage display names.
- **Validation:**
  - Role permissions.
  - Membership status.
  - Admin privileges.

#### `invitationService.ts`
- **Purpose:** Invitation system logic.
- **Features:**
  - Token generation.
  - Expiration management.
  - Single-use validation.
  - Email integration.

---

## 🔐 Security Implementation

### Access Control
- **Role-Based Access:**
  - Admin privileges.
  - Member permissions.
  - Public access limitations.
- **Authentication:**
  - Token validation.
  - Session management.
  - Workspace membership verification.
- **Authorization:**
  - Admin-only operations.
  - Member-level permissions.
  - Invitation validation.

### 📝 Error Handling
- **Error Types:**
  - **Workspace Errors:**
    - Invalid workspace URL.
    - Duplicate workspace names.
    - Permission denied.
  - **Member Errors:**
    - Invalid roles.
    - Membership conflicts.
    - Admin requirements.
  - **Invitation Errors:**
    - Expired invitations.
    - Invalid tokens.
    - Usage limitations.

---

## 🗄️ Database Schema

### Tables
#### `workspaces`
- `id` (UUID)
- `name`
- `workspace_url`
- `created_at`
- `updated_at`
- `owner_id`

#### `workspace_members`
- `workspace_id`
- `user_id`
- `role`
- `display_name`
- `joined_at`

#### `workspace_invitations`
- `id`
- `workspace_id`
- `token`
- `email`
- `role`
- `expires_at`
- `used_at`

---

## 🔄 Operational Flows

### 1. Workspace Creation
- Validate workspace name/URL.
- Create workspace record.
- Assign creator as admin.
- Initialize workspace settings.

### 2. Member Management
- Generate/validate invitation.
- Process member addition.
- Assign roles/permissions.
- Update member records.

### 3. Access Control
- Verify authentication.
- Check workspace membership.
- Validate role permissions.
- Execute authorized actions.

### 4. Channel Integration
- Fetch workspace details
- Retrieve associated channels
- Combine data for response
- Validate user permissions
- Handle non-existent cases

---

This implementation provides a secure, scalable workspace management system with proper access controls and member management capabilities, built on top of a robust database structure.

