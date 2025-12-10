from pinecone import Pinecone, ServerlessSpec
from app.config import get_settings
from app.services.llm_service import llm_service
from typing import List, Dict, Any
import uuid

settings = get_settings()

class RAGService:
    def __init__(self):
        self.pc = None
        self.index = None
        self.initialized = False

    def initialize(self):
        if self.initialized:
            return
        
        if not settings.PINECONE_API_KEY:
            print("Pinecone API Key not set. RAG disabled.")
            return

        try:
            self.pc = Pinecone(api_key=settings.PINECONE_API_KEY)
            
            # Check if index exists, create if not
            existing_indexes = [i.name for i in self.pc.list_indexes()]
            if settings.PINECONE_INDEX_NAME not in existing_indexes:
                self.pc.create_index(
                    name=settings.PINECONE_INDEX_NAME,
                    dimension=768, # nomic-embed-text
                    metric='cosine',
                    spec=ServerlessSpec(
                        cloud='aws',
                        region=settings.PINECONE_ENVIRONMENT
                    )
                )
            
            self.index = self.pc.Index(settings.PINECONE_INDEX_NAME)
            self.initialized = True
            print("Pinecone Initialized Successfully")
            
        except Exception as e:
            print(f"Error initializing Pinecone: {e}")

    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Simple text chunker via character count."""
        chunks = []
        for i in range(0, len(text), chunk_size - overlap):
            chunks.append(text[i:i + chunk_size])
        return chunks

    async def upsert_document(self, text: str, metadata: Dict[str, Any], namespace: str = "default"):
        if not self.initialized:
            self.initialize()
            if not self.initialized:
                return

        chunks = self.chunk_text(text)
        vectors = []
        
        for i, chunk in enumerate(chunks):
            embedding = await llm_service.get_embedding(chunk)
            if not embedding:
                continue
                
            doc_id = f"{metadata.get('filename', 'doc')}_{i}_{uuid.uuid4().hex[:8]}"
            
            # Metadata for the chunk
            chunk_metadata = metadata.copy()
            chunk_metadata['text'] = chunk
            chunk_metadata['chunk_index'] = i
            
            vectors.append({
                "id": doc_id,
                "values": embedding,
                "metadata": chunk_metadata
            })
            
        # Batch upsert (limit 100 per request usually safe)
        if vectors:
            try:
                # Upsert in batches of 100
                batch_size = 100
                for i in range(0, len(vectors), batch_size):
                    batch = vectors[i:i+batch_size]
                    self.index.upsert(vectors=batch, namespace=namespace)
            except Exception as e:
                print(f"Error upserting vectors: {e}")

    async def query_context(self, query: str, namespace: str = "default", top_k: int = 5, filter: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        if not self.initialized:
            self.initialize()
            if not self.initialized:
                return []

        embedding = await llm_service.get_embedding(query)
        if not embedding:
            return []

        try:
            query_params = {
                "namespace": namespace,
                "vector": embedding,
                "top_k": top_k,
                "include_metadata": True
            }

            # Add filter if provided (e.g., {"project_id": 1})
            if filter:
                query_params["filter"] = filter

            results = self.index.query(**query_params)

            matches = []
            for match in results['matches']:
                matches.append({
                    "text": match['metadata'].get('text', ''),
                    "score": match['score'],
                    "metadata": match['metadata']
                })

            return matches

        except Exception as e:
            print(f"Error querying Pinecone: {e}")
            return []

rag_service = RAGService()
