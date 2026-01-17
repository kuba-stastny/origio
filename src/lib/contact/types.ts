export type ContactPayload = {
    name: string;
    email: string;
    message: string;
    company?: string;
    industry?: string;
    projectId?: string;
  };
  
  
  export type Recipient = {
    projectId: string;
    projectSlug: string;
    workspaceId: string;
    ownerUserId: string;
    toEmail: string;
  };
  