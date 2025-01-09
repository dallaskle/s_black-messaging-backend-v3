interface FileData {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export const messageApi = {
  createMessage: async (
    channelId: string, 
    content: string, 
    parentMessageId?: string,
    fileData?: FileData
  ) => {
    const { data } = await axiosInstance.post<Message>(
      `/api/channels/${channelId}/messages`,
      { 
        content, 
        parentMessageId,
        file: fileData ? {
          url: fileData.fileUrl,
          name: fileData.fileName,
          size: fileData.fileSize,
          type: fileData.fileType
        } : undefined 
      }
    );

    if (!data.name) {
      try {
        const { data: userData } = await axiosInstance.get('/api/users/me');
        return { ...data, name: userData.name };
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      }
    }

    return data;
  },
  // ... rest of the code
}; 