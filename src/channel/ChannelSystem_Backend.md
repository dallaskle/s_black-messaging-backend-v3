# Channel System Architecture

## 📁 Folder Structure & Components

### 1. Core Channel Components

#### `index.ts`
- **Purpose:** Central router aggregator
- **Routes Combined:**
  - General Channel Routes
  - Channel Member Routes
  - Direct Message Routes

### 2. General Channels (`/general`)

#### `generalChannel.controller.ts`
- **Handles:** Standard channel operations
- **Key Endpoints:**
  - Create channel
  - Get workspace channels
  - Get single channel
  - Update channel
  - Delete channel
- **Error Handling:**
  - Authentication checks
  - Permission validation
  - Resource verification

#### `generalChannel.service.ts`
- **Purpose:** Business logic for standard channels
- **Key Features:**
  - Channel CRUD operations
  - Access control verification
  - Workspace membership validation
- **Security:**
  - Private/Public channel handling
  - Admin permission checks
  - Workspace member verification

### 3. Direct Messages (`/directMessage`)

#### `directMessage.controller.ts`
- **Handles:** DM-specific operations
- **Key Features:**
  - Create DM channels
  - User validation
  - Error handling

#### `directMessage.service.ts`
- **Purpose:** DM-specific business logic
- **Key Features:**
  - DM channel creation
  - Existing DM check
  - Member validation
- **Security:**
  - Workspace membership verification
  - Duplicate DM prevention

### 4. Channel Members (`/members`)

#### `channelMember.controller.ts`
- **Handles:** Member management
- **Key Features:**
  - Add members to channels
  - Member validation
  - Error handling

#### `channelMember.service.ts`
- **Purpose:** Member management logic
- **Key Features:**
  - Member addition
  - Permission validation
  - Duplicate member prevention
- **Security:**
  - Admin permission checks
  - Workspace membership verification

---

## 🔐 Security Implementation

### Access Control
- **Channel Privacy:**
  - Public channel access
  - Private channel restrictions
  - DM channel privacy
- **Permission Levels:**
  - Channel admin rights
  - Member permissions
  - Workspace-level checks

### Authentication & Authorization
- **Token Validation:**
  - JWT verification
  - User authentication
- **Permission Checks:**
  - Channel admin verification
  - Workspace membership
  - Private channel access

---

## 🗄️ Database Schema

### Tables

#### `channels`
- `id` (UUID)
- `workspace_id` (UUID)
- `name` (string)
- `is_private` (boolean)
- `type` (enum: 'channel' | 'dm')
- `topic` (string, optional)
- `description` (string, optional)
- `created_by` (UUID)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `channel_members`
- `channel_id` (UUID)
- `user_id` (UUID)
- `role` (enum: 'admin' | 'member')
- `joined_at` (timestamp)

---

## 🔄 Operational Flows

### 1. Channel Creation
1. Validate user workspace membership
2. Create channel record
3. Set privacy settings
4. Add creator as admin for private channels

### 2. DM Channel Creation
1. Verify both users' workspace membership
2. Check for existing DM channel
3. Create new DM channel if none exists
4. Add both users as members

### 3. Member Management
1. Verify channel privacy status
2. Check admin permissions
3. Validate new member's workspace membership
4. Add member with appropriate role

### 4. Access Control Flow
1. Authenticate user request
2. Check workspace membership
3. Verify channel access rights
4. Validate specific operation permissions

---

## 🛡️ Error Handling

### Error Categories
- **Authentication Errors:**
  - Missing/invalid token
  - Unauthorized access
- **Permission Errors:**
  - Insufficient privileges
  - Invalid role assignments
- **Resource Errors:**
  - Channel not found
  - Invalid member operations
- **Validation Errors:**
  - Duplicate entries
  - Invalid data formats

---

This implementation provides a robust, secure channel management system with proper separation of concerns between general channels, DMs, and member management, all built on a solid database structure with comprehensive error handling.
