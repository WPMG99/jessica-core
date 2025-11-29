import requests
import os
import json
import hashlib
import threading
from flask import Flask, request, jsonify
from functools import lru_cache

app = Flask(__name__)

# Connection pooling for HTTP requests
http_session = requests.Session()

# =============================================================================
# SERVICE ENDPOINTS
# =============================================================================
OLLAMA_URL = "http://localhost:11434"
WHISPER_URL = "http://localhost:5000"
MEMORY_URL = "http://localhost:5001"

# =============================================================================
# API KEYS (from environment)
# =============================================================================
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
XAI_API_KEY = os.getenv("XAI_API_KEY")
GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY")
MEM0_API_KEY = os.getenv("MEM0_API_KEY")

# =============================================================================
# MEM0 CONFIGURATION
# =============================================================================
MEM0_BASE_URL = "https://api.mem0.ai/v1"
MEM0_USER_ID = "PhyreBug"

# =============================================================================
# ROUTING KEYWORDS (optimized as sets for O(1) lookup)
# =============================================================================
RESEARCH_KEYWORDS = {
    "research", "look up", "find out", "what's happening", "current", 
    "news", "latest", "search", "investigate", "dig into"
}

COMPLEX_REASONING_KEYWORDS = {
    "analyze", "strategy", "plan", "complex", "detailed", "comprehensive",
    "deep dive", "break down", "explain thoroughly", "compare", "evaluate",
    "business decision", "architecture", "design"
}

DOCUMENT_KEYWORDS = {
    "summarize", "document", "pdf", "file", "extract", "quick lookup",
    "definition", "what is", "explain briefly"
}

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def detect_routing_tier(message: str, explicit_directive: str = None) -> tuple:
    """Three-tier routing logic (optimized)"""
    # Handle explicit directives first (fast path)
    if explicit_directive:
        directive_map = {
            "claude": ("claude", 2, "User requested Claude"),
            "grok": ("grok", 2, "User requested Grok"),
            "gemini": ("gemini", 2, "User requested Gemini"),
            "local": ("local", 2, "User requested local processing")
        }
        return directive_map.get(explicit_directive, ("local", 1, "Standard task - using local Dolphin"))
    
    # Optimized keyword detection - check substring matches efficiently
    # Convert to lowercase once and reuse
    message_lower = message.lower()
    
    # Check each keyword set (early exit on first match)
    for kw in RESEARCH_KEYWORDS:
        if kw in message_lower:
            return ("grok", 1, "Research task detected - using Grok for web access")
    
    for kw in COMPLEX_REASONING_KEYWORDS:
        if kw in message_lower:
            return ("claude", 1, "Complex reasoning detected - using Claude")
    
    for kw in DOCUMENT_KEYWORDS:
        if kw in message_lower:
            return ("gemini", 1, "Document/lookup task - using Gemini")
    
    return ("local", 1, "Standard task - using local Dolphin")


def call_local_ollama(prompt: str, model: str = "dolphin-llama3:8b") -> str:
    """Call local Ollama with Dolphin model"""
    try:
        response = http_session.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False},
            timeout=120
        )
        response.raise_for_status()
        data = response.json()
        return data.get('response', 'Error: No response from local model')
    except Exception as e:
        return f"Error calling local Ollama: {str(e)}"


def call_claude_api(prompt: str, system_prompt: str = "") -> str:
    """Call Claude API for complex reasoning"""
    if not ANTHROPIC_API_KEY:
        return "Error: ANTHROPIC_API_KEY not configured"
    
    try:
        headers = {
            "x-api-key": ANTHROPIC_API_KEY,
            "content-type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        payload = {
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 2048,
            "messages": [{"role": "user", "content": prompt}]
        }
        
        if system_prompt:
            payload["system"] = system_prompt
        
        response = http_session.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json=payload,
            timeout=60
        )
        response.raise_for_status()
        
        data = response.json()
        if "content" in data and len(data["content"]) > 0:
            return data["content"][0]["text"]
        return f"Error: Unexpected Claude response: {data}"
    except Exception as e:
        return f"Error calling Claude API: {str(e)}"


def call_grok_api(prompt: str, system_prompt: str = "") -> str:
    """Call Grok API for research/real-time info"""
    if not XAI_API_KEY:
        return "Error: XAI_API_KEY not configured"
    
    try:
        headers = {
            "Authorization": f"Bearer {XAI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": "grok-beta",
            "messages": messages,
            "max_tokens": 2048
        }
        
        response = http_session.post(
            "https://api.x.ai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )
        response.raise_for_status()
        
        data = response.json()
        if "choices" in data and len(data["choices"]) > 0:
            return data["choices"][0]["message"]["content"]
        return f"Error: Unexpected Grok response: {data}"
    except Exception as e:
        return f"Error calling Grok API: {str(e)}"


def call_gemini_api(prompt: str) -> str:
    """Call Gemini API for quick lookups and document tasks"""
    if not GOOGLE_AI_API_KEY:
        return "Error: GOOGLE_AI_API_KEY not configured"
    
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GOOGLE_AI_API_KEY}"
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        
        response = http_session.post(url, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        
        if "candidates" in data and len(data["candidates"]) > 0:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        return f"Error: Unexpected Gemini response: {data}"
    except Exception as e:
        return f"Error calling Gemini API: {str(e)}"


# =============================================================================
# MEM0 FUNCTIONS
# =============================================================================

def mem0_add_memory(content: str, metadata: dict = None) -> dict:
    """Add memory to Mem0 cloud"""
    if not MEM0_API_KEY:
        return {"error": "MEM0_API_KEY not configured"}
    
    try:
        headers = {
            "Authorization": f"Token {MEM0_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messages": [{"role": "user", "content": content}],
            "user_id": MEM0_USER_ID
        }
        
        if metadata:
            payload["metadata"] = metadata
        
        response = http_session.post(
            f"{MEM0_BASE_URL}/memories/",
            headers=headers,
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        
        return response.json()
    except Exception as e:
        return {"error": str(e)}


def mem0_search_memories(query: str, limit: int = 5) -> list:
    """Search memories in Mem0 cloud"""
    if not MEM0_API_KEY:
        return []
    
    try:
        headers = {
            "Authorization": f"Token {MEM0_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {"query": query, "user_id": MEM0_USER_ID, "limit": limit}
        
        response = http_session.post(
            f"{MEM0_BASE_URL}/memories/search/",
            headers=headers,
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        
        data = response.json()
        return data.get("results", [])
    except Exception as e:
        print(f"Mem0 search error: {e}")
        return []


def mem0_get_all_memories() -> list:
    """Get all memories for user from Mem0"""
    if not MEM0_API_KEY:
        return []
    
    try:
        headers = {"Authorization": f"Token {MEM0_API_KEY}"}
        
        response = http_session.get(
            f"{MEM0_BASE_URL}/memories/?user_id={MEM0_USER_ID}",
            headers=headers,
            timeout=30
        )
        response.raise_for_status()
        
        data = response.json()
        return data.get("results", [])
    except Exception as e:
        print(f"Mem0 get all error: {e}")
        return []


# =============================================================================
# DUAL MEMORY SYSTEM
# =============================================================================

def _store_memory_dual_sync(user_message: str, jessica_response: str, provider_used: str):
    """Internal synchronous function for memory storage"""
    memory_text = f"User: {user_message}\nJessica: {jessica_response}"
    # Use SHA256 for consistent, collision-resistant IDs
    memory_id = hashlib.sha256((user_message + jessica_response).encode()).hexdigest()[:16]
    
    # Store in local ChromaDB
    try:
        http_session.post(
            f"{MEMORY_URL}/store",
            json={
                "id": memory_id,
                "text": memory_text,
                "collection": "conversations",
                "metadata": {"provider": provider_used}
            },
            timeout=5
        )
    except Exception as e:
        print(f"Local memory store failed: {e}")
    
    # Store in Mem0 cloud
    try:
        mem0_add_memory(
            memory_text,
            metadata={"provider": provider_used, "source": "jessica_local"}
        )
    except Exception as e:
        print(f"Mem0 store failed: {e}")


def store_memory_dual(user_message: str, jessica_response: str, provider_used: str):
    """Store memory in both local ChromaDB and Mem0 cloud (non-blocking)"""
    # Fire and forget - don't block the response
    thread = threading.Thread(
        target=_store_memory_dual_sync,
        args=(user_message, jessica_response, provider_used),
        daemon=True
    )
    thread.start()


def recall_memory_dual(query: str) -> dict:
    """Recall from both local ChromaDB and Mem0"""
    context = {"local": [], "cloud": []}
    
    try:
        response = http_session.post(
            f"{MEMORY_URL}/recall",
            json={"query": query, "n": 3},
            timeout=5
        )
        response.raise_for_status()
        context["local"] = response.json().get("documents", [])
    except Exception as e:
        print(f"Local recall failed: {e}")
    
    try:
        cloud_memories = mem0_search_memories(query, limit=3)
        context["cloud"] = [m.get("memory", "") for m in cloud_memories]
    except Exception as e:
        print(f"Mem0 recall failed: {e}")
    
    return context


# =============================================================================
# CACHED RESOURCES
# =============================================================================

@lru_cache(maxsize=1)
def _load_master_prompt():
    """Load and cache master prompt file"""
    try:
        # Get the directory where this script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        prompt_path = os.path.join(script_dir, 'master_prompt.txt')
        with open(prompt_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print("Warning: master_prompt.txt not found, using default")
        return "You are Jessica, a helpful AI assistant."


# =============================================================================
# MAIN CHAT ENDPOINT
# =============================================================================

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data['message']
    explicit_directive = data.get('provider', None)
    
    # Use cached master prompt (no file I/O on every request)
    master_prompt = _load_master_prompt()
    
    memory_context = recall_memory_dual(user_message)
    provider, tier, reason = detect_routing_tier(user_message, explicit_directive)
    
    # Optimized context building using list join
    context_parts = []
    if memory_context["local"] or memory_context["cloud"]:
        context_parts.append("\n\nRelevant context from memory:\n")
        for mem in memory_context["local"][:2]:
            if isinstance(mem, str):
                context_parts.append(f"- {mem[:200]}...\n")
        for mem in memory_context["cloud"][:2]:
            if isinstance(mem, str):
                context_parts.append(f"- {mem[:200]}...\n")
    
    context_text = "".join(context_parts)
    full_prompt = f"{master_prompt}{context_text}\n\nUser: {user_message}\nJessica:"
    
    # Route to appropriate provider
    provider_map = {
        "local": lambda: call_local_ollama(full_prompt),
        "claude": lambda: call_claude_api(user_message, master_prompt + context_text),
        "grok": lambda: call_grok_api(user_message, master_prompt + context_text),
        "gemini": lambda: call_gemini_api(full_prompt)
    }
    
    response_text = provider_map.get(provider, provider_map["local"])()
    
    # Non-blocking memory storage
    store_memory_dual(user_message, response_text, provider)
    
    return jsonify({
        "response": response_text,
        "routing": {"provider": provider, "tier": tier, "reason": reason}
    })


# =============================================================================
# ADDITIONAL ENDPOINTS
# =============================================================================

@app.route('/memory/cloud/search', methods=['POST'])
def search_cloud_memory():
    data = request.json
    query = data.get('query', '')
    results = mem0_search_memories(query)
    return jsonify({"results": results})


@app.route('/memory/cloud/all', methods=['GET'])
def get_all_cloud_memories():
    results = mem0_get_all_memories()
    return jsonify({"results": results})


@app.route('/status', methods=['GET'])
def status():
    """Check status of all API connections"""
    api_status = {
        "local_ollama": False,
        "local_memory": False,
        "claude_api": bool(ANTHROPIC_API_KEY),
        "grok_api": bool(XAI_API_KEY),
        "gemini_api": bool(GOOGLE_AI_API_KEY),
        "mem0_api": bool(MEM0_API_KEY)
    }
    
    try:
        r = http_session.get(f"{OLLAMA_URL}/api/tags", timeout=2)
        api_status["local_ollama"] = r.status_code == 200
    except:
        pass
    
    try:
        r = http_session.get(f"{MEMORY_URL}/health", timeout=2)
        api_status["local_memory"] = r.status_code == 200
    except:
        pass
    
    return jsonify(api_status)


@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    files = {'audio': request.files['audio']}
    response = http_session.post(f"{WHISPER_URL}/transcribe", files=files)
    response.raise_for_status()
    return response.json()


# =============================================================================
# RUN SERVER
# =============================================================================

if __name__ == '__main__':
    print("\n" + "="*60)
    print("JESSICA CORE v2.0 - Three-Tier Routing + Mem0")
    print("="*60)
    print(f"Claude API:     {'✓' if ANTHROPIC_API_KEY else '✗'}")
    print(f"Grok API:       {'✓' if XAI_API_KEY else '✗'}")
    print(f"Gemini API:     {'✓' if GOOGLE_AI_API_KEY else '✗'}")
    print(f"Mem0 API:       {'✓' if MEM0_API_KEY else '✗'}")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=8000)