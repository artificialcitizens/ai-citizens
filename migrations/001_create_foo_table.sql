   CREATE TABLE foo (
     id SERIAL PRIMARY KEY,
     name VARCHAR(255),
     value FLOAT
   );

CREATE TABLE documents (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB
);

-- Create an index on workspace_id for faster queries
CREATE INDEX idx_documents_workspace_id ON documents(workspace_id);
