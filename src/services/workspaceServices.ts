import supabase from '../config/supabaseClient';
import { Workspace, WorkspaceMember } from '../types/database';
import AppError from '../types/AppError';

export const createWorkspace = async (
  name: string,
  ownerId: string,
  workspaceUrl: string
): Promise<Workspace> => {
  // Check if workspace URL is already taken
  const { data: existingWorkspace } = await supabase
    .from('workspaces')
    .select('workspace_url')
    .eq('workspace_url', workspaceUrl)
    .single();

  if (existingWorkspace) {
    throw new AppError('Workspace URL already taken', 400);
  }

  // Create workspace
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .insert([
      {
        name,
        owner_id: ownerId,
        workspace_url: workspaceUrl,
      },
    ])
    .select()
    .single();

  if (error) throw new AppError(error.message, 400);
  if (!workspace) throw new AppError('Failed to create workspace', 500);

  // Add owner as admin member
  const { error: memberError } = await supabase.from('workspace_members').insert([
    {
      workspace_id: workspace.id,
      user_id: ownerId,
      role: 'admin',
    },
  ]);

  if (memberError) throw new AppError(memberError.message, 400);

  return workspace;
};

export const getUserWorkspaces = async (userId: string): Promise<Workspace[]> => {
  // Fetch all workspaces along with their associated workspace members for a specific user
  const { data: memberships, error: membershipError } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId); // Fetch all workspace IDs for the user

  if (membershipError) throw new AppError(membershipError.message, 400);

  const workspaceIds = memberships?.map(membership => membership.workspace_id) || [];

  const { data: workspaces, error } = await supabase
    .from('workspaces')
    .select('*')
    .in('id', workspaceIds); // Fetch workspaces based on the collected workspace IDs

  if (error) throw new AppError(error.message, 400);
  return workspaces || [];
};

export const getWorkspaceById = async (
  workspaceId: string,
  userId: string
): Promise<Workspace> => {
  // Check if user is a member of the workspace
  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  if (membershipError || !membership) {
    throw new AppError('Access denied', 403);
  }

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single();

  if (error || !workspace) throw new AppError('Workspace not found', 404);
  return workspace;
};

export const updateWorkspace = async (
  workspaceId: string,
  userId: string,
  updates: Partial<Workspace>
): Promise<Workspace> => {
  // Check if user is an admin
  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  if (membershipError || !membership || membership.role !== 'admin') {
    throw new AppError('Access denied', 403);
  }

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .update(updates)
    .eq('id', workspaceId)
    .select()
    .single();

  if (error) throw new AppError(error.message, 400);
  if (!workspace) throw new AppError('Workspace not found', 404);

  return workspace;
};

export const deleteWorkspace = async (
  workspaceId: string,
  userId: string
): Promise<void> => {
  // Check if user is an admin
  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  if (membershipError || !membership || membership.role !== 'admin') {
    throw new AppError('Access denied', 403);
  }

  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId);

  if (error) throw new AppError(error.message, 400);
};

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

  const { data: member, error } = await supabase
    .from('workspace_members')
    .insert([
      {
        workspace_id: workspaceId,
        user_id: newMemberId,
        role,
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