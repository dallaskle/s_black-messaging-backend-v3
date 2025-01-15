import supabase from '../../config/supabaseClient';
import { WorkspaceInvitation, WorkspaceMember } from '../../types/database';
import AppError from '../../types/AppError';
import { randomBytes } from 'crypto';
import { emailService } from '../../services/emailService';
import { config } from '../../config';

interface AdminMembershipWithDetails {
  role: string;
  workspaces: { name: string };
  users: { name: string };
}

export const createWorkspaceInvitation = async (
  workspaceId: string,
  adminId: string,
  email: string,
  role: 'admin' | 'member' = 'member',
  expiresIn?: number,
  singleUse: boolean = false
): Promise<WorkspaceInvitation> => {

  // Check if admin has permissions and get workspace info
  const { data: adminMembership, error: adminError } = await supabase
    .from('workspace_members')
    .select(`
      role,
      workspaces:workspace_id (
        name
      ),
      users:user_id (
        name
      )
    `)
    .eq('workspace_id', workspaceId)
    .eq('user_id', adminId)
    .single();

  if (adminError || !adminMembership || adminMembership.role !== 'admin') {
    throw new AppError('Access denied', 403);
  }

  // Cast to unknown first to avoid type checking errors
  const membership = adminMembership as unknown as AdminMembershipWithDetails;
  const workspaceName = membership.workspaces?.name;
  const inviterName = membership.users?.name;

  if (!workspaceName || !inviterName) {
    throw new AppError('Failed to retrieve workspace or user details', 500);
  }

  // Generate unique token
  const token = randomBytes(32).toString('hex');
  
  // Calculate expiration if provided
  const expires_at = expiresIn ? new Date(Date.now() + expiresIn).toISOString() : null;

  const { data: invitation, error } = await supabase
    .from('workspace_invitations')
    .insert([
      {
        workspace_id: workspaceId,
        email,
        token,
        role,
        expires_at,
        single_use: singleUse,
        created_by: adminId,
      },
    ])
    .select()
    .single();

  if (error) throw new AppError(error.message, 400);
  if (!invitation) throw new AppError('Failed to create invitation', 500);

  // Generate invite link
  const inviteLink = `${config.app.frontendUrl}/workspaces/${workspaceId}/invite/${token}`;

  // Send invitation email
  try {
    await emailService.sendWorkspaceInvite({
      to: email,
      inviterName,
      workspaceName,
      inviteLink,
      expiresIn: expiresIn,
    });
  } catch (error) {
    // If email fails, we still return the invitation but log the error
    console.error('[createWorkspaceInvitation] Failed to send invitation email:', error);
  }

  return invitation;
};

export const getWorkspaceInvitations = async (
  workspaceId: string,
  adminId: string
): Promise<WorkspaceInvitation[]> => {
  // Check if admin has permissions
  const { data: adminMembership, error: adminError } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', adminId)
    .single();

  if (adminError || !adminMembership || adminMembership.role !== 'admin') {
    throw new AppError('Access denied', 403);
  }

  const { data: invitations, error } = await supabase
    .from('workspace_invitations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('created_by', adminId);

  if (error) throw new AppError(error.message, 400);
  return invitations || [];
};

export const acceptWorkspaceInvitation = async (
  workspaceId: string,
  token: string,
  userId: string
): Promise<WorkspaceMember> => {
  // Verify invitation
  const { data: invitation, error: inviteError } = await supabase
    .from('workspace_invitations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('token', token)
    .single();

  if (inviteError || !invitation) {
    throw new AppError('Invalid invitation', 400);
  }

  // Check if expired
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    throw new AppError('Invitation has expired', 400);
  }

  // Add member
  const { data: member, error: memberError } = await supabase
    .from('workspace_members')
    .insert([
      {
        workspace_id: workspaceId,
        user_id: userId,
        role: invitation.role,
        invitation_code: token,
      },
    ])
    .select()
    .single();

  if (memberError) throw new AppError(memberError.message, 400);
  if (!member) throw new AppError('Failed to add member', 500);

  // If single use, expire the invitation
  if (invitation.single_use) {
    await supabase
      .from('workspace_invitations')
      .update({ expires_at: new Date().toISOString() })
      .eq('id', invitation.id);
  }

  return member;
};

export const revokeWorkspaceInvitation = async (
  workspaceId: string,
  invitationId: string,
  adminId: string
): Promise<void> => {
  // Check if admin has permissions
  const { data: adminMembership, error: adminError } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', adminId)
    .single();

  if (adminError || !adminMembership || adminMembership.role !== 'admin') {
    throw new AppError('Access denied', 403);
  }

  const { error } = await supabase
    .from('workspace_invitations')
    .delete()
    .eq('id', invitationId)
    .eq('workspace_id', workspaceId)
    .eq('created_by', adminId);

  if (error) throw new AppError(error.message, 400);
}; 