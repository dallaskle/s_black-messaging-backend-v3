# Reactions System Architecture

## 📁 Folder Structure & Components

### 1. `reactionRoutes.ts`
- **Purpose:** Main router for all reaction-related endpoints.
- **Defined Routes:**
  - `POST /channels/:channelId/messages/:messageId/reactions`: Add reaction
  - `DELETE /channels/:channelId/messages/:messageId/reactions`: Remove reaction
  - `GET /channels/:channelId/messages/:messageId/reactions`: Get message reactions
  - `GET /channels/:channelId/messages/:messageId/reactions/count`: Get reaction counts
  - `GET /channels/:channelId/messages/reactions`: Get channel reactions
  - `GET /workspaces/:workspaceId/reactions/popular`: Get popular workspace reactions
- **Security:** All routes protected by authentication middleware

### 2. Controllers

#### `messageReactionController.ts`
- **Handles:** Message-level reaction operations
- **Key Features:**
  - Add/remove reactions
  - Get message reactions
  - Get reaction counts
- **Error Handling:**
  - Authentication validation
  - Message existence checks
  - Emoji validation

#### `channelReactionController.ts`
- **Handles:** Channel-level reaction operations
- **Key Features:**
  - Get all reactions in a channel
- **Security:**
  - Channel access validation
  - Authentication checks

#### `workspaceReactionController.ts`
- **Handles:** Workspace-level reaction analytics
- **Key Features:**
  - Get popular reactions across workspace
- **Security:**
  - Workspace membership validation

### 3. Services

#### `messageReactionService.ts`
- **Purpose:** Core reaction management logic
- **Key Features:**
  - Reaction creation/deletion
  - Reaction retrieval
  - Count aggregation
- **Database Operations:**
  - Reaction CRUD operations
  - User data enrichment

#### `channelReactionService.ts`
- **Purpose:** Channel-wide reaction operations
- **Key Features:**
  - Channel reaction aggregation
  - Access control validation
- **Security:**
  - Channel membership checks

#### `workspaceReactionService.ts`
- **Purpose:** Workspace reaction analytics
- **Key Features:**
  - Popular reaction tracking
  - Usage statistics
- **Access Control:**
  - Workspace membership validation

### 4. Utils

#### `accessControl.ts`
- **Purpose:** Centralized access control logic
- **Features:**
  - Channel access validation
  - Private channel handling
  - Workspace membership checks

---

## 🔐 Security Implementation

### Access Control
- **Authentication:**
  - Token validation
  - User identification
- **Authorization:**
  - Channel access verification
  - Workspace membership
  - Private channel handling

### Error Handling
- **Error Types:**
  - Authentication errors
  - Permission errors
  - Resource not found
  - Validation errors
  - Duplicate reactions

---

## 🔄 Operational Flows

### 1. Adding Reaction
- Validate authentication
- Check channel access
- Verify message exists
- Handle duplicate reactions (toggle behavior)
- Create reaction record
- Return reaction data

### 2. Removing Reaction
- Validate authentication
- Check channel access
- Remove reaction record
- Return success status

### 3. Retrieving Reactions
- Validate access rights
- Apply any filters
- Aggregate reaction data
- Enrich with user information
- Return formatted response

### 4. Popular Reactions
- Validate workspace access
- Aggregate reaction counts
- Sort by popularity
- Return trending reactions

---

This implementation provides a comprehensive reaction system supporting message, channel, and workspace-level operations with proper access controls and error handling. The system supports reaction toggling, analytics, and detailed reaction tracking across different scopes.