const { Client } = require("pg");
require("dotenv").config();

async function initializeSupabase() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.warn("SUPABASE_DB_URL not found in .env. Skipping table creation.");
    return false;
  }

  const client = new Client({
    connectionString: dbUrl,
  });

  try {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL for initialization.");

    // 1. Enable pgvector extension
    await client.query("CREATE EXTENSION IF NOT EXISTS vector;");

    // 2. Create documents table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id bigserial PRIMARY KEY,
        ai_model_id text NOT NULL,
        content text NOT NULL,
        embedding vector(1536),
        metadata jsonb,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- Enable Row Level Security (RLS)
      ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

      -- Create policy to allow service_role (backend) full access
      -- Note: service_role already bypasses RLS, but this is explicit.
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Allow service_role full access') THEN
              CREATE POLICY "Allow service_role full access" ON documents FOR ALL TO service_role USING (true) WITH CHECK (true);
          END IF;
      END $$;
    `);

    // 3. Create match_documents function for RAG retrieval
    // Added SECURITY DEFINER so that it can be called by anon/authenticated users 
    // while still having access to the RLS-enabled documents table.
    await client.query(`
      CREATE OR REPLACE FUNCTION match_documents (
        query_embedding vector(1536),
        p_ai_model_id text,
        match_count int DEFAULT 5
      ) RETURNS TABLE (
        id bigint,
        content text,
        metadata jsonb,
        similarity float
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY
        SELECT
          documents.id,
          documents.content,
          documents.metadata,
          1 - (documents.embedding <=> query_embedding) AS similarity
        FROM documents
        WHERE documents.ai_model_id = p_ai_model_id
        ORDER BY documents.embedding <=> query_embedding
        LIMIT match_count;
      END;
      $$;
    `);

    console.log("Supabase 'documents' table and 'match_documents' function checked/created successfully.");
    return true;
  } catch (error) {
    console.error("Error initializing Supabase database:", error.message);
    return false;
  } finally {
    await client.end();
  }
}

module.exports = initializeSupabase;
