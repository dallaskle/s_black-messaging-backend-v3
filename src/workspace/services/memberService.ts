import supabase from '../../config/supabaseClient';
import { WorkspaceMember } from '../../types/database';
import AppError from '../../types/AppError';

export const getWorkspaceMembers = async (
  workspaceId: string,
  userId: string
): Promise<WorkspaceMember[]> => {
  // Check if user is a member
  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  if (membershipError || !membership) {
    throw new AppError('Access denied', 403);
  }

  const { data: members, error } = await supabase
    .from('workspace_members')
    .select('*, users!inner(*)')
    .eq('workspace_id', workspaceId);

  if (error) throw new AppError(error.message, 400);
  return members || [];
};

export const addWorkspaceMember = async (
  workspaceId: string,
  adminId: string,
  newMemberId: string,
  role: 'admin' | 'member' = 'member'
): Promise<WorkspaceMember> => {
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

  // Get the new member's name
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('name')
    .eq('id', newMemberId)
    .single();

  if (userError) throw new AppError(userError.message, 400);
  if (!user) throw new AppError('User not found', 404);

  const { data: member, error } = await supabase
    .from('workspace_members')
    .insert([
      {
        workspace_id: workspaceId,
        user_id: newMemberId,
        role,
        display_name: user.name,
      },
    ])
    .select()
    .single();

  if (error) throw new AppError(error.message, 400);
  if (!member) throw new AppError('Failed to add member', 500);

  return member;
};

export const updateWorkspaceMember = async (
  workspaceId: string,
  adminId: string,
  userId: string,
  updates: Partial<WorkspaceMember>
): Promise<WorkspaceMember> => {
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

  const { data: member, error } = await supabase
    .from('workspace_members')
    .update(updates)
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new AppError(error.message, 400);
  if (!member) throw new AppError('Member not found', 404);

  return member;
};

export const removeWorkspaceMember = async (
  workspaceId: string,
  adminId: string,
  userId: string
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
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (error) throw new AppError(error.message, 400);
}; 