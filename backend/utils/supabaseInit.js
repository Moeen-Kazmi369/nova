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
    `);

    // 3. Create match_documents function for RAG retrieval
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
