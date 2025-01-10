# Messages System Architecture V2

## 📁 Folder Structure & Components

### 1. `messageRoutes.ts`
- **Purpose:** Main router for all message-related endpoints.
- **Defined Routes:**
  - `POST /channels/:channelId/messages`: Create new message (with optional file).
  - `PATCH /messages/:messageId`: Update message.
  - `DELETE /messages/:messageId`: Delete message.
  - `GET /channels/:channelId/messages`: List channel messages.
  - `GET /messages/:messageId/thread`: Get thread messages.
- **Security:** All routes protected by authentication middleware.
- **File Handling:** Uses multer middleware for file uploads.

### 2. Controllers

#### `createMessageController.ts`
- **Handles:** Message creation with/without files.
- **Key Features:**
  - Validates user authentication.
  - Handles file attachments.
  - Supports thread replies (parent messages).
- **Error Handling:**
  - Content validation.
  - Authentication checks.
  - File upload errors.

#### `deleteMessageController.ts`
- **Handles:** Message deletion.
- **Key Features:**
  - Validates message ownership.
  - Cascading deletion of attachments.
- **Security:**
  - Authentication checks.
  - Ownership validation.

#### `readMessageController.ts`
- **Handles:** Message retrieval operations.
- **Key Features:**
  - Pagination support.
  - Thread message retrieval.
  - Channel message listing.
  - File attachment processing.
- **Returns:**
  - Enriched message data.
  - File information.
  - User details.

#### `updateMessageController.ts`
- **Handles:** Message content updates.
- **Key Features:**
  - Content validation.
  - Ownership verification.
- **Security:**
  - Authentication checks.
  - Content validation.

### 3. Services

#### `createMessageService.ts`
- **Purpose:** Core message creation logic.
- **Key Features:**
  - Message insertion.
  - File handling.
  - Thread support.
  - Message enrichment.
- **Database Operations:**
  - Message creation.
  - File linking.
  - Data enrichment.

#### `deleteMessageService.ts`
- **Purpose:** Message deletion logic.
- **Key Features:**
  - Message removal.
  - File cleanup.
  - Ownership validation.
- **Security:**
  - Access control.
  - Resource cleanup.

#### `readMessageService.ts`
- **Purpose:** Message retrieval logic.
- **Key Features:**
  - Channel access validation.
  - Pagination.
  - Thread handling.
  - File URL signing.
- **Access Control:**
  - Channel membership checks.
  - Workspace membership validation.
  - Private channel handling.

#### `updateMessageService.ts`
- **Purpose:** Message update logic.
- **Key Features:**
  - Content updates.
  - Timestamp management.
  - Data enrichment.
- **Validation:**
  - Ownership checks.
  - Content validation.

### 4. Utils

#### `fileUrlSigner.ts`
- **Purpose:** Generate signed URLs for file access.
- **Features:**
  - URL signing.
  - Error handling.
  - Fallback mechanisms.

#### `messageEnricher.ts`
- **Purpose:** Enhance message data with additional context.
- **Features:**
  - User information.
  - Reaction processing.
  - Display name resolution.

---

## 🔐 Security Implementation

### Access Control
- **Authentication:**
  - Token validation.
  - User identification.
- **Authorization:**
  - Message ownership.
  - Channel access.
  - Workspace membership.

### Error Handling
- **Error Types:**
  - Authentication errors.
  - Permission errors.
  - Resource not found.
  - File handling errors.
  - Validation errors.

---

## 🔄 Operational Flows

### 1. Message Creation
- Validate authentication.
- Handle file upload (if present).
- Create message record.
- Link files (if any).
- Enrich response data.

### 2. Message Retrieval
- Validate channel access.
- Check privacy settings.
- Apply pagination.
- Process file URLs.
- Enrich with user data.

### 3. Message Updates
- Verify ownership.
- Validate content.
- Update timestamp.
- Return enriched data.

### 4. Message Deletion
- Verify ownership.
- Clean up files.
- Remove message record.
- Handle cascading deletions.

---

This implementation provides a robust message management system with comprehensive file handling, thread support, and proper access controls, built on top of a secure and scalable architecture. 