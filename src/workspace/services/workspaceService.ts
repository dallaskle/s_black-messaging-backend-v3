import supabase from '../../config/supabaseClient';
import { Channel, Workspace, WorkspaceWithChannels } from '../../types/database';
import AppError from '../../types/AppError';
import { getWorkspaceChannels } from '../../channel/general/generalChannel.service';

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

  // Get the owner's name
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('name')
    .eq('id', ownerId)
    .single();

  if (userError) throw new AppError(userError.message, 400);
  if (!user) throw new AppError('User not found', 404);

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

  // Add owner as admin member with their name as display_name
  const { error: memberError } = await supabase.from('workspace_members').insert([
    {
      workspace_id: workspace.id,
      user_id: ownerId,
      role: 'admin',
      display_name: user.name,
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
    .eq('user_id', userId);

  if (membershipError) throw new AppError(membershipError.message, 400);

  const workspaceIds = memberships?.map(membership => membership.workspace_id) || [];

  const { data: workspaces, error } = await supabase
    .from('workspaces')
    .select('*')
    .in('id', workspaceIds);

  if (error) throw new AppError(error.message, 400);
  return workspaces || [];
};

export const getWorkspaceWithChannels = async (userId: string): Promise<WorkspaceWithChannels[] | null> => {
  console.log('1. Service: Starting getWorkspaceWithChannels');
  console.log('2. Service: User ID:', userId);

  // Get user's workspaces
const workspaces = await getUserWorkspaces(userId);

  console.log('3. Service: Workspace query result:', { workspaces });

  if (!workspaces || workspaces.length === 0) {
    console.log('5. Service: No workspaces found');
    return null;
  }

  // Get all workspaces and their channels
  const workspacesWithChannels = await Promise.all(workspaces.map(async (workspace) => {
    console.log('6. Service: Selected workspace:', workspace);

    // Get channels for the workspace
    console.log('7. Service: Fetching channels for workspace:', workspace.id);
    const channels = await getWorkspaceChannels(workspace.id, userId);
    console.log('8. Service: Channels fetched:', channels);

    return {
      ...workspace,
      channels
    };
  }));

  console.log('9. Service: Returning workspaces with channels:', workspacesWithChannels);
  return workspacesWithChannels;
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